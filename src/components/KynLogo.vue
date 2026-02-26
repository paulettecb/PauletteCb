<template>
  <div class="kyn-logo" :class="[`is-${size}`, `is-${mode}`]">
    <KynLogoPlain :size="size" :mode="mode" />

    <svg
      v-if="showStroke"
      class="kyn-logo-stroke"
      viewBox="0 0 900 240"
      role="presentation"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#6C542B" />
          <stop offset="30%" stop-color="#B0893E" />
          <stop offset="50%" stop-color="#E3C57A" />
          <stop offset="70%" stop-color="#B0893E" />
          <stop offset="100%" stop-color="#6C542B" />
        </linearGradient>
      </defs>

      <path
        class="stroke-main"
        :stroke="`url(#${gradientId})`"
        d="M 120 145 C 310 154, 455 168, 585 158 C 705 149, 790 145, 850 149"
      />
      <path
        class="stroke-secondary"
        :stroke="`url(#${gradientId})`"
        d="M 128 149 C 320 158, 460 170, 585 162 C 705 154, 785 151, 836 154"
      />
    </svg>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue';
import KynLogoPlain from './KynLogoPlain.vue';

const props = defineProps({
  size: {
    type: String,
    default: 'lg',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
  mode: {
    type: String,
    default: 'light',
    validator: (value) => ['light', 'dark'].includes(value),
  },
  withStroke: {
    type: Boolean,
    default: true,
  },
});

const showStroke = computed(() => props.size !== 'sm' && props.withStroke);
const uid = getCurrentInstance()?.uid ?? Math.floor(Math.random() * 100000);
const gradientId = computed(() => `kyn-brass-${uid}`);
</script>

<style scoped>
.kyn-logo {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(0.2rem, 0.7vw, 0.45rem);
}

.kyn-logo-stroke {
  display: block;
  width: var(--kyn-stroke-width, 26rem);
  height: auto;
}

.stroke-main,
.stroke-secondary {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.stroke-main {
  stroke-width: 2.5;
}

.stroke-secondary {
  stroke-width: 1.2;
  opacity: 0.55;
}

.kyn-logo.is-sm {
  --kyn-stroke-width: 11rem;
}

.kyn-logo.is-md {
  --kyn-stroke-width: 18rem;
}

.kyn-logo.is-lg {
  --kyn-stroke-width: 26rem;
}
</style>
