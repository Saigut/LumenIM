<script lang="ts" setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { NSpace, NDrawer, NTabs, NTab } from 'naive-ui'
import { ServeGetGroups } from '@/api/group'
import { Search, Plus } from '@icon-park/vue-next'
import {useUserStore, useTalkStore, GroupInfo, createGroupInfo} from '@/store'
import GroupPanel from '@/components/group/GroupPanel.vue'
import GroupLaunch from '@/components/group/GroupLaunch.vue'
import GroupCard from './inner/GroupCard.vue'

import { useRouter } from 'vue-router'
import grpcClient from "@/grpc-client";
import {gen_grpc} from "@/gen_grpc/api";

const router = useRouter()
const userStore = useUserStore()
const talkStore = useTalkStore()
const isShowCreateGroupBox = ref(false)
const keywords = ref('')
const items = ref([])

const params = reactive({
  isShow: false,
  id: 0
})

const tabIndex = ref('all')

const uid = userStore.uid

const filterCreator = computed(() => {
  return items.value.filter((item: any) => item.creator_id == uid)
})

const filter = computed((): any[] => {
  return items.value.filter((item: any) => {
    if (tabIndex.value == 'create' && item.creator_id != uid) {
      return false
    }

    if (tabIndex.value == 'join' && item.creator_id == uid) {
      return false
    }

    return item.name.toLowerCase().indexOf(keywords.value.toLowerCase()) != -1
  })
})

const onLoadData = () => {
  grpcClient.umGroupGetList().then((res: gen_grpc.UmGroupGetListRes) => {
    if (res.errCode === gen_grpc.ErrCode.emErrCode_Ok) {
      items.value = []
      for (const group of res.groupList) {
        let item: GroupInfo = createGroupInfo()
        item.id = group.groupId
        item.name = group.groupName
        item.ownerId = group.ownerUid
        item.memCount = group.memCount
        item.avatar = group.avatar
        item.profile = ""
        items.value.push(item)
      }
    } else {
      console.log("failed to get group list: " + res.errCode)
    }
  }).catch((err) => {
    console.log("failed to get group list: " + err)
    throw err
  })
}

const onShowGroup = (item: any) => {
  params.isShow = true
  params.id = item.id
}

const onToTalk = (item: any) => {
  talkStore.toTalk(2, item.id, router)
}

const onGroupCallBack = () => {
  isShowCreateGroupBox.value = false
  onLoadData()
  talkStore.loadTalkList()
}

onMounted(() => {
  onLoadData()
})
</script>

<template>
  <section id="drawer-target" class="el-container is-vertical height100">
    <header class="el-header me-view-header bdr-b">
      <div>
        <n-tabs v-model:value="tabIndex">
          <n-tab name="all"> 群聊({{ items.length }}) </n-tab>
<!--          <n-tab name="create"> 我创建的({{ filterCreator.length }}) </n-tab>-->
<!--          <n-tab name="join"> 我加入的({{ items.length - filterCreator.length }}) </n-tab>-->
        </n-tabs>
      </div>

      <n-space>
        <n-input
          v-model:value.trim="keywords"
          placeholder="搜索"
          clearable
          style="max-width: 200px"
          round
        >
          <template #prefix>
            <n-icon :component="Search" />
          </template>
        </n-input>

        <n-button circle @click="isShowCreateGroupBox = true">
          <template #icon>
            <n-icon :component="Plus" />
          </template>
        </n-button>
      </n-space>
    </header>

    <main v-if="filter.length == 0" class="el-main flex-center">
      <n-empty size="200" description="暂无相关数据">
        <template #icon>
          <img src="@/assets/image/no-data.svg" alt="" />
        </template>
      </n-empty>
    </main>

    <main v-else class="el-main me-scrollbar me-scrollbar-thumb pd-10">
      <div class="cards">
        <GroupCard
          v-for="item in filter"
          :key="item.id"
          :avatar="item.avatar"
          :username="item.name"
          :gender="0"
          :motto="item.profile"
          flag="查看"
          :is-member="true"
          @click="onShowGroup(item)"
          @talk="onToTalk(item)"
        />
      </div>
    </main>
  </section>

  <GroupLaunch
    v-if="isShowCreateGroupBox"
    @close="isShowCreateGroupBox = false"
    @on-submit="onGroupCallBack"
  />

  <n-drawer
    v-model:show="params.isShow"
    :width="400"
    placement="right"
    :trap-focus="false"
    :block-scroll="false"
    to="#drawer-target"
    show-mask="transparent"
  >
    <GroupPanel
      :gid="params.id"
      @close="params.isShow = false"
      @to-talk="talkStore.toTalk(2, params.id, router)"
    />
  </n-drawer>
</template>

<style lang="less" scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  grid-gap: 12px;
  gap: 12px;
}
</style>
