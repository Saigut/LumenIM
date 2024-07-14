<script lang="ts" setup>
import { reactive, computed, watch, ref } from 'vue'
import { NEmpty, NPopover, NPopconfirm } from 'naive-ui'
import {useDialogueStore, useEntityInfoStore, UserInfo, useTalkStore, useUserStore} from '@/store'
import GroupLaunch from './GroupLaunch.vue'
import GroupManage from './manage/index.vue'
import { Comment, Search, Close, Plus } from '@icon-park/vue-next'
import {
  ServeGroupDetail,
  ServeGetGroupMembers,
  ServeSecedeGroup,
  ServeUpdateGroupCard
} from '@/api/group'
import { useInject } from '@/hooks'
import grpcClient from "@/grpc-client";
import {gen_grpc} from "@/gen_grpc/api";

const userStore = useUserStore()
const dialogueStore = useDialogueStore()
const talkStore = useTalkStore()
const { showUserInfoModal } = useInject()

const emit = defineEmits(['close', 'to-talk'])
const props = defineProps({
  gid: {
    type: Number,
    default: 0
  }
})

watch(props, () => {
  loadDetail()
  loadMembers()
})

const editCardPopover = ref(false)
const isShowGroup = ref(false)
const isShowManage = ref(false)
const state = reactive({
  keywords: '',
  detail: {
    id: 0,
    avatar: '',
    name: '',
    profile: '',
    visit_card: '',
    notice: '',
    owner_id: 0,
  },
  remark: ''
})

const members = ref<UserInfo[]>([])

const search = computed<any[]>(() => {
  if (state.keywords) {
    const keywordRegex = new RegExp(state.keywords, 'i');
    return members.value.filter((item: any) => {
      return (
          item.nickname?.match(keywordRegex) != null || item.noteName?.match(keywordRegex) != null || item.username?.match(keywordRegex) != null
      );
    });
  }

  return members.value
})

const isLeader = computed(() => {
  return members.value.some((item: any) => {
    return item.id == userStore.uid && state.detail.owner_id == userStore.uid
  })
})

const isAdmin = computed(() => {
  return members.value.some((item: any) => {
    return item.id == userStore.uid && (state.detail.owner_id == userStore.uid || item.leader == 2)
  })
})

const onShowManage = (vallue: any) => {
  isShowManage.value = vallue
}

const onGroupCallBack = () => {}

const onToInfo = (item: any) => {
  showUserInfoModal(item.id)
}

/**
 * 加载群信息
 */
function loadDetail() {
  grpcClient.umGroupGetInfo(props.gid)
      .then((res: gen_grpc.UmGroupGetInfoRes) => {
        if (res.errCode === gen_grpc.ErrCode.emErrCode_Ok) {
          state.detail.id = res.groupInfo.groupId
          state.detail.avatar = res.groupInfo.avatar
          state.detail.name = res.groupInfo.groupName
          state.detail.owner_id = res.groupInfo.ownerUid
          state.detail.profile = ""
          state.detail.visit_card = ""
          state.remark = ""
          state.detail.notice = ""
          useEntityInfoStore().fetchGroupInfo(props.gid)
        } else {
          console.log("umGroupGetInfo failed:", res.errCode)
        }
      })
      .catch((err) => {
        console.log("umGroupGetInfo err:", err)
        throw err
      })
}

/**
 * 加载成员列表
 */
function loadMembers() {
  grpcClient.umGroupGetMemList(props.gid)
      .then((res: gen_grpc.UmGroupGetMemListRes) => {
        if (res.errCode === gen_grpc.ErrCode.emErrCode_Ok) {
          res.memUidList.forEach((uid: number) => {
            const ret = useEntityInfoStore().getUserById(uid);
            if (ret.isNew) {
              useEntityInfoStore().fetchUserInfo(uid)
            }
            members.value.push(ret.userInfo)
          })
        } else {
          console.log("umGroupGetInfo failed:", res.errCode)
        }
      })
      .catch((err) => {
        console.log("umGroupGetInfo err:", err)
        throw err
      })
}

const onClose = () => {
  emit('close')
}

const onDeleteTalk = (index_name = '') => {
  talkStore.delItem(index_name)
  dialogueStore.delItem(index_name);
  dialogueStore.resetCurrentIndexName();
  // index_name === indexName.value && dialogueStore.$reset()
}

