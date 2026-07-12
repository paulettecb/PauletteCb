<template>
  <span
    class="pose-glyph"
    v-html="svg"
  />
</template>

<script setup>
import { computed } from 'vue'
import { glyphFor } from '../../data/poseGlyphs'

const props = defineProps({
  pose: { type: String, default: 'squat' },
})

const svg = computed(() => glyphFor(props.pose))
</script>

<style scoped>
.pose-glyph {
  display: block;
  width: 100%;
  height: 100%;
  color: var(--ink-900);
}
.pose-glyph :deep(svg) { display: block; }
</style>
