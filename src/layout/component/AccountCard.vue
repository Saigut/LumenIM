<script lang="ts" setup>
import {createUserInfo, useEntityInfoStore, UserInfo, useUserStore} from '@/store'
import { Male, Female } from '@icon-park/vue-next'
import {onMounted, reactive, ref, watch} from "vue";

const store = useUserStore()
// const userInfo: UserInfo = reactive(createUserInfo())
//
// onMounted(() => {
//   const ret = useEntityInfoStore().getUserById(useUserStore().uid)
//   if (ret.isNew) {
//     useEntityInfoStore().fetchUserInfo(useUserStore().uid)
//   }
//   userInfo = ret.userInfo
// })

const userInfo = ref(createUserInfo())

onMounted(() => {
  const entityInfoStore = useEntityInfoStore()
  const userStore = useUserStore()
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
  <section class="account-card">
    <div class="card-header">
      <im-avatar
          round
          class="avatar"
          :size="100"
          :src="userInfo.avatar"
          :username="userInfo.remark || userInfo.nickname"
          :font-size="30" />

      <div class="nickname text-ellipsis">
        {{ userInfo.nickname || '未设置昵称' }}
      </div>

<!--      <div class="gender" v-show="userInfo.gender > 0">-->
<!--        <n-icon v-if="userInfo.gender == 1" :component="Male" color="#508afe" />-->
<!--        <n-icon v-if="userInfo.gender == 2" :component="Female" color="#ff5722" />-->
<!--      </div>-->
    </div>

    <div class="card-main">
      <div style="text-align: center;" class="nickname text-ellipsis">
        账号：{{ userInfo.username }}
      </div>
<!--      <div class="usersign pointer">-->
<!--        <span style="font-weight: 600">个性签名：</span>-->
<!--        <span>-->
<!--          {{ userInfo.motto || ' 编辑个签，展示我的独特态度。' }}-->
<!--        </span>-->
<!--      </div>-->
    </div>
  </section>
</template>

<style lang="less" scoped>
.account-card {
  width: 320px;
  min-height: 300px;
  background: var(--im-bg-color);
  padding-bottom: 20px;

  .card-header {
    width: 100%;
    height: 230px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(to bottom right, #247ec6, #73c1ff);

    .gender {
      width: 20px;
      height: 20px;
      position: absolute;
      right: 102px;
      bottom: 65px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .nickname {
      position: absolute;
      bottom: 20px;
      width: 50%;
      height: 30px;
      font-size: 16px;
      line-height: 30px;
      text-align: center;
      color: #ffffff;
    }
  }
}

.account-card .card-main {
  margin-top: 10px;
  min-height: 50px;
  text-align: left;
  padding: 0 16px;

  .usersign {
    min-height: 26px;
    border-radius: 5px;
    padding: 8px;
    line-height: 25px;
    background: #f3f5f7;
    color: var(--im-text-color);
    font-size: 12px;
    margin-bottom: 3px;
    position: relative;
  }
}

html[theme-mode='dark'] {
  .account-card .card-header {
    background: #2c2c32;
  }

  .account-card .card-main .usersign {
    background-color: #2c2c32;
  }
}
</style>
