<script lang="ts" setup>
import './sys-message.less'
import { useInject } from '@/hooks'
import {ResourceData} from "@/types/chat";

type Props = {
  extra: object;
  data: ResourceData;
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

      <a @click="showUserInfoModal(props.data.user_id)">{{ props.data.user_info.nickname }}</a>
      <span>退出了群聊</span>
    </div>
  </div>
</template>
