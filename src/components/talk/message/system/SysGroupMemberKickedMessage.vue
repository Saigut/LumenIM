<script lang="ts" setup>
import './sys-message.less'
import { useInject } from '@/hooks'
import {ResourceData} from "@/types/chat";
import { useUserStore } from '@/store'

type Props = {
  extra: object
  data: ResourceData
  receiver_id: number
  maxWidth?: boolean
  source?: 'panel' | 'forward' | 'history'
}
const props = defineProps<Props>();

const { showUserInfoModal } = useInject()

</script>

<template>
  <div class="im-message-sys-text">
    <div class="sys-text">
<!--      <a @click="showUserInfoModal(extra.owner_id)">-->
<!--        {{ extra.owner_name }}-->
<!--      </a>-->

<!--      <span>将</span>-->

<!--      <template v-for="(user, index) in extra.members" :key="index">-->
<!--        <a @click="showUserInfoModal(user.user_id)">{{ user.nickname }}</a>-->
<!--        <em v-show="index < extra.members.length - 1">、</em>-->
<!--      </template>-->

<!--      <span>踢出群聊</span>-->
      <template v-if="props.data.user_id == useUserStore().uid">
        <span>你已被移出群聊</span>
      </template>
      <template v-else>
        <a @click="showUserInfoModal(props.data.user_id)">{{ props.data.user_info.nickname }}</a>
        <span>已被移出群聊</span>
      </template>
    </div>
  </div>
</template>
