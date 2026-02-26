<template>
  <svg
    class="kyn-stroke"
    :class="[`is-${size}`, `is-${variant}`]"
    viewBox="0 0 760 100"
    role="presentation"
    aria-hidden="true"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="var(--brass-1)" />
        <stop offset="25%" stop-color="var(--brass-2)" />
        <stop offset="50%" stop-color="var(--brass-3)" />
        <stop offset="75%" stop-color="var(--brass-2)" />
        <stop offset="100%" stop-color="var(--brass-1)" />
      </linearGradient>
    </defs>

    <path
      class="stroke-main"
      :stroke="`url(#${gradientId})`"
      d="M34 72 C 188 75, 338 56, 500 54 C 586 53, 650 57, 705 66"
    />
    <path class="stroke-tip" :stroke="`url(#${gradientId})`" d="M705 66 L742 62" />
  </svg>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue';

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
});

const uid = getCurrentInstance()?.uid ?? Math.floor(Math.random() * 100000);
const gradientId = computed(() => `kyn-brass-stroke-${uid}`);
</script>

<style scoped>
.kyn-stroke {
  display: block;
  width: var(--kyn-stroke-width, 18rem);
  height: auto;
}

.stroke-main,
.stroke-tip {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.stroke-main {
  stroke-width: 2;
}

.stroke-tip {
  stroke-width: 1.1;
  stroke-linecap: butt;
}

.kyn-stroke.is-sm {
  --kyn-stroke-width: 11rem;
}

.kyn-stroke.is-md {
  --kyn-stroke-width: 18rem;
}

.kyn-stroke.is-lg {
  --kyn-stroke-width: 26rem;
}

.kyn-stroke.is-dark {
  opacity: 0.92;
}
</style>
