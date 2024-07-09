import { defineStore } from 'pinia'
import { ServeGetUserSetting } from '@/api/user'
import { ServeFindFriendApplyNum } from '@/api/contact'
import { ServeGroupApplyUnread } from '@/api/group'
import {delAccessToken, setAccessToken} from '@/utils/auth'
import { storage } from '@/utils/storage'
import grpcClient from "@/grpc-client";
import { gen_grpc } from "@/gen_grpc/api";
import {FriendApplyItem, GroupApplyItem} from "@/types/global";
import {useTalkStore, useDialogueStore, useEntityInfoStore, UserInfo, GroupInfo} from '@/store'
import {reactive, Ref} from "vue";

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

export const useUserStore = defineStore('storeUser', {
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
            relationReqStore().$reset()
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

export interface FriendReq {
  id: number
  friend_id: number
  remark: string
  nickname: string
  avatar: string
  created_at: string
  userInfo: Ref<UserInfo>
}

export interface GroupJoinReq {
  id: number
  user_id: number
  group_id: number
  remark: string
  group_name: string
  nickname: string
  avatar: string
  created_at: string
  userInfo: Ref<UserInfo>
  groupInfo: Ref<GroupInfo>
}

export const relationReqStore = defineStore('storeRelationReq', {
  state: () => ({
    friendReqs: [] as FriendReq[],
    groupJoinReqs: [] as GroupJoinReq[],
  }),
  actions: {
    setFriendReqs(newReq: FriendReq[]) {
      this.friendReqs = newReq.map(req => reactive(req));
    },
    addFriendReq(req: FriendReq) {
      this.friendReqs.push(reactive(req));
    },
    clearFriendReqs() {
      this.friendReqs = [];
    },
    delFriendReq(friend_id: number) {
      this.friendReqs = this.friendReqs.filter(req => req.friend_id !== friend_id);
    },

    setGroupJoinReqs(newReq: GroupJoinReq[]) {
      this.groupJoinReqs = newReq.map(req => reactive(req));
    },
    addGroupJoinReq(request: GroupJoinReq) {
      this.groupJoinReqs.push(reactive(request));
    },
    clearGroupJoinReqs() {
      this.groupJoinReqs = [];
    },
    delGroupJoinReq(groupId: number, userId: number) {
      this.groupJoinReqs = this.groupJoinReqs.filter(req => req.group_id !== groupId || req.user_id !== userId);
    }
  },
  persist: true
});