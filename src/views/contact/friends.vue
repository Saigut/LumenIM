<script lang="ts" setup>
import {ref, computed, onMounted, Ref} from 'vue'
import { NSpace, NTabs, NTab, NDropdown } from 'naive-ui'
import { Search, Plus } from '@icon-park/vue-next'
import MemberCard from './inner/MemberCard.vue'
import UserSearchModal from './inner/UserSearchModal.vue'
import GroupManage from './inner/GroupManage.vue'
import { ServeGetContacts, ServeDeleteContact, ServeContactGroupList } from '@/api/contact'
import { useFriendsMenu, useEventBus, useInject } from '@/hooks'
import { ContactConst } from '@/constant/event-bus'
import {createUserInfo, useDialogueStore, UserInfo, useTalkStore} from '@/store'
import { useRouter } from 'vue-router'
import grpcClient from "@/grpc-client";
import {gen_grpc} from "@/gen_grpc/api";

const router = useRouter()
const talkStore = useTalkStore()
const { dropdown, showDropdownMenu, closeDropdownMenu } = useFriendsMenu()
const { showUserInfoModal } = useInject()
const isShowUserSearch = ref(false)
const isShowGroupModal = ref(false)
const keywords = ref('')
const index = ref(0)
const items: Ref<UserInfo[]> = ref([])
const groups: any = ref([])
const dialogueStore = useDialogueStore()

const filter: any = computed(() => {
  return items.value.filter((item: any) => {
    let value = item.remark || item.nickname

    let findIndex = value.toLowerCase().indexOf(keywords.value.toLowerCase())
    if (index.value == 0) {
      return findIndex != -1
    }

    return findIndex != -1 && index.value == item.group_id
  })
})

const loadContactList = () => {
  grpcClient.umContactGetList()
      .then((res: gen_grpc.UmContactGetListRes) => {
    if (res.errCode === gen_grpc.ErrCode.emErrCode_Ok) {
      items.value = []
      for (const contact of res.contactList) {
        let item: UserInfo = createUserInfo()
        item.avatar = contact.avatar
        item.gender = 0
        item.group_id = 0
        item.id = contact.uid
        item.is_online = 1
        item.motto = ""
        item.nickname = contact.nickname
        item.remark = contact.noteName
        item.email = contact.email
        item.isMutualContact = contact.isMutualContact
        items.value.push(item)
      }
      let item = {} as any
      item.count = items.value.length
      item.name = "好友"
      item.id = 0
      item.sort = 0
      groups.value = [ item ]

    } else {
      console.log("failed to get contact list: " + res.errCode)
    }
  }).catch((err) => {
    console.log("failed to get contact list: " + err)
    throw err
  })
}

const loadContactGroupList = () => {
  // ServeContactGroupList().then((res) => {
  //   if (res.code == 200) {
  //     groups.value = res.data.items || []
  //   }
  // })
}

const onToTalk = (item: any) => {
  talkStore.toTalk(1, item.id, router)
}

const onDeleteTalk = (index_name = '') => {
  talkStore.delItem(index_name)
  dialogueStore.delItem(index_name);
  dialogueStore.resetCurrentIndexName();
}

const onInfo = (item: any) => {
  showUserInfoModal(item.id)
}

// 移除联系人
const onDeleteContact = (data: any) => {
  let name = data.remark || data.nickname
  window['$dialog'].create({
    showIcon: false,
    title: `删除 [${name}] 联系人？`,
    content: '删除后不再接收对方任何消息。',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      grpcClient.umContactDel(data.id)
          .then((res: gen_grpc.UmContactDelRes) => {
            if (res.errCode === gen_grpc.ErrCode.emErrCode_Ok) {
                window['$message'].success('删除联系人成功')
                loadContactList()
                onDeleteTalk(`1_${data.id}`)
            } else {
              window['$message'].error("删除联系人失败", gen_grpc.ErrCode[res.errCode])
            }
          })
          .catch((err) => {
            window['$message'].error("删除联系人失败", err)
            throw err
          })
    }
  })
}