const onSignOut = () => {
  grpcClient.umGroupLeave(props.gid)
      .then((res: gen_grpc.UmGroupLeaveRes) => {
        if (res.errCode === gen_grpc.ErrCode.emErrCode_Ok) {
          window['$message'].success('已退出群聊')
          onClose()
          onDeleteTalk('2_' + props.gid?.toString())
        } else {
          window['$message'].error("操作失败：", gen_grpc.ErrCode[res.errCode])
        }
      })
      .catch((err) => {
        window['$message'].error("请求失败", err)
        throw err
      })

  // ServeSecedeGroup({
  //   group_id: props.gid
  // }).then((res) => {
  //   if (res.code == 200) {
  //     window['$message'].success('已退出群聊')
  //     onClose()
  //   } else {
  //     window['$message'].error(res.message)
  //   }
  // })
}

const onChangeRemark = () => {
  ServeUpdateGroupCard({
    group_id: props.gid,
    visit_card: state.remark
  }).then(({ code, message }) => {
    if (code == 200) {
      // @ts-ignore
      editCardPopover.value.setShow(false)
      state.detail.visit_card = state.remark
      window['$message'].success('已更新群名片')

      loadMembers()
    } else {
      window['$message'].error(message)
    }
  })
}

loadDetail()
loadMembers()
</script>
<template>
  <section class="el-container is-vertical section">
    <header class="el-header header bdr-b">
      <div class="left-icon" @click="emit('to-talk')">
        <n-icon size="21" :component="Comment" />
      </div>
      <div class="center-text">
        <span>群信息</span>
      </div>
      <div class="right-icon">
        <n-icon size="21" :component="Close" @click="onClose" />
      </div>
    </header>

    <main class="el-main main me-scrollbar me-scrollbar-thumb">
      <div class="info-box">
        <div class="b-box">
          <div class="block">
            <div class="title">群名称：<span class="describe">{{ state.detail.name }}</span></div>
          </div>
<!--          <div class="describe">{{ state.detail.name }}</div>-->
        </div>
        <div class="b-box">
          <div class="block">
            <div class="title">群ID：{{ state.detail.id }}</div>
          </div>
        </div>

<!--        <div class="b-box">-->
<!--          <div class="block">-->
<!--            <div class="title">群名片：</div>-->
<!--            <div class="text">-->
<!--              <n-popover trigger="click" placement="left" ref="editCardPopover">-->
<!--                <template #trigger>-->
<!--                  <n-button type="primary" text> 设置 </n-button>-->
<!--                </template>-->

<!--                <template #header> 设置我的群名片 </template>-->

<!--                <div style="display: flex">-->
<!--                  <n-input-->
<!--                    type="text"-->
<!--                    placeholder="设置我的群名片"-->
<!--                    maxlength="10"-->
<!--                    v-model:value="state.remark"-->
<!--                    @keydown.enter="onChangeRemark"-->
<!--                  />-->
<!--                  <n-button type="primary" class="mt-l5" @click="onChangeRemark"> 确定 </n-button>-->
<!--                </div>-->
<!--              </n-popover>-->
<!--            </div>-->
<!--          </div>-->
<!--          <div class="describe">{{ state.detail.visit_card || '未设置' }}</div>-->
<!--        </div>-->

        <div class="b-box">
          <div class="block">
            <div class="title">群成员：</div>
            <div class="text">{{ members.length }}人</div>
          </div>
          <div class="describe">群主已开启“新成员入群可查看所有聊天记录</div>
        </div>

<!--        <div class="b-box">-->
<!--          <div class="block">-->
<!--            <div class="title">群简介：</div>-->
<!--          </div>-->
<!--          <div class="describe">-->
<!--            {{ state.detail.profile ? state.detail.profile : '暂无群简介' }}-->
<!--          </div>-->
<!--        </div>-->

