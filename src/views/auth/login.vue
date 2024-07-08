<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NDivider, NForm, NFormItem } from 'naive-ui'
import grpcClient from '@/grpc-client'
import { gen_grpc } from '@/gen_grpc/api'
import {setAccessToken, setMyUid} from '@/utils/auth'
import { palyMusic } from '@/utils/talk'
import { useUserStore } from '@/store'
import {calPassHash} from "@/utils/util_ts";
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const formRef = ref()
const rules = {
  username: {
    required: true,
    trigger: ['blur', 'input'],
    message: '账号不能为空'
  },
  password: {
    required: true,
    trigger: ['blur', 'input'],
    message: '密码不能为空'
  }
}

const model = reactive({
  username: '',
  password: '',
  loading: false
})

const onLogin = () => {
  const redirect: any = route.params?.redirect || '/'

  model.loading = true

  grpcClient.sessUserLogin(model.username, calPassHash(model.password))
      .then((res: gen_grpc.SessUserLoginRes) => {
        if (res.errCode === gen_grpc.ErrCode.emErrCode_Ok) {
          window['$message'].success('登录成功')
          setMyUid(res.uid)
          userStore.uid = res.uid
          setAccessToken(res.sessId)
          router.push(redirect)
        } else {
          window['$message'].warning('登录失败：' + gen_grpc.ErrCode[res.errCode])
        }
      })
      .catch((err) => {
        window['$message'].warning('请求失败：' + gen_grpc.ErrCode[err])
        throw err
      })
      .finally(() => {
        model.loading = false
      })
}

const onValidate = (e: Event) => {
  e.preventDefault()

  // 谷歌浏览器提示音需要用户主动交互才能播放，登录入口主动交互一次，后面消息提示音就能正常播放了
  palyMusic(true)

  formRef.value.validate((errors: any) => {
    !errors && onLogin()
  })
}

const onClickAccount = (type: number) => {
  if (type == 1) {
    model.username = '18798272054'
    model.password = 'admin123'
  } else {
    model.username = '18798272055'
    model.password = 'admin123'
  }

  onLogin()
}
</script>

<template>
  <section class="el-container is-vertical login-box login">
    <header class="el-header box-header">快捷登录</header>

    <main class="el-main" style="padding: 3px">
      <n-form ref="formRef" size="large" :model="model" :rules="rules">
        <n-form-item path="username" :show-label="false">
          <n-input
              placeholder="请输入用户名"
              v-model:value="model.username"
              :maxlength="11"
              @keydown.enter="onValidate"
          />
        </n-form-item>

        <n-form-item path="password" :show-label="false">
          <n-input
              placeholder="请输入密码"
              type="password"
              show-password-on="click"
              v-model:value="model.password"
              @keydown.enter="onValidate"
          />
        </n-form-item>

        <n-button
            type="primary"
            size="large"
            block
            class="mt-t20"
            @click="onValidate"
            :loading="model.loading"
        >
          立即登录
        </n-button>
      </n-form>

      <div class="helper">
<!--        <n-button text color="#409eff" @click="router.push('/auth/forget')"> 找回密码 </n-button>-->
        <n-button text color="#409eff" @click="router.push('/auth/register')">
          还没有账号？立即注册
        </n-button>
      </div>
    </main>
    <footer class="el-footer" style="height: 90px">
    </footer>
  </section>
</template>

<style lang="less" scoped>
@import '@/assets/css/login.less';
</style>
