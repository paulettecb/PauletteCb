<template>
  <svg
    class="kyn-logo-plain"
    :class="[`is-${size}`, `is-${variant}`]"
    viewBox="0 0 360 120"
    role="img"
    aria-label="KYN"
    preserveAspectRatio="xMidYMid meet"
  >
    <text x="180" y="82" text-anchor="middle">KYN</text>
  </svg>
</template>

<script setup>
defineProps({
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
</script>

<style scoped>
.kyn-logo-plain {
  display: block;
  width: var(--kyn-logo-width, 18rem);
  height: auto;
}

.kyn-logo-plain text {
  fill: var(--kyn-wordmark-color, var(--ivory));
  font-family: Manrope, 'Helvetica Neue', Arial, sans-serif;
  font-size: 78px;
  font-weight: 300;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  dominant-baseline: alphabetic;
}

.kyn-logo-plain.is-light {
  --kyn-wordmark-color: var(--ivory);
}

.kyn-logo-plain.is-dark {
  --kyn-wordmark-color: var(--obsidian);
}

.kyn-logo-plain.is-sm {
  --kyn-logo-width: 11rem;
}

.kyn-logo-plain.is-md {
  --kyn-logo-width: 18rem;
}

.kyn-logo-plain.is-lg {
  --kyn-logo-width: 26rem;
}
</style>
