<template>
  <div class="placeholder" aria-hidden="true"></div>
</template>

<style scoped>
.placeholder {
  width: 100%;
  aspect-ratio: 16 / 7;
  border: 1px solid rgba(198, 171, 109, 0.3);
  background:
    radial-gradient(circle at 50% 50%, rgba(198, 171, 109, 0.12), transparent 47%),
    repeating-linear-gradient(
      90deg,
      rgba(198, 171, 109, 0.09) 0,
      rgba(198, 171, 109, 0.09) 1px,
      transparent 1px,
      transparent 52px
    ),
    linear-gradient(160deg, rgba(36, 39, 45, 0.92), rgba(21, 23, 27, 0.95));
}
</style>
