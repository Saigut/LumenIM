<script lang="ts" setup>
import {onMounted, reactive, ref, watch} from 'vue'
import { useRouter } from 'vue-router'
import { NForm, NFormItem, NInput, NDatePicker, NRadio, NRadioGroup, NSpace } from 'naive-ui'
import { ServeUpdateUserDetail, ServeGetUserDetail } from '@/api/user'
import AvatarCropper from '@/components/base/AvatarCropper.vue'
import { hidePhone } from '@/utils/strings'
import {createUserInfo, useEntityInfoStore, useUserStore} from '@/store'
import grpcClient from "@/grpc-client";
import {gen_grpc} from "@/gen_grpc/api";

const userStore = useUserStore()
const router = useRouter()
const cropper = ref(false)

const detail = reactive({
  avatar: '',
  nickname: '',
  username: '',
  mobile: '',
  email: '',
  gender: '0',
  motto: '0',
  birthday: ref(),
  loading: false
})

const userInfo = ref(createUserInfo())
let newNickname = ref('')

// 加载用户信息
// ServeGetUserDetail().then(({ data }) => {
//   detail.nickname = data.nickname.toString()
//   detail.mobile = data.mobile.toString()
//   detail.email = data.email.toString()
//   detail.gender = data.gender.toString()
//   detail.motto = data.motto.toString()
//   detail.avatar = data.avatar
//   if (data.birthday) {
//     detail.birthday = ref(data.birthday)
//   }
// })

// 修改用户信息
const onChangeDetail = () => {
  if (!newNickname.value.trim()) {
    return window['$message'].warning('昵称不能为空')
  }

  detail.loading = true

  grpcClient.umUserUpdateInfo(newNickname.value.trim(), "", detail.avatar, "", "")
      .then((res: gen_grpc.SessUserLoginRes) => {
        if (res.errCode === gen_grpc.ErrCode.emErrCode_Ok) {
          window['$message'].success('信息保存成功')
          useEntityInfoStore().fetchUserInfo(userStore.uid)
        } else {
          window['$message'].warning('信息保存失败：' + gen_grpc.ErrCode[res.errCode])
        }
      })
      .catch((err) => {
        window['$message'].warning('请求失败：' + err)
        throw err
      })
      .finally(() => {
        detail.loading = false
      })
}

const onUploadAvatar = (avatar) => {
  cropper.value = false
  detail.avatar = avatar
  onChangeDetail()
}

onMounted(() => {
  const entityInfoStore = useEntityInfoStore()
  const ret = entityInfoStore.getUserById(userStore.uid)

  if (ret.isNew) {
    entityInfoStore.fetchUserInfo(userStore.uid)
  }

  // 使用 watch 监听 ret.userInfo 的变化
  watch(
      () => ret.userInfo,
      (newUserInfo) => {
        userInfo.value = newUserInfo
      },
      { immediate: true, deep: true }
  )
})

</script>

<template>
  <h3 class="title">个人信息</h3>

  <section class="el-container container">
<!--    <aside class="el-aside el-aside-left">-->
<!--      <n-avatar-->
<!--        :size="200"-->
<!--        :src="detail.avatar"-->
<!--        @click="cropper = true"-->
<!--        class="avatar-box pointer"-->
<!--      />-->

<!--      <n-button text @click="cropper = true"> 点击修改头像 </n-button>-->
<!--    </aside>-->

    <main class="el-main" style="padding-right: 20px">
      <n-form
        ref="formRef"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
        size="medium"
        style="max-width: 500px; margin-top: 25px"
      >
<!--        <n-form-item label="登录账号：">-->
<!--          {{ hidePhone(detail.mobile) }}-->
<!--          <n-button class="mt-l15" type="primary" text @click="router.push('/settings/security')">-->
<!--            修改-->
<!--          </n-button>-->
<!--        </n-form-item>-->
<!--        <n-form-item label="电子邮箱：">-->
<!--          {{ detail.email }}-->
<!--          <n-button class="mt-l15" type="primary" text @click="router.push('/settings/security')">-->
<!--            修改-->
<!--          </n-button>-->
<!--        </n-form-item>-->
        <n-form-item label="昵称：">{{ userInfo.nickname }}</n-form-item>
        <n-form-item label="账号：">{{ userInfo.username }}</n-form-item>
        <n-form-item label="修改昵称：">
          <n-input
            placeholder=请输入新昵称
            v-model:value="newNickname"
            maxlength="20"
            show-count
          />
        </n-form-item>
<!--        <n-form-item label="我的性别：">-->
<!--          <n-radio-group v-model:value="detail.gender" name="gender">-->
<!--            <n-space>-->
<!--              <n-radio key="1" value="1"> 男 </n-radio>-->
<!--              <n-radio key="2" value="2"> 女 </n-radio>-->
<!--              <n-radio key="0" value="0"> 保密 </n-radio>-->
<!--            </n-space>-->
<!--          </n-radio-group>-->
<!--        </n-form-item>-->
<!--        <n-form-item label="我的生日：">-->
<!--          <n-date-picker-->
<!--            v-model:formatted-value="detail.birthday"-->
<!--            type="date"-->
<!--            value-format="yyyy-MM-dd"-->
<!--          />-->
<!--        </n-form-item>-->
<!--        <n-form-item label="个性签名：">-->
<!--          <n-input-->
<!--            placeholder="编辑个签，展示我的独特态度"-->
<!--            type="textarea"-->
<!--            maxlength="500"-->
<!--            show-count-->
<!--            v-model:value="detail.motto"-->
<!--            :autosize="{-->
<!--              minRows: 3,-->
<!--              maxRows: 5-->
<!--            }"-->
<!--          />-->
<!--        </n-form-item>-->

        <n-form-item>
          <n-button
            type="primary"
            @click="onChangeDetail"
            :loading="detail.loading"
            style="margin-left: 94px"
          >
            保存修改
          </n-button>
        </n-form-item>
      </n-form>
    </main>
  </section>

  <!-- 头像裁剪组件 -->
  <AvatarCropper v-if="cropper" @close="cropper = false" @success="onUploadAvatar" />
</template>

<style lang="less" scoped>
@import '@/assets/css/settting.less';

.container {
  height: auto;
}

.el-aside-left {
  width: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 30px;
  margin-right: 10px;
}

.avatar-box {
  background-color: #f5f5f5;
  border-radius: 10px;
  margin-bottom: 20px;
}
</style>
