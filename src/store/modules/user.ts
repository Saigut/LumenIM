import { defineStore } from 'pinia'
import { ServeGetUserSetting } from '@/api/user'
import { ServeFindFriendApplyNum } from '@/api/contact'
import { ServeGroupApplyUnread } from '@/api/group'
import {delAccessToken, setAccessToken} from '@/utils/auth'
import { storage } from '@/utils/storage'
import grpcClient from "@/grpc-client";
import { gen_grpc } from "@/gen_grpc/api";
import {FriendApplyItem, GroupApplyItem} from "@/types/global";
import {useTalkStore, useDialogueStore, useEntityInfoStore} from '@/store'

interface UserStoreState {
  uid: number
  nickname: string
  mobile: string
  email: string
  gender: number
  motto: string
  avatar: string
  banner: string
  online: boolean
  isQiye: boolean
  isContactApply: boolean
  isGroupApply: boolean
  seqId: number
}

export const useUserStore = defineStore('user', {
  persist: true,
  state: (): UserStoreState => {
    return {
      uid: 0, // 用户ID
      mobile: '',
      email: '',
      nickname: '', // 用户昵称
      gender: 0, // 性别
      motto: '', // 个性签名
      avatar: '',
      banner: '', // 名片背景
      online: true, // 在线状态
      isQiye: false,
      isContactApply: false,
      isGroupApply: false,
      seqId: 0
    }
  },
  getters: {},
  actions: {
    // 设置用户登录状态
    updateSocketStatus(status) {
      this.online = status
    },

    logoutLogin() {
      grpcClient.sessUserLogout()
          .then((res: gen_grpc.SessUserLogoutRes) => {
            if (res.errCode === gen_grpc.ErrCode.emErrCode_Ok) {
              window['$message'].success('登出成功')
            } else {
              window['$message'].warning(res.errCode)
            }
          })
          .finally(() => {
            this.$reset()
            useDialogueStore().$reset()
            useTalkStore().$reset()
            friendApplyStore().$reset()
            groupApplyStore().$reset()
            useEntityInfoStore().$reset()
            storage.remove('user_info')
            delAccessToken()
            location.reload()
          })
    },

    loadSetting() {
      // ServeGetUserSetting().then(({ code, data }) => {
      //   if (code == 200) {
      //     this.nickname = data.user_info.nickname
      //     this.uid = data.user_info.uid
      //     this.avatar = data.user_info.avatar
      //
      //     this.gender = data.user_info.gender
      //     this.mobile = data.user_info.mobile || ''
      //     this.email = data.user_info.email || ''
      //     this.motto = data.user_info.motto
      //     this.isQiye = data.user_info.is_qiye || false
      //
      //     storage.set('user_info', data)
      //   }
      // })

      // ServeFindFriendApplyNum().then(({ code, data }) => {
      //   if (code == 200) {
      //     this.isContactApply = data.unread_num > 0
      //   }
      // })

      // ServeGroupApplyUnread().then(({ code, data }) => {
      //   if (code == 200) {
      //     this.isGroupApply = data.unread_num > 0
      //   }
      // })
    }
  }
})

export const friendApplyStore = defineStore('friendApply', {
  state: () => ({
    items: [] as FriendApplyItem[],
  }),
  actions: {
    setItems(newItems: FriendApplyItem[]) {
      this.items = newItems;
    },
    addItem(item: FriendApplyItem) {
      this.items.push(item);
    },
    clearItems() {
      this.items = [];
    },
    delFriendItem(friend_id: number) {
      this.items = this.items.filter(item => item.friend_id !== friend_id);
    }
  },
  persist: true
});

export const groupApplyStore = defineStore('groupApply', {
  state: () => ({
    items: [] as GroupApplyItem[],
  }),
  actions: {
    setItems(newItems: GroupApplyItem[]) {
      this.items = newItems;
    },
    addItem(item: GroupApplyItem) {
      this.items.push(item);
    },
    clearItems() {
      this.items = [];
    },
    delItem(groupId: number, userId: number) {
      this.items = this.items.filter(item => (item.group_id !== groupId) || (item.user_id !== userId));
    }
  },
  persist: true
});