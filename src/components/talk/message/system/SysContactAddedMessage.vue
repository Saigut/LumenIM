<script lang="ts" setup>
import './sys-message.less'
import { useInject } from '@/hooks'
import { ResourceData } from "@/types/chat";
import { useUserStore, entityGetUserById } from '@/store'

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
    <template v-if="data.user_id === useUserStore().uid">
      <div class="sys-text">
        <span>你已添加了{{ entityGetUserById(receiver_id).value.nickname }}，现在可以开始聊天了</span>
      </div>
    </template>
    <template v-else>
      <div class="sys-text">
        <span>{{ data.extra.content }}</span>
      </div>
    </template>
  </div>
</template>
