<template>
  <div class="app">
    <component :is="currentView" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Home from './pages/Home.vue'
import LSM from './pages/LSM.vue'
import Agility from './pages/Agility.vue'
import Exercise from './pages/Exercise.vue'
import Experiments from './pages/Experiments.vue'
import Whimsy from './pages/Whimsy.vue'

const routes = {
  '/': Home,
  '/lsm': LSM,
  '/agility': Agility,
  '/exercise': Exercise,
  '/experiments': Experiments,
  '/whimsy': Whimsy
}

const route = ref(window.location.hash.slice(1) || '/')

const syncRoute = () => {
  route.value = window.location.hash.slice(1) || '/'
}

const currentView = computed(() => routes[route.value] || Home)

onMounted(() => window.addEventListener('hashchange', syncRoute))
onBeforeUnmount(() => window.removeEventListener('hashchange', syncRoute))
</script>

<style>
.app {
  width: 100%;
  min-height: 100vh;
}
</style>
