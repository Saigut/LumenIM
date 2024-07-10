import Base from './base'
import { nextTick } from 'vue'
import { parseTime } from '@/utils/datetime'
import * as message from '@/constant/message'
import { formatTalkItem, palyMusic, formatTalkRecord } from '@/utils/talk'
import { isElectronMode } from '@/utils/common'
import { ServeClearTalkUnreadNum, ServeCreateTalkList } from '@/api/chat'
import { useTalkStore, useDialogueStore, useSettingsStore } from '@/store'
import grpcClient from "@/grpc-client";
import {gen_grpc} from "@/gen_grpc/api";
import {useEntityInfoStore} from "@/store/modules/entityinfo";

/**
 * 好友状态事件
 */
// 应该遵循 Resource 类型的数据结构
class Talk extends Base {
  /**
   * @var resource 资源
   */
  // typs: ResourceData
  resource

  /**
   * 发送者ID
   */
  sender_id = 0

  /**
   * 接收者ID
   */
  receiver_id = 0

  /**
   * 聊天类型[1:私聊;2:群聊;]
   */
  talk_type = 0

  is_read = false

  /**
   * 初始化构造方法
   *
   * @param {Object} resource Socket消息
   */
  // resource: Resource
  constructor(resource) {
    super()

    this.sender_id = resource.sender_id
    this.receiver_id = resource.receiver_id
    this.talk_type = resource.talk_type
    this.is_read = resource.is_read
    this.resource = resource.data

    this.handle()
  }

  /**
   * 判断消息发送者是否来自于我
   * @returns
   */
  isCurrSender() {
    return this.sender_id == this.getAccountId()
  }

  /**
   * 获取对话索引
   *
   * @return String
   */
  getIndexName() {
    if (this.talk_type == 2) {
      return `${this.talk_type}_${this.receiver_id}`
    }

    let receiver_id = this.isCurrSender() ? this.receiver_id : this.sender_id

    return `${this.talk_type}_${receiver_id}`
  }

  getIndexNums() {
    if (this.talk_type == 2) {
      return [this.talk_type, this.receiver_id]
    }

    let receiver_id = this.isCurrSender() ? this.receiver_id : this.sender_id

    return [this.talk_type, receiver_id]
  }

  /**
   * 获取聊天列表左侧的对话信息
   */
  getTalkText() {
    let text = ''
    if (this.resource.msg_type != message.ChatMsgTypeText) {
      text = message.ChatMsgTypeMapping[this.resource.msg_type]
    } else {
      text = this.resource.extra.content.replace(/<img .*?>/g, '')
    }

    return text
  }

  // 播放提示音
  play() {
    // 客户端有消息提示
    if (isElectronMode()) return

    useSettingsStore().isPromptTone && palyMusic()
  }

  handle() {
    // 不是自己发送的消息则需要播放提示音
    if (!this.isCurrSender()) {
      this.play()
    }

    // 判断会话列表是否存在，不存在则创建
    if (useTalkStore().findTalkIndex(this.getIndexName()) === -1) {
      this.addTalkItem()
    }

    // 判断当前是否正在和好友对话
    if (this.isTalk(this.talk_type, this.receiver_id, this.sender_id)) {
      this.insertTalkRecord()
    } else {
      this.justInsertTalkRecord()
      this.updateTalkUnreadNum(this.resource)
    }
  }

  /**
   * 显示消息提示
   * @returns
   */
  showMessageNocice() {
    if (useSettingsStore().isLeaveWeb) {
      const notification = new Notification('LumenIM 在线聊天', {
        dir: 'auto',
        lang: 'zh-CN',
        body: '您有新的消息请注意查收'
      })

      notification.onclick = () => {
        notification.close()
      }
    } else {
      window['$notification'].create({
        title: '消息通知',
        content: '您有新的消息请注意查收',
        duration: 3000
      })
    }
  }

