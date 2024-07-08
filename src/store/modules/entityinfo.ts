import { defineStore } from 'pinia'
import grpcClient from "@/grpc-client";
import { gen_grpc } from "@/gen_grpc/api";
import {reactive, Ref, ref} from "vue";

export interface UserInfo {
  id: number
  username: string
  nickname: string
  noteName: string
  mobile: string
  email: string
  gender: number
  motto: string
  avatar: string
  online: boolean
  group_id: number
  is_online: number
  remark: string
  isMutualContact: boolean
}

// createUserInfo
export function createUserInfo(overrides: Partial<UserInfo> = {}): UserInfo {
  return {
    id: 0,
    username: '',
    nickname: '',
    noteName: '',
    mobile: '',
    email: '',
    gender: 0,
    motto: '',
    avatar: '',
    online: false,
    group_id: 0,
    is_online: 1,
    remark: '',
    isMutualContact: false
  };
}

export interface GroupInfo {
  id: number
  name: string
  noteName: string
  ownerId: number
  avatar: string
  profile: string
  memCount: number
  createAt: number
}

export function createGroupInfo(overrides: Partial<GroupInfo> = {}): GroupInfo {
  return {
    id: 0,
    name: '',
    noteName: '',
    ownerId: 0,
    avatar: '',
    profile: '',
    memCount: 0,
    createAt: 0
  };
}

interface EntityInfoState {
  userMap: Record<number, UserInfo>;
  groupMap:  Record<number, GroupInfo>;
}


export const useEntityInfoStore = defineStore('entityInfo', {
  persist: true,
  state: (): EntityInfoState => {
    return {
      userMap: reactive({}),
      groupMap: reactive({})
    };
  },
  getters: {
    // 根据用户ID获取用户信息，如果没有则新建一个默认用户信息
    getUserById: (state) => (id: number): { userInfo: UserInfo, isNew: boolean } => {
      let isNew = false;
      if (!state.userMap[id]) {
        state.userMap[id] = reactive({
          id: id,
          username: '',
          nickname: '',
          noteName: '',
          mobile: '',
          email: '',
          gender: 0,
          motto: '',
          avatar: '',
          online: false
        });
        isNew = true;
      }
      return { userInfo: state.userMap[id], isNew };
    },
    // 根据组ID获取组信息，如果没有则新建一个默认组信息
    getGroupById: (state) => (id: number): { groupInfo: GroupInfo, isNew: boolean } => {
      let isNew = false;
      if (!state.groupMap[id]) {
        state.groupMap[id] = {
          id: Number(id),
          name: '',
          noteName: '',
          ownerId: 0,
          createAt: Date.now()
        };
        isNew = true;
      }
      return { groupInfo: state.groupMap[id], isNew};
    }
  },
  actions: {
    fetchUserInfo(userId: number) {
      grpcClient.umContactGetInfo(userId)
          .then((res) => {
            if (res.errCode === gen_grpc.ErrCode.emErrCode_Ok) {
              const userInfo: UserInfo = createUserInfo()
              userInfo.id = res.userInfo.uid
              userInfo.username = res.userInfo.username
              userInfo.nickname = res.userInfo.nickname
              userInfo.noteName = res.userInfo.noteName
              userInfo.mobile = ''
              userInfo.email = res.userInfo.email
              userInfo.gender = 0
              userInfo.motto = ''
              userInfo.avatar = res.userInfo.avatar
              userInfo.isMutualContact = res.userInfo.isMutualContact
              this.updateUserById(res.userInfo.uid, userInfo)
            }
          })
    },
    fetchGroupInfo(groupId: number) {
      grpcClient.umGroupGetInfo(groupId)
          .then((res) => {
            if (res.errCode === gen_grpc.ErrCode.emErrCode_Ok) {
              const groupInfo: GroupInfo = createGroupInfo()
              groupInfo.id = res.groupInfo.groupId
              groupInfo.name = res.groupInfo.groupName
              groupInfo.ownerId = res.groupInfo.ownerUid
              groupInfo.avatar = res.groupInfo.avatar
              groupInfo.memCount = res.groupInfo.memCount
              groupInfo.createAt = res.groupInfo.createTsMs
              this.updateGroupById(res.groupInfo.groupId, groupInfo)
            }
          })
    },
    // 删除用户信息
    deleteUser(id: number) {
      delete this.userMap[id];
    },
    // 删除组信息
    deleteGroup(id: number) {
      delete this.groupMap[id];
    },
    // 根据ID更新用户信息，如果没有则新建一个默认用户信息然后再更新
    updateUserById(id: number, userInfo: Partial<UserInfo>) {
      if (!this.userMap[id]) {
        this.userMap[id] = reactive({
          id: id,
          username: '',
          nickname: '',
          notename: '',
          mobile: '',
          email: '',
          gender: 0,
          motto: '',
          avatar: '',
          online: false
        });
      }
      Object.assign(this.userMap[id], userInfo);
    },
    // 根据ID更新组信息，如果没有则新建一个默认组信息然后再更新
    updateGroupById(id: number, groupInfo: Partial<GroupInfo>) {
      if (!this.groupMap[id]) {
        this.groupMap[id] = reactive({
          id: Number(id),
          name: '',
          notename: '',
          ownerId: 0,
          avatar: '',
          createAt: Date.now()
        });
      }
      Object.assign(this.groupMap[id], groupInfo);
    }
  }
});

export function entityGetUserById(uid: number): Ref<UserInfo> {
  const entityInfoStore = useEntityInfoStore()
  const ret = entityInfoStore.getUserById(uid)
  if (ret.isNew) {
    entityInfoStore.fetchUserInfo(uid)
  }
  return ref(ret.userInfo);
}

export function entityGetGroupById(gid: number): Ref<GroupInfo> {
  const entityInfoStore = useEntityInfoStore()
  const ret = entityInfoStore.getGroupById(gid)
  if (ret.isNew) {
    entityInfoStore.fetchGroupInfo(gid)
  }
  return ref(ret.groupInfo)
}