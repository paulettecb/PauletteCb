<template>
  <div class="kyn-logo" :class="[`is-${size}`, `is-${variant}`]">
    <KynLogoPlain :size="size" :variant="variant" />
    <KynStroke v-if="showStroke" :size="size" :variant="variant" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import KynLogoPlain from './KynLogoPlain.vue';
import KynStroke from './KynStroke.vue';

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
  variant: {
    type: String,
    default: 'light',
    validator: (value) => ['light', 'dark'].includes(value),
  },
  withStroke: {
    type: Boolean,
    default: true,
  },
});

const showStroke = computed(() => props.withStroke && props.size !== 'sm');
</script>

<style scoped>
.kyn-logo {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(0.25rem, 1vw, 0.55rem);
}

.kyn-logo.is-sm {
  gap: 0;
}

.kyn-logo :deep(.kyn-logo-plain),
.kyn-logo :deep(.kyn-stroke) {
  max-width: 100%;
}
</style>
