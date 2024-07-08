import { storage } from './storage'
import {inject, getCurrentInstance} from "vue";
import { useUserStore } from '@/store'


const AccessToken = 'AUTH_TOKEN'

/**
 * 验证是否登录
 *
 * @returns token
 */
export function isLoggedIn() {
  return getAccessToken() != ''
}

/**
 * 获取登录授权 Token
 *
 * @returns token
 */
export function getAccessToken() {
  return storage.get(AccessToken) || ''
}

/**
 * 设置登录授权 Token
 *
 * @returns token
 */
export function setAccessToken(token = '', expire = 60 * 60 * 2) {
  return storage.set(AccessToken, token, expire) || ''
}

/**
 * 删除登录授权 Token
 */
export function delAccessToken() {
  storage.remove(AccessToken)
}

export function getLocalSeqId() {
  return useUserStore().seqId
  // return Number(localStorage.getItem('localSeqId') || 0)
}

export function setLocalSeqId(newSeqId) {
  useUserStore().seqId = newSeqId
  // localStorage.setItem('localSeqId', newSeqId.toString())
}

export function getMyUid() {
  return Number(localStorage.getItem('myUid') || 0)
}

export function setMyUid(uid) {
  localStorage.setItem('myUid', uid.toString())
}