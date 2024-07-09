import {GroupInfo, UserInfo} from "@/store";
import {Ref} from "vue/dist/vue";

export interface StateDropdown {
  options: any[]
  show: boolean
  dropdownX: number
  dropdownY: number
  item: any
}

export interface FriendApplyItem {
  id: number
  friend_id: number
  remark: string
  nickname: string
  avatar: string
  created_at: string
  userInfo: Ref<UserInfo>
}

export interface GroupApplyItem {
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