  /**
   * 加载对接节点
   */
  addTalkItem() {
    let receiver_id
    if (this.talk_type === 1) {
      if (this.sender_id == this.getAccountId()) {
        receiver_id = this.receiver_id
      } else {
        receiver_id = this.sender_id
      }
    } else {
      receiver_id = this.receiver_id
    }

    let item = formatTalkItem({})
    item.talk_type = this.talk_type
    item.receiver_id = receiver_id
    item.index_name = this.getIndexName()
    item.is_online = 1
    item.name = receiver_id.toString()
    if (this.talk_type == 1) {
      const ret = useEntityInfoStore().getUserById(receiver_id)
      item.userInfo = ret.userInfo
      if (ret.isNew) {
        useEntityInfoStore().fetchUserInfo(receiver_id)
      }
    } else {
      const ret = useEntityInfoStore().getGroupById(receiver_id)
      item.groupInfo = ret.groupInfo
      if (ret.isNew) {
        useEntityInfoStore().fetchGroupInfo(receiver_id)
      }
    }
    console.log('addTalkItem add!')
    useTalkStore().addItem(item)

    // ServeCreateTalkList({
    //   talk_type,
    //   receiver_id
    // }).then(({ code, data }) => {
    //   if (code == 200) {
    //     let item = formatTalkItem(data)
    //     item.unread_num = 1
    //     useTalkStore().addItem(item)
    //   }
    // })
  }

  /**
   * 插入对话记录
   */
  justInsertTalkRecord() {
    let record = this.resource

    // 群成员变化的消息，需要更新群成员列表
    if ([1102, 1103, 1104].includes(record.msg_type)) {
      useDialogueStore().updateGroupMembers()
    }

    const [ talk_type, receiver_id ] = this.getIndexNums()
    useDialogueStore().addDialogueRecord(talk_type, receiver_id, formatTalkRecord(this.getAccountId(), this.resource))

    useTalkStore().updateItem({
      index_name: this.getIndexName(),
      content: this.getTalkText(),
      updated_at: parseTime(record.created_at),
      conv_msg_id: this.resource.msg_id
    })
  }

  insertTalkRecord() {
    let record = this.resource

    // 群成员变化的消息，需要更新群成员列表
    if ([1102, 1103, 1104].includes(record.msg_type)) {
      useDialogueStore().updateGroupMembers()
    }

    const [ talk_type, receiver_id ] = this.getIndexNums()
    useDialogueStore().addDialogueRecord(talk_type, receiver_id, formatTalkRecord(this.getAccountId(), this.resource))

    // 消息已读
    grpcClient.generalChatMarkRead(this.talk_type == 2, this.receiver_id, this.resource.msg_id)
        .then((res) => {
          if (res.errCode !== gen_grpc.ErrCode.emErrCode_Ok) {
            console.log("insertTalkRecord， failed to mark read: " + res.errCode)
          }
        }).catch((err) => {
          console.log("insertTalkRecord， failed to mark read: " + err)
          throw err
        })

    // if (!this.isCurrSender()) {
    //   // 推送已读消息
    //   setTimeout(() => {
    //     ws.emit('im.message.read', {
    //       receiver_id: this.sender_id,
    //       msg_ids: [this.resource.msg_id]
    //     })
    //   }, 1000)
    // }

    // 获取聊天面板元素节点
    const el = document.getElementById('imChatPanel')
    if (!el) return

    // 判断的滚动条是否在底部
    const isBottom = Math.ceil(el.scrollTop) + el.clientHeight >= el.scrollHeight

    if (isBottom || record.user_id == this.getAccountId()) {
      nextTick(() => {
        el.scrollTop = el.scrollHeight + 1000
      })
    } else {
      useDialogueStore().setUnreadBubble()
    }

    useTalkStore().updateItem({
      index_name: this.getIndexName(),
      content: this.getTalkText(),
      updated_at: parseTime(record.created_at),
      conv_msg_id: this.resource.msg_id
    })

    // if (this.talk_type == 1 && this.getAccountId() !== this.sender_id) {
    //   ServeClearTalkUnreadNum({
    //     talk_type: 1,
    //     receiver_id: this.sender_id
    //   })
    // }
  }

  /**
   * 更新对话列表记录
   */
  updateTalkUnreadNum(resource) {
    // console.log('updateTalkUnreadNum is_read', this.is_read)
    if (this.sender_id !== this.getAccountId() && !this.is_read) {
      console.log('updateTalkUnreadNum content: ', resource.extra.content)
      console.log('updateTalkUnreadNum msg_id: ', resource.msg_id)
      useTalkStore().increaseUnreadNum(this.getIndexName())
    }
  }
}

export default Talk
