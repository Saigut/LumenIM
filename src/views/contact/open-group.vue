<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { NAlert } from 'naive-ui'
import { Search, AddOne } from '@icon-park/vue-next'
import GroupApply from '@/components/group/GroupApply.vue'
import GroupCard from './inner/GroupCard.vue'
import { ServeGroupOvertList } from '@/api/group'
import { debounce } from '@/utils/common'
import grpcClient from "@/grpc-client";
import {gen_grpc} from "@/gen_grpc/api";
import {setAccessToken, setMyUid} from "@/utils/auth";

const apply = reactive({
  isShow: false,
  groupId: 0
})

const search = reactive({
  page: 1,
  name: '',
  next: false,
  loading: false
})

const items = ref<any[]>([])

const onLoadData = () => {
  if (search.name.trim() === "") {
    return;
  }

  if (search.loading) return

  search.loading = true

  grpcClient.umGroupFind(search.name)
      .then((res: gen_grpc.UmGroupFindRes) => {
        if (res.errCode === gen_grpc.ErrCode.emErrCode_Ok) {
          let groupInfo = res.groupInfo

          let item = {} as any
          item.id = groupInfo.groupId
          item.name = groupInfo.groupName
          item.avatar = groupInfo.avatar
          item.gender = 0
          item.profile = ""
          item.count = groupInfo.memCount
          item.max_num = 200
          items.value = [ item ]

          search.next = false
        } else {
          window['$message'].warning(res.errCode)
        }
      }).catch((err) => {
        window['$message'].warning(err)
        throw err
      })
      .finally(() => {
        search.loading = false
      })
}

const onLoadMore = () => {
  search.page++
  onLoadData()
}

const onSearchInput = debounce((value: string) => {
  search.page = 1
  search.name = value

  onLoadData()
}, 300)

const onJoin = (item: any) => {
  apply.isShow = true
  apply.groupId = item.id
}

onLoadData()
</script>

<template>
  <section class="el-container height100">
    <main class="el-main">
      <section class="el-container is-vertical height100">
        <header class="el-header me-view-header bdr-b">
          <div>搜索群聊({{ items.length }})</div>
          <div>
            <n-input
              placeholder="请输入群ID"
              clearable
              style="width: 200px"
              :on-input="onSearchInput"
              round
            >
              <template #prefix>
                <n-icon :component="Search" />
              </template>
            </n-input>
          </div>
        </header>

        <main class="el-main flex-center" v-if="items.length == 0">
          <n-empty size="200" description="暂无相关数据">
            <template #icon>
              <img src="@/assets/image/no-data.svg" alt="" />
            </template>
          </n-empty>
        </main>

        <main class="el-main me-scrollbar me-scrollbar-thumb pd-10" v-else>
          <n-alert type="info" :bordered="false" closable class="mt-b10">
            公开群聊可自行添加入群申请，待群主（管理员）同意后方可入群！
          </n-alert>

          <div class="cards">
            <GroupCard
              v-for="item in items"
              :key="item.id"
              :avatar="item.avatar"
              :username="item.name"
              :gender="item.gender"
              :motto="item.profile"
              :flag="item.count + '/' + item.max_num"
              @join="onJoin(item)"
            />

            <div v-show="search.next" class="flex-center more" @click="onLoadMore">
              <n-icon :component="AddOne" />

              &nbsp;加载更多
            </div>
          </div>
        </main>
      </section>
    </main>
  </section>

  <GroupApply v-if="apply.isShow" :gid="apply.groupId" @close="apply.isShow = false" />
</template>

<style lang="less" scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  grid-gap: 12px;
  gap: 12px;

  .more {
    border: 1px solid var(--border-color);
    border-radius: 10px;
    cursor: pointer;
    min-height: 97px;
    &:hover {
      border-color: rgb(80 138 254);
    }
  }
}
</style>
