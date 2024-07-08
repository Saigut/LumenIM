import {h, ref} from 'vue'
import { NAvatar } from 'naive-ui'
import {
  useTalkStore,
  useUserStore,
  useDialogueStore,
  friendApplyStore,
  groupApplyStore,
  entityGetUserById, entityGetGroupById, useEntityInfoStore, UserInfo
} from '@/store'
import { notifyIcon } from '@/constant/default'
import WsSocket from './plugins/ws-socket'
import EventTalk from './event/talk'
import EventKeyboard from './event/keyboard'
import EventLogin from './event/login'
import EventRevoke from './event/revoke'
import {getAccessToken, getLocalSeqId, isLoggedIn, setLocalSeqId} from './utils/auth'
import grpcClient from "@/grpc-client";
import { gen_grpc } from "@/gen_grpc/api";
import * as ChatTypes from '@/types/chat';
import {ResourceData} from "@/types/chat";
import * as message from "@/constant/message";
import {
  ChatMsgSysContactAdded,
  ChatMsgSysGroupCreate, ChatMsgSysGroupDismissed,
  ChatMsgSysGroupMemberJoin,
  ChatMsgSysGroupMemberKicked,
  ChatMsgSysGroupMemberQuit
} from "@/constant/message";
import {FriendApplyItem, GroupApplyItem} from "@/types/global";

const urlCallback = () => {
  if (!isLoggedIn()) {
    window.location.reload()
  }

  return `${import.meta.env.VITE_SOCKET_API}/wss/default.io?token=${getAccessToken()}`
}

class ConnectGrpc {
  private polling: boolean

  constructor() {
    this.polling = false
  }

  /**
   * 连接
   */
  connect() {
    this.polling = true
    this.startPolling()
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.polling = false
  }

  /**
   * 连接状态
   * @returns 连接状态
   */
  isConnect() {
    return this.polling
  }

  /**
   * 推送事件消息
   * @param event 事件名
   * @param data  数据
   */
  emit(event: string, data: any) {
    // 这里可以实现事件的发送逻辑，如果需要的话
  }

  async startPolling() {
    while (this.polling) {
      try {
        const res = await grpcClient.getUpdateList()
        if (!this.handleUpdate(res)) {
          console.error('获取更新列表失败', res.errCode)
          await this.delay(3000)
        }
      } catch (error) {
        if (error.message !== "Request timed out") {
          console.error('轮询失败', error)
          await this.delay(3000)
        }
     }
    }
  }

  async getUpdateList() {
    const token = getAccessToken()
    const response = await fetch(`${import.meta.env.VITE_SOCKET_API}/getUpdateList?token=${token}`)
    if (!response.ok) {
      throw new Error('Failed to fetch update list')
    }
    return response.json()
  }

