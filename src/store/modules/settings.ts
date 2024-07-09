import { defineStore } from 'pinia'
import { storage } from '@/utils/storage'

export const useSettingsStore = defineStore('storeSettings', {
  persist: true,
  state: () => {
    return {
      isPromptTone: false, // 新消息提示音
      isKeyboard: false, // 是否推送键盘输入事件
      isLeaveWeb: false, // 是否离开网页
      isNotify: true, // 是否同意浏览器通知
      isFullScreen: true, // 是否客户端全屏
      darkTheme: false
    }
  },
  actions: {
    setPromptTone(value: boolean) {
      this.isPromptTone = value
    },
    setKeyboard(value: boolean) {
      this.isKeyboard = value
    },
    setFullScreen(value: boolean) {
      this.isFullScreen = value
    },
    setDarkTheme(value: boolean) {
      this.darkTheme = value
    },
    setNotify(value: boolean) {
      this.isNotify = value
    }
  }
})
