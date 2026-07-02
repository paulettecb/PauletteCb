import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'

// Dynamic imports to prevent loading all at once
const Home = () => import('./pages/Home.vue')
const LSM = () => import('./pages/LSM.vue')
const Agility = () => import('./pages/Agility.vue')
const Exercise = () => import('./pages/Exercise.vue')
const Experiments = () => import('./pages/Experiments.vue')

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

console.log('✅ MediaPipe Lab initialized successfully')
