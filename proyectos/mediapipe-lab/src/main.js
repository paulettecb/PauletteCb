import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import Home from './pages/Home.vue'
import LSM from './pages/LSM.vue'
import Agility from './pages/Agility.vue'
import Exercise from './pages/Exercise.vue'
import Experiments from './pages/Experiments.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/lsm', component: LSM },
  { path: '/agility', component: Agility },
  { path: '/exercise', component: Exercise },
  { path: '/experiments', component: Experiments }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')
