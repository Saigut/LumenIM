// 会话最后一条消息
import { UserInfo, GroupInfo } from "@/store";
import {Ref} from "vue";

export interface ISessionLastMessage {
  msg_id: number // 消息ID
  sequence: number // 消息时序ID（消息排序）
  msg_type: number // 消息类型
  user_id: number // 发送者ID
  receiver_id: number // 接受者ID
  content: string // 消息内容
  mention: number[] // 提及列表
}

// 会话列表
export interface ISession {
  id: number // 会话id
  index_name: string // 索引名称
  talk_type: number // 聊天类型
  receiver_id: number // 接收者id
  name: string // 昵称
  avatar: string // 头像
  remark: string // 备注
  is_disturb: number // 是否免打扰
  is_online: number // 是否在线
  is_robot: number // 是否机器人
  is_top: number // 置顶
  unread_num: number // 未读消息数
  updated_at: string // 最后发送时间
  conv_msg_id: number
  content?: string // 消息内容
  last_message?: ISessionLastMessage
  draft_text?: string // 草稿文本
  userInfo?: Ref<UserInfo>
  groupInfo?: Ref<GroupInfo>
}

export function createISession(overrides: Partial<ISession> = {}): ISession {
  return {
    id: 0,
    index_name: "",
    talk_type: 0,
    receiver_id: 0,
    name: "Unnamed",
    avatar: "default_avatar.png",
    remark: "",
    is_disturb: 0,
    is_online: 0,
    is_robot: 0,
    is_top: 0,
    unread_num: 0,
    updated_at: new Date().toISOString(),
    conv_msg_id: 0,
    content: "",
    draft_text: "",
    ...overrides
  };
}

// 消息记录
export interface ITalkRecord {
  msg_id: number
  sequence: number
  talk_type: number
  msg_type: number
  user_id: number
  receiver_id: number
  nickname: string
  avatar: string
  is_revoke: number
  is_mark: number
  is_read: boolean
  content: string
  created_at: string
  extra: any
  isCheck: boolean
  send_status: number
  float: string
}

export interface ITalkRecordExtraText {
  content: string
  mentions?: number[]
}

export interface ITalkRecordExtraCode {
  lang: string
  code: string
}

export interface ITalkRecordExtraFile {
  drive: number
  name: string
  path: string
  size: number
}

export interface ITalkRecordExtraForward {
  msg_ids: number[]
  receiver_id: number
  records: {
    nickname: string
    text: string
  }[]
  talk_type: number
  user_id: number
}

export interface ITalkRecordExtraGroupNotice {
  owner_id: number
  owner_name: string
  title: number
  content: string
}

export interface ITalkRecordExtraVideo {
  cover: string
  url: string
  duration: number
  size: number
}

export interface ITalkRecordExtraMixed {
  items: {
    type: number
    content: string
    link: string
  }[]
}

export interface ITalkRecordExtraAudio {
  name: string
  size: number
  url: string
  duration: number
}

export interface ITalkRecordExtraLogin {
  ip: string
  address: string
  agent: string
  platform: string
  reason: string
  datetime: string
}

export interface ITalkRecordExtraImage {
  name: string
  size: number
  url: string
  width: number
  height: number
}

export interface ResourceData {
  msg_type: number;
  extra: {
    content: string;
    reply: {
      msg_id: number;
      nickname: string;
      content: string;
    };
  };
  msg_id: number;
  user_id: number;
  user_info: Ref<UserInfo>;
  created_at: number;
  is_read: boolean;
  [key: string]: any;
}

export interface Resource {
  sender_id: number;
  receiver_id: number;
  talk_type: number;
  data: ResourceData;
  is_read: boolean;
}