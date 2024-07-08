<script lang="ts" setup>
import { ref, onMounted, watch, computed } from 'vue'
import { NPopconfirm } from 'naive-ui'
import { Close, CheckSmall } from '@icon-park/vue-next'
import { ServeGetContactApplyRecords, ServeApplyAccept, ServeApplyDecline } from '@/api/contact'
import { throttle } from '@/utils/common'
import { parseTime } from '@/utils/datetime'
import { useUserStore, friendApplyStore } from '@/store'
import { useInject } from '@/hooks'
import grpcClient from "@/grpc-client";
import {gen_grpc} from "@/gen_grpc/api";
import {setAccessToken, setMyUid} from "@/utils/auth";

type Item = {
  id: number
  // user_id: number
  friend_id: number
  remark: string
  nickname: string
  avatar: string
  created_at: string
}

const userStore = useUserStore()
const { showUserInfoModal } = useInject()
// const items = ref<Item[]>([])
const itemStore = friendApplyStore();
const friendApplyItems = computed({
  get: () => itemStore.items,
  set: (value: Item[]) => itemStore.setItems(value)
});

const loading = ref(true)
const isContactApply = computed(() => userStore.isContactApply)

const onLoadData = (isClearTip = false) => {
  if (isClearTip) {
    userStore.isContactApply = false
  }
  loading.value = false
}

const onInfo = (item: Item) => {
  showUserInfoModal(item.friend_id)
}

const onAccept = throttle((item: Item) => {
  let loading = window['$message'].loading('请稍等，正在处理')

  grpcClient.umContactAccept(item.friend_id)
      .then((res: gen_grpc.UmContactAcceptRes) => {
        if (res.errCode === gen_grpc.ErrCode.emErrCode_Ok) {
          itemStore.delFriendItem(item.friend_id)
          window['$message'].success('已同意')
        } else {
          window['$message'].info('操作失败: ' + gen_grpc.ErrCode[res.errCode])
        }
      })
      .catch((err) => {
        window['$message'].info('请求失败：' + err)
        throw err
      })
      .finally(() => {
        loading.destroy()
        onLoadData()
      })
}, 1000)

const onDecline = throttle((item) => {
  let loading = window['$message'].loading('请稍等，正在处理')

  grpcClient.umContactReject(item.friend_id)
      .then((res: gen_grpc.UmContactRejectRes) => {
        if (res.errCode === gen_grpc.ErrCode.emErrCode_Ok) {
          itemStore.delFriendItem(item.friend_id)
          window['$message'].success('已拒绝')
        } else {
          window['$message'].info(res.errCode)
        }
      })
      .catch((err) => {
        window['$message'].info(err)
        throw err
      })
      .finally(() => {
        loading.destroy()
        onLoadData()
      })
}, 1000)

watch(isContactApply, () => {
  onLoadData(false)
})

onMounted(() => {
  onLoadData(true)
})
</script>

<template>
  <section v-loading="loading" style="min-height: 300px">
    <n-empty
      v-show="friendApplyItems.length == 0"
      size="200"
      description="暂无相关数据"
      style="margin-top: 10%"
    >
      <template #icon>
        <img src="@/assets/image/no-data.svg" alt="" />
      </template>
    </n-empty>

    <div class="item" v-for="item in friendApplyItems" :key="item.id">
      <div class="avatar" @click="onInfo(item)">
        <im-avatar :size="40" :src="item.userInfo.avatar" :username="item.userInfo.nickname" />
      </div>

      <div class="content pointer o-hidden" @click="onInfo(item)">
        <div class="username">
          <span>{{ item.userInfo.nickname }}</span>
          <span class="time">{{ parseTime(item.created_at, '{m}/{d} {h}:{i}') }}</span>
        </div>
        <div class="remark text-ellipsis">备注: {{ item.remark }}</div>
      </div>

      <div class="tools">
        <n-button @click="onAccept(item)" strong secondary circle type="primary" size="small">
          <template #icon>
            <n-icon :component="CheckSmall" />
          </template>
        </n-button>

        <n-popconfirm @positive-click="onDecline(item)">
          <template #trigger>
            <n-button strong secondary circle type="tertiary" size="small">
              <template #icon>
                <n-icon :component="Close" />
              </template>
            </n-button>
          </template>
          确认要拒绝申请吗？
        </n-popconfirm>
      </div>
    </div>
  </section>
</template>

<style lang="less" scoped>
.item {
  height: 60px;
  display: flex;
  align-items: center;
  margin: 15px;
  transition: all 0.3s ease-in-out;

  &:first-child {
    margin-top: 0;
  }

  > div {
    height: inherit;
  }

  .avatar {
    width: 40px;
    display: flex;
    align-items: center;
  }

  .content {
    width: 100%;
    margin-left: 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .username {
      height: 30px;
      line-height: 25px;
      display: flex;
      align-items: center;

      .time {
        font-size: 12px;
        color: #bfbbbb;
        margin-left: 5px;
      }
    }

    .remark {
      height: 30px;
      line-height: 25px;
      font-size: 12px;
      color: #9a9292;
      overflow: hidden;
      width: inherit;
      border-bottom: 1px solid var(--border-color);
    }
  }

  .tools {
    width: 100px;
    display: flex;
    align-items: center;
    justify-content: space-around;
  }

  &:hover {
    background-color: var(--im-active-bg-color);

    padding: 0 5px;
    border-radius: 5px;

    .remark {
      border-bottom-color: transparent;
    }
  }
}
</style>