  handleUpdate(res: gen_grpc.GetUpdateListRes) {
    // 根据返回的数据调用相应的事件处理函数
    if (res.errCode !== gen_grpc.ErrCode.emErrCode_Ok) {
      console.error('接口返回错误')
      return false
    }

    if (getLocalSeqId() >= res.seqId) {
      console.error('repeated message')
      return true
    }

    for (const msg of res.msgList) {
      if (!msg.has_msg) {
        console.error('消息为空')
        continue
      } else if (!msg.has_receiverId) {
        console.error('接收者ID为空')
        continue
      }

      switch (msg.msg.msgType) {
        case gen_grpc.ChatMsgType.emChatMsgType_Text:
        case gen_grpc.ChatMsgType.emChatMsgType_ContactAdded:
        case gen_grpc.ChatMsgType.emChatMsgType_ContactRejected:
        case gen_grpc.ChatMsgType.emChatMsgType_GroupCreated:
        case gen_grpc.ChatMsgType.emChatMsgType_GroupDeleted:
        case gen_grpc.ChatMsgType.emChatMsgType_GroupUserJoined:
        case gen_grpc.ChatMsgType.emChatMsgType_GroupRejected:
        case gen_grpc.ChatMsgType.emChatMsgType_GroupUserLeft:
        case gen_grpc.ChatMsgType.emChatMsgType_GroupUserRemoved:
          this.onImMessage(msg);
          break;
        case gen_grpc.ChatMsgType.emChatMsgType_MarkRead:
          this.onImMessageRead(msg)
          break;
        case gen_grpc.ChatMsgType.emChatMsgType_ContactAddReq:
          this.onImContactApply(msg)
          break;
        case gen_grpc.ChatMsgType.emChatMsgType_ContactDeleted:
          if (msg.msg.senderUid === useUserStore().uid) {
            useEntityInfoStore().fetchUserInfo(msg.receiverId.uid)
          } else {
            useEntityInfoStore().fetchUserInfo(msg.msg.senderUid)
          }
          break;
        case gen_grpc.ChatMsgType.emChatMsgType_GroupJoinReq:
          this.onImGroupApply(msg)
          break;
        default:
          console.warn(`Unhandled message type: ${msg.msg.msgType}`);
          break;
      }
    }

    setLocalSeqId(res.seqId)

    return true
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  onPing() {
    // 轮询不需要 ping/pong 机制
  }

  onPong() {
    // 轮询不需要 ping/pong 机制
  }

  onImMessage(data: gen_grpc.ChatConvMsg) {
    let receiverUserId = 0
    if (data.receiverId.has_uid) {
      receiverUserId = data.msg.senderUid == useUserStore().uid ? data.receiverId.uid : data.msg.senderUid
    }
    const resourceData: ChatTypes.ResourceData = {
      msg_id: data.convMsgId,
      user_id: data.msg.senderUid,
      user_info: entityGetUserById(data.msg.senderUid),
      extra: {
        content: data.msg.msgContent,
        reply: {
          msg_id: 0,
          nickname: '',
          content: '',
        },
      },
      msg_type: 0, // 如果未定义的类型需要处理，可以初始化为 undefined
      created_at: data.msg.sentTsMs,
      is_read: data.isRead
    };
    switch (data.msg.msgType) {
      case gen_grpc.ChatMsgType.emChatMsgType_Text:
        resourceData.msg_type = message.ChatMsgTypeText
        break
      case gen_grpc.ChatMsgType.emChatMsgType_ContactAddReq:
        break
      case gen_grpc.ChatMsgType.emChatMsgType_ContactAdded:
        if (data.msg.senderUid === useUserStore().uid) {
          resourceData.msg_type = ChatMsgSysContactAdded
        } else {
          resourceData.msg_type = message.ChatMsgTypeText
        }
        break
      case gen_grpc.ChatMsgType.emChatMsgType_ContactRejected:
        break
      case gen_grpc.ChatMsgType.emChatMsgType_GroupCreated:
        resourceData.msg_type = ChatMsgSysGroupCreate
        break
      case gen_grpc.ChatMsgType.emChatMsgType_GroupDeleted:
        resourceData.msg_type = ChatMsgSysGroupDismissed
        break
      case gen_grpc.ChatMsgType.emChatMsgType_GroupUserJoined:
        resourceData.msg_type = ChatMsgSysGroupMemberJoin
        break
      case gen_grpc.ChatMsgType.emChatMsgType_GroupRejected:
        break
      case gen_grpc.ChatMsgType.emChatMsgType_GroupUserLeft:
        resourceData.msg_type = ChatMsgSysGroupMemberQuit
        break
      case gen_grpc.ChatMsgType.emChatMsgType_GroupUserRemoved:
        resourceData.msg_type = ChatMsgSysGroupMemberKicked
        break
      default:
        console.warn(`Unhandled message type: ${data.msg.msgType}`);
        break
    }

    const resource: ChatTypes.Resource = {
      sender_id: data.msg.senderUid,
      receiver_id: data.receiverId.has_uid ? data.receiverId.uid : data.receiverId.groupId,
      talk_type: data.receiverId.has_uid ? 1 : 2,
      is_read: data.isRead,
      data: resourceData,
    };

    new EventTalk(resource)
  }

  onImMessageRead(data: any) {
    const dialogueStore = useDialogueStore()
    if (dialogueStore.index_name !== `1_${data.sender_id}`) {
      return
    }
    const { msg_ids = [] } = data
    // for (const msgid of msg_ids) {
    //   dialogueStore.updateDialogueRecord({ msg_id: msgid, is_read: 1 })
    // }
  }

  onImContactStatus(data: any) {
    new EventLogin(data)
  }

  onImMessageKeyboard(data: any) {
    new EventKeyboard(data)
  }

  onImMessageRevoke(data: any) {
    new EventRevoke(data)
  }

  onImContactApply(data: gen_grpc.ChatConvMsg) {
    if (data.status !== 0) {
      return
    }
    if (data.msg.senderUid === useUserStore().uid) {
      return
    }
    const item: FriendApplyItem = {
      id: data.seqId,
      // user_id: data.receiverId.uid,
      friend_id: data.msg.senderUid,
      remark: data.msg.msgContent,
      nickname: '',
      avatar: '',
      created_at: data.msg.sentTsMs.toString(),
      userInfo: entityGetUserById(data.msg.senderUid)
    };
    friendApplyStore().addItem(item)
    window['$notification'].create({
      title: '好友申请通知',
      content: data.msg.msgContent,
      description: `申请人: ${data.msg.senderUid}`,
      meta: data.msg.sentTsMs.toString(),
      avatar: () =>
          h(NAvatar, {
            size: 'small',
            round: true,
            src: notifyIcon,
            style: 'background-color:#fff;'
          }),
      duration: 3000
    })
    useUserStore().isContactApply = true
  }

  onImGroupApply(data: gen_grpc.ChatConvMsg) {
    console.log("onImGroupApply status", data.status)
    if (data.status !== 0) {
      return
    }
    if (data.msg.senderUid === useUserStore().uid) {
      return
    }
    const item: GroupApplyItem = {
      id: data.seqId,
      user_id: data.msg.senderUid,
      group_id: data.receiverId.groupId,
      group_name: '',
      remark: data.msg.msgContent,
      nickname: '',
      avatar: '',
      created_at: data.msg.sentTsMs.toString(),
      userInfo: entityGetUserById(data.msg.senderUid),
      groupInfo: entityGetGroupById(data.receiverId.groupId)
    };
    groupApplyStore().addItem(item)
    window['$notification'].create({
      title: '入群申请通知',
      content: '有新的入群申请，请注意查收',
      avatar: () =>
          h(NAvatar, {
            size: 'small',
            round: true,
            src: notifyIcon,
            style: 'background-color:#fff;'
          }),
      duration: 30000
    })
    useUserStore().isGroupApply = true
  }

  onEventError(data: any) {
    window['$message'] && window['$message'].error(JSON.stringify(data))
  }
}

// 导出单例
export default new ConnectGrpc()
