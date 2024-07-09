<script lang="ts" setup>
import { ref, onMounted, h, computed } from 'vue'
import { NInput } from 'naive-ui'
import { Close, CheckSmall } from '@icon-park/vue-next'
import { useUserStore, relationReqStore, GroupJoinReq } from '@/store'
import { throttle } from '@/utils/common'
import { parseTime } from '@/utils/datetime'
import { useUtil, useInject } from '@/hooks'
import grpcClient from "@/grpc-client";
import {gen_grpc} from "@/gen_grpc/api";

const { useMessage, useDialog } = useUtil()
const { showUserInfoModal } = useInject()
const userStore = useUserStore()
const itemStore = relationReqStore();
const groupApplyItems = computed({
  get: () => itemStore.groupJoinReqs,
  set: (value: GroupJoinReq[]) => itemStore.setGroupJoinReqs(value)
});
const loading = ref(true)

const onLoadData = () => {
  loading.value = false
  // ServeGetGroupApplyAll()
  //   .then((res) => {
  //     if (res.code == 200) {
  //       groupApplyItems.value = res.data.items || []
  //     }
  //   })
  //   .finally(() => {
  //     loading.value = false
  //   })
}

const onInfo = (item: GroupJoinReq) => {
  showUserInfoModal(item.user_id)
}

const onAgree = throttle((item: GroupJoinReq) => {
  let loading = useMessage.loading('请稍等，正在处理')

  console.log(item)
  grpcClient.umGroupAccept(item.group_id, item.user_id)
      .then((res: gen_grpc.UmGroupAcceptRes) => {
        if (res.errCode === gen_grpc.ErrCode.emErrCode_Ok) {
          itemStore.delGroupJoinReq(item.group_id, item.user_id)
          useMessage.success('已同意')
        } else {
          useMessage.info('操作失败: ' + gen_grpc.ErrCode[res.errCode])
        }
      })
      .catch((err) => {
        useMessage.info('请求失败：' + err)
        throw err
      })
      .finally(() => {
        loading.destroy()
        onLoadData()
      })
}, 1000)

const onDelete = (item: GroupJoinReq) => {
  let remark = ''
  let dialog = useDialog.create({
    title: '拒绝入群申请',
    content: () => {
      return h(NInput, {
        defaultValue: '',
        placeholder: '请填写拒绝原因',
        style: { marginTop: '20px' },
        onInput: (value) => (remark = value),
        autofocus: true
      })
    },
    negativeText: '取消',
    positiveText: '提交',
    onPositiveClick: () => {

      dialog.loading = true

      grpcClient.umGroupReject(item.group_id, item.user_id)
          .then((res: gen_grpc.UmGroupRejectRes) => {
            if (res.errCode === gen_grpc.ErrCode.emErrCode_Ok) {
              itemStore.delGroupJoinReq(item.group_id, item.user_id)
              useMessage.success('已拒绝')
            } else {
              useMessage.info('请求失败: ' + gen_grpc.ErrCode[res.errCode])
            }
          })
          .catch((err) => {
            useMessage.info(err)
            throw err
          })
          .finally(() => {
            dialog.destroy()
            onLoadData()
          })

      return false
    }
  })
}

onMounted(() => {
  onLoadData()

  userStore.isGroupApply = false
})
</script>

<template>
  <section v-loading="loading" style="min-height: 300px">
    <n-empty
      v-show="groupApplyItems.length == 0"
      style="margin-top: 10%"
      size="200"
      description="暂无相关数据"
    >
      <template #icon>
        <img src="@/assets/image/no-data.svg" alt="" />
      </template>
    </n-empty>

    <div class="item" v-for="item in groupApplyItems" :key="item.id">
      <div class="avatar" @click="onInfo(item)">
        <im-avatar :size="40" :src="item.userInfo.avatar" :username="item.userInfo.nickname" />
      </div>

      <div class="content pointer o-hidden" @click="onInfo(item)">
        <div class="username">
          <span>
            {{ item.userInfo.nickname }} 申请加入
            <n-tag :bordered="false" size="small" type="primary">
              {{ item.groupInfo.name }}
            </n-tag>
          </span>
          <span class="time">{{ parseTime(item.created_at, '{m}/{d} {h}:{i}') }}</span>
        </div>
        <div class="remark text-ellipsis">备注: {{ item.remark }}</div>
      </div>

      <div class="tools">
        <n-button @click="onAgree(item)" strong secondary circle size="small" type="primary">
          <template #icon>
            <n-icon :component="CheckSmall" />
          </template>
        </n-button>

        <n-button @click="onDelete(item)" strong secondary circle type="tertiary" size="small">
          <template #icon>
            <n-icon :component="Close" />
          </template>
        </n-button>
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
  transition: all 0.3s ease-in;

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
