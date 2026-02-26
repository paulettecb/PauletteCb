<template>
  <div class="placeholder" aria-hidden="true"></div>
</template>

<style scoped>
.placeholder {
  width: min(280px, 100%);
  aspect-ratio: 1 / 1;
  border: 1px solid rgba(198, 171, 109, 0.38);
  background:
    radial-gradient(circle at 30% 35%, rgba(198, 171, 109, 0.26), transparent 45%),
    linear-gradient(155deg, rgba(36, 39, 45, 0.95), rgba(22, 24, 29, 0.95));
}
</style>
