<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NForm, NFormItem, NInput } from 'naive-ui'
import { ServeSendVerifyCode } from '@/api/common'
import { isMobile } from '@/utils/validate'
import { useSmsLock } from '@/hooks'
import grpcClient from '@/grpc-client'
import {gen_grpc} from "@/gen_grpc/api";
import { calPassHash } from "@/utils/util_ts";

// 初始化短信按钮锁
const { lockTime, start } = useSmsLock('REGISTER_SMS', 60)

const router = useRouter()
const formRef = ref()

const validatePassword = (password: string): boolean => {
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isValidLength = password.length >= 8 && password.length <= 16;

  const validCombinations = [
    hasLetter && hasNumber,
    hasLetter && hasSpecialChar,
    hasNumber && hasSpecialChar,
  ];

  return isValidLength && validCombinations.some(combination => combination);
}

const rules = {
  nickname: {
    required: true,
    trigger: ['blur', 'input'],
    message: '昵称不能为空！'
  },
  username: {
    required: true,
    validator(rule: any, value: string) {
      if (!value) {
        return new Error('用户名不能为空！')
      } else if (!/^[a-zA-Z][a-zA-Z0-9_-]{5,19}$/.test(value)) {
        return new Error('用户名必须为6-20个字符，仅包含字母、数字、下划线和短横线，且以字母开头')
      }
      return true
    },
    trigger: ['blur', 'input']
  },
  password: {
    required: true,
    validator(rule: any, value: string) {
      if (!value) {
        return new Error('密码不能为空！')
      } else if (!validatePassword(value)) {
        return new Error('密码必须为8-16个字符，且包含字母、数字和特殊字符中的至少两种组合')
      }
      return true
    },
    trigger: ['blur', 'input']
  },
  email: {
    required: true,
    validator(rule: any, value: string) {
      if (!value) {
        return new Error('邮箱不能为空！')
      } else if (!/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(value)) {
        return new Error('请输入正确的邮箱格式')
      }
      return true
    },
    trigger: ['blur', 'input']
  },
  sms_code: {
    required: true,
    trigger: ['blur', 'input'],
    message: '验证码不能为空！'
  }
}

const model = reactive({
  nickname: '',
  username: '',
  password: '',
  email: '',
  sms_code: '',
  loading: false
})

const onRegister = () => {
  model.loading = true;

  grpcClient.umRegister(model.username, model.nickname, calPassHash(model.password), model.email)
      .then((res: gen_grpc.UmRegisterRes) => {
        if (res.errCode === gen_grpc.ErrCode.emErrCode_Ok) {
          window['$message'].success('注册成功');

          setTimeout(() => {
            router.push('/auth/login');
          }, 500);
        } else {
          window['$message'].error('注册失败：' + gen_grpc.ErrCode[res.errCode]);
        }
      })
      .catch((error) => {
        window['$message'].error('请求失败：' + error)
        throw error;
      })
      .finally(() => {
        model.loading = false;
      });
}

const onValidate = (e) => {
  e.preventDefault()

  formRef.value.validate((errors) => {
    !errors && onRegister()
  })
}

// 发送短信
const onSendSms = () => {
  if (!isMobile(model.username)) {
    window['$message'].warning('请正确填写手机号')
    return
  }

  const response = ServeSendVerifyCode({
    mobile: model.username,
    channel: 'register'
  })

  response.then((res) => {
    if (res.code == 200) {
      start()

      window['$message'].success('短信发送成功')

      if (res.data.is_debug) {
        model.sms_code = res.data.sms_code
        setTimeout(() => {
          window['$message'].success('已开启验证码自动填充')
        }, 1000)
      }
    } else {
      window['$message'].warning(res.message)
    }
  })

  response.finally(() => {
    model.loading = false
  })
}
</script>

<template>
  <section class="el-container is-vertical login-box reister">
    <header class="el-header box-header">账号注册</header>

    <main class="el-main" style="padding: 3px">
      <n-form ref="formRef" size="large" :model="model" :rules="rules">
        <n-form-item path="username" :show-label="false">
          <n-input
              placeholder="用户名"
              v-model:value="model.username"
              :maxlength="20"
              @keydown.enter="onValidate"
          />
        </n-form-item>

<!--        <n-form-item path="sms_code" :show-label="false">-->
<!--          <n-input-->
<!--            placeholder="验证码"-->
<!--            v-model:value="model.sms_code"-->
<!--            :maxlength="6"-->
<!--            @keydown.enter="onValidate"-->
<!--          />-->
<!--          <n-button tertiary class="mt-l5" @click="onSendSms" :disabled="lockTime > 0">-->
<!--            获取验证码 <span v-show="lockTime > 0">({{ lockTime }}s)</span>-->
<!--          </n-button>-->
<!--        </n-form-item>-->

        <n-form-item path="password" :show-label="false">
          <n-input
              placeholder="设置密码"
              type="password"
              show-password-on="click"
              v-model:value="model.password"
              @keydown.enter="onValidate"
          />
        </n-form-item>

        <n-form-item path="nickname" :show-label="false">
          <n-input
              placeholder="设置昵称"
              v-model:value="model.nickname"
              @keydown.enter="onValidate"
          />
        </n-form-item>

        <n-form-item path="email" :show-label="false">
          <n-input
              placeholder="邮箱"
              v-model:value="model.email"
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
          立即注册
        </n-button>
      </n-form>

      <div class="helper">
<!--        <n-button text color="#409eff" @click="router.push('/auth/forget')"> 找回密码 </n-button>-->
        <n-button text color="#409eff" @click="router.push('/auth/login')">
          已有账号，立即登录?
        </n-button>
      </div>
    </main>
  </section>
</template>

<style lang="less" scoped>
@import '@/assets/css/login.less';
</style>
