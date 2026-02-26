<template>
  <svg
    class="kyn-logo-plain"
    :class="[`is-${size}`, `is-${mode}`]"
    viewBox="0 0 900 240"
    role="img"
    aria-label="KYN"
    preserveAspectRatio="xMidYMid meet"
  >
    <text x="450" y="105" text-anchor="middle">KYN</text>
  </svg>
</template>

<script setup>
defineProps({
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
});
</script>

<style scoped>
.kyn-logo-plain {
  display: block;
  width: var(--kyn-logo-width, 26rem);
  height: auto;
}

.kyn-logo-plain text {
  fill: #f4f0e8;
  font-family: 'Neue Haas Grotesk KYN', 'Neue Haas Grotesk', sans-serif;
  font-size: 84px;
  font-weight: 300;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  dominant-baseline: hanging;
}

.kyn-logo-plain.is-dark text {
  fill: #101113;
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