const onContextMenu = (e, item) => {
  showDropdownMenu(e, item)

  e.preventDefault()
}

const onContextMenuHandle = (key = '') => {
  const evnets = {
    delete: onDeleteContact
  }

  // 触发事件
  evnets[key] && evnets[key](dropdown.item)

  closeDropdownMenu()
}

const onToolsMenu = (value) => {
  switch (value) {
    case 'add':
      isShowUserSearch.value = true
      break
    case 'group':
      isShowGroupModal.value = true
      break
  }
}

const onChangeRemark = (data: any) => {
  let item: any = items.value.find((item: any) => item.id == data.user_id)
  item && (item.remark = data.remark)
}

onMounted(() => {
  loadContactList()
  loadContactGroupList()
})

useEventBus([{ name: ContactConst.UpdateRemark, event: onChangeRemark }])
</script>

<template>
  <section class="el-container is-vertical height100">
    <header class="el-header from-header bdr-b">
      <div class="groups">
        <n-tabs v-if="groups.length" v-model:value="index">
          <n-tab v-for="tab in groups" :key="tab.id" :name="tab.id">
            {{ tab.name }}({{ tab.count }})
          </n-tab>
        </n-tabs>
      </div>
      <div class="tools">
        <n-space>
<!--          <n-input-->
<!--            v-model:value.trim="keywords"-->
<!--            placeholder="搜索"-->
<!--            clearable-->
<!--            style="width: 200px"-->
<!--            round-->
<!--          >-->
<!--            <template #prefix>-->
<!--              <n-icon :component="Search" />-->
<!--            </template>-->
<!--          </n-input>-->
          <div style="width: 200px"></div>

          <n-dropdown
            :animated="true"
            trigger="hover"
            :show-arrow="false"
            @select="onToolsMenu"
            :options="[
              {
                label: '添加好友',
                key: 'add'
              },
              // {
              //   label: '分组管理',
              //   key: 'group'
              // }
            ]"
          >
            <n-button circle>
              <template #icon>
                <n-icon :component="Plus" />
              </template>
            </n-button>
          </n-dropdown>
        </n-space>
      </div>
    </header>

    <main
      id="drawer-target"
      class="el-main pd-10 me-scrollbar me-scrollbar-thumb"
      v-if="filter.length"
    >
      <div class="cards">
        <MemberCard
          v-for="item in filter"
          :key="item.id"
          :avatar="item.avatar"
          :username="item.remark || item.nickname"
          :gender="item.gender"
          :motto="item.motto"
          flag="查看"
          @click="onInfo(item)"
          @to-talk="onToTalk(item)"
          @contextmenu.prevent="onContextMenu($event, item)"
        />
      </div>
    </main>

    <main class="el-main flex-center" v-else>
      <n-empty size="200" description="暂无相关数据">
        <template #icon>
          <img src="@/assets/image/no-data.svg" alt="" />
        </template>
      </n-empty>
    </main>
  </section>

  <!-- 用户查询模态框 -->
  <UserSearchModal v-model:show="isShowUserSearch" />

  <!-- 分组管理 -->
  <GroupManage
    v-if="isShowGroupModal"
    @close="isShowGroupModal = false"
    @relaod="loadContactGroupList"
  />

  <!-- 右键菜单 -->
  <n-dropdown
    :show="dropdown.show"
    :x="dropdown.x"
    :y="dropdown.y"
    :options="dropdown.options"
    @select="onContextMenuHandle"
    @clickoutside="closeDropdownMenu"
  />
</template>

<style lang="less" scoped>
.from-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .groups {
    display: flex;
    align-items: center;
    flex: 1 auto;
    height: 100%;
    margin-right: 30px;
    overflow: hidden;
    padding-left: 15px;
  }

  .tools {
    display: flex;
    align-items: center;
    height: 100%;
    width: 250px;
    flex-shrink: 0;
    padding-right: 10px;
  }
}

#drawer-target {
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    grid-gap: 12px;
    gap: 12px;
  }
}
</style>
