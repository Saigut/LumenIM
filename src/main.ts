import '@/assets/css/define/theme.less'
import '@/assets/css/define/global.less'
import '@/assets/css/dropsize.less'
import { createApp, ref } from 'vue'
import router from './router'
import App from './App.vue'
import * as plugins from './plugins'

async function bootstrap() {
  const app = createApp(App)

  const localSeqId = ref(0)
  app.provide('localSeqId', localSeqId)

  app.config.globalProperties.$myUid = 0

  app.use(router)

  plugins.setPinia(app)
  plugins.setHljsVuePlugin(app)
  plugins.setupNaive(app)
  plugins.setMdEditor(app)
  plugins.setComponents(app)
  plugins.setupDirective(app)

  app.mount('#app')
}

bootstrap()
