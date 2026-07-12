<template>
  <span
    class="ui-badge"
    :class="`t-${tone}`"
  >
    <slot />
  </span>
</template>

<script setup>
defineProps({
  tone: { type: String, default: 'brand' }, // brand | soft | mint
})
</script>

<style scoped>
.ui-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1;
}
.t-brand { background: var(--periwinkle-50); color: var(--periwinkle-700); }
.t-soft { background: var(--oat); color: var(--ink-700); }
.t-mint { background: var(--pastel-mint); color: var(--ink-700); }
</style>