<!--        <div class="b-box">-->
<!--          <div class="block">-->
<!--            <div class="title">群公告：</div>-->
<!--            <div class="text">-->
<!--              <n-button type="primary" text> 更多 </n-button>-->
<!--            </div>-->
<!--          </div>-->
<!--          <div class="describe">暂无群公告</div>-->
<!--        </div>-->
      </div>

      <div class="member-box">
        <div class="flex">
          <n-input placeholder="搜索" v-model:value="state.keywords" :clearable="true" round>
            <template #prefix>
              <n-icon :component="Search" />
            </template>
          </n-input>

          <n-button @click="isShowGroup = true" circle class="mt-l15">
            <template #icon>
              <n-icon :component="Plus" color="rgb(165 165 170)" />
            </template>
          </n-button>
        </div>

        <div class="table">
          <div class="theader">
            <div class="avatar"></div>
            <div class="nickname">用户昵称</div>
            <div class="card">群名片</div>
          </div>

          <div class="row pointer" v-for="item in search" :key="item.id" @click="onToInfo(item)">
            <div class="avatar">
              <im-avatar :size="20" :src="item.avatar" :username="item.nickname" />
            </div>
            <div class="nickname text-ellipsis">
              <span>{{ item.nickname ? item.nickname : '-' }}</span>
              <span class="badge master" v-show="item.leader === 2">群主</span>
              <span class="badge leader" v-show="item.leader === 1">管理员</span>
            </div>
            <div class="card text-ellipsis grey">
              {{ item.remark || '-' }}
            </div>
          </div>

          <div class="mt-t20 pd-t20" v-if="search.length == 0">
            <n-empty size="200" description="暂无相关数据">
              <template #icon>
                <img src="@/assets/image/no-data.svg" alt="" />
              </template>
            </n-empty>
          </div>
        </div>
      </div>
    </main>

    <footer class="el-footer footer bdr-t">
      <template v-if="state.detail.id != 0 && !isAdmin">
        <n-popconfirm negative-text="取消" positive-text="确定" @positive-click="onSignOut">
          <template #trigger>
            <n-button class="btn" type="error" ghost> 退出群聊 </n-button>
          </template>
          确定要退出群吗？ 退出后不再接收此群消息！
        </n-popconfirm>
      </template>

      <n-button
        class="btn"
        type="primary"
        text-color="#ffffff"
        v-if="isLeader"
        @click="onShowManage(true)"
      >
        群聊管理
      </n-button>
    </footer>
  </section>

  <GroupLaunch
    v-if="isShowGroup"
    :gid="gid"
    @close="isShowGroup = false"
    @on-submit="onGroupCallBack"
  />

  <GroupManage v-if="isShowManage" :gid="gid" :groupState="state" @close="onShowManage(false)" />
</template>
<style lang="less" scoped>
.section {
  width: 100%;
  height: 100%;

  .header {
    width: 100%;
    height: 60px;

    display: flex;
    align-items: center;
    justify-content: center;

    > div {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .center-text {
      flex: auto;
      font-weight: 500;
      font-size: 16px;
    }

    .left-icon,
    .right-icon {
      width: 50px;
      height: 100%;
      flex-shrink: 0;
      cursor: pointer;
    }
  }

  .main {
    padding: 15px;

    .info-box {
      .b-box {
        display: flex;
        align-items: center;
        min-height: 30px;
        margin: 12px 0;
        flex-direction: column;

        &:first-child {
          margin-top: 0;
        }

        .block {
          width: 100%;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;

          .title {
            height: 100%;
            line-height: 30px;
            flex: auto;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }

          .text {
            height: 100%;
            line-height: 30px;
            width: 30%;
            text-align: right;
          }
        }

        .describe {
          width: 100%;
          min-height: 24px;
          line-height: 24px;
          font-size: 13px;
          color: #b1b1b1;
          font-weight: 300;
          overflow: hidden;
          word-break: break-word;
        }
      }
    }

    .member-box {
      min-height: 180px;
      padding: 20px 15px;
      margin-bottom: 20px;
      border: 1px solid var(--border-color);
      border-radius: 10px;

      .table {
        margin-top: 15px;
        .theader {
          height: 36px;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 15px;
        }

        .row {
          height: 30px;
          margin: 3px 0;
          &:hover {
            .nickname {
              color: #1890ff;
            }
          }
        }

        .theader,
        .row {
          display: flex;
          align-items: center;
          justify-content: center;

          > div {
            height: 30px;
            display: flex;
            align-items: center;
            font-size: 13px;
          }

          .avatar {
            width: 30px;
            justify-content: flex-start;
          }

          .nickname {
            flex: auto;
          }

          .card {
            width: 100px;
            padding-right: 8px;
            justify-content: flex-end;

            &.grey {
              font-size: 13px;
              font-weight: 300;
            }
          }
        }
      }
    }
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-around;
    height: 60px;
    padding: 15px;
    .btn {
      width: 48%;
    }
  }
}

.badge {
  margin-left: 3px;
  &.master {
    color: #dc9b04 !important;
    background-color: #faf1d1 !important;
  }

  &.leader {
    color: #3370ff;
    background-color: #e1eaff;
  }
}
</style>
