<script setup>
import './sys-message.less'
import { useInject } from '@/hooks'

defineProps({
  extra: Object,
  data: Object
})

const { showUserInfoModal } = useInject()
</script>

<template>
  <div class="im-message-sys-text">
    <div class="sys-text">
<!--      <a @click="showUserInfoModal(extra.owner_id)">-->
<!--        {{ extra.owner_name }}-->
<!--      </a>-->

      <span>群聊已创建</span>

<!--      <template v-for="(user, index) in extra.members" :key="index">-->
<!--        <a @click="showUserInfoModal(user.user_id)">{{ user.nickname }}</a>-->
<!--        <em v-show="index < extra.members.length - 1">、</em>-->
<!--      </template>-->
    </div>
  </div>
</template>
