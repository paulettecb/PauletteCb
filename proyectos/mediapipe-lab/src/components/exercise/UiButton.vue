<template>
  <button
    type="button"
    class="ui-btn"
    :class="[`v-${variant}`, `s-${size}`, { block }]"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | ghost | pop
  size: { type: String, default: 'md' }, // sm | md | lg
  block: { type: Boolean, default: false },
})
</script>

<style scoped>
.ui-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  transition: background var(--dur-fast, 0.15s) ease, border-color 0.15s ease, filter 0.15s ease;
}
.ui-btn.block { width: 100%; }

.s-sm { padding: 9px 14px; font-size: 12.5px; }
.s-md { padding: 12px 18px; font-size: 14px; }
.s-lg { padding: 15px 22px; font-size: 15.5px; }

.v-primary { background: var(--periwinkle-600); color: #fff; }
.v-primary:hover { background: var(--periwinkle-700); }

.v-secondary { background: var(--paper); color: var(--ink-700); border-color: var(--ink-100); }
.v-secondary:hover { border-color: var(--periwinkle-300); }

.v-ghost { background: transparent; color: var(--periwinkle-700); }
.v-ghost:hover { background: var(--periwinkle-50); }

.v-pop { background: var(--pop-magenta); color: #fff; }
.v-pop:hover { filter: brightness(1.05); }
</style>
