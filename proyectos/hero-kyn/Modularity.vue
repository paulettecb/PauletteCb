<template>
  <section class="modularity-page" aria-label="How modularity works page">
    <div class="page-shell">
      <div class="site-grid" aria-hidden="true"></div>
      <span class="vertical-brass-axis" aria-hidden="true"></span>

      <header class="brand-mark" aria-hidden="true">
        <img src="assets/kyn-logo.svg" class="kynLogo" alt="KYN" />
      </header>

      <section class="modularity-header">
        <div class="header-copy">
          <p class="overline">SYSTEM LOGIC</p>
          <h1>How modularity works.</h1>
          <p class="subhead">A system built from a core + interchangeable modules.</p>
        </div>

        <article class="diagram-card" aria-label="Modularity diagram">
          <p class="diagram-title">CORE</p>
          <div class="core-line" aria-hidden="true">
            <span class="attach-point">A</span>
            <span class="attach-point">B</span>
          </div>
          <div class="module-chip-row" aria-label="Example module chips">
            <span class="module-chip">HANDLE</span>
            <span class="module-chip">EXTENSION</span>
            <span class="module-chip">ANCHOR</span>
          </div>
        </article>
      </section>

      <section class="steps-section" aria-label="How modularity works in three steps">
        <article class="step-card">
          <p class="step-title">01 Core</p>
          <p class="step-copy">
            The core establishes a stable base for the system. It defines the shared geometry and
            keeps every connection point predictable.
          </p>
          <p class="step-tag">INTERFACE</p>
        </article>

        <article class="step-card">
          <p class="step-title">02 Modules</p>
          <p class="step-copy">
            Modules attach to the core through consistent join points. Each piece can be swapped
            without changing the system language.
          </p>
          <p class="step-tag">SWAP</p>
        </article>

        <article class="step-card">
          <p class="step-title">03 Configurations</p>
          <p class="step-copy">
            Different arrangements emerge by combining compatible modules. The result is flexible,
            while the structure remains coherent.
          </p>
          <p class="step-tag">LOCK</p>
        </article>
      </section>

      <section class="compatibility-section" aria-label="Compatibility rules">
        <h2>Compatibility rules</h2>
        <ul class="compatibility-grid">
          <li>Interfaces align by width</li>
          <li>Modules lock with a single fastener</li>
          <li>Swap points are standardized</li>
          <li>Connection paths remain centered</li>
          <li>Every module follows shared tolerances</li>
          <li>Orientation markers guide assembly</li>
        </ul>
      </section>

      <section class="cta-section" aria-label="Navigation actions">
        <a href="/proyectos/hero-kyn/" class="btn btn-primary">Explore the system</a>
        <button type="button" class="btn btn-secondary" data-back="true">Back</button>
      </section>
    </div>
  </section>
</template>

<script setup>
import '../../src/styles/kyn-tokens.css';
</script>

<style scoped>
@font-face {
  font-family: 'Neue Haas Grotesk KYN';
  src: url('/proyectos/hero-kyn/assets/fonts/neuehaasgrotdisp-45light-trial.otf') format('opentype');
  font-style: normal;
  font-weight: 300;
  font-display: swap;
}

@font-face {
  font-family: 'Neue Haas Grotesk KYN';
  src: url('/proyectos/hero-kyn/assets/fonts/neuehaasgrottext-55roman-trial.otf') format('opentype');
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: 'Neue Haas Grotesk KYN';
  src: url('/proyectos/hero-kyn/assets/fonts/neuehaasgrottext-65medium-trial.otf') format('opentype');
  font-style: normal;
  font-weight: 500;
  font-display: swap;
}

.modularity-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background:
    radial-gradient(circle at 12% 18%, rgba(255, 255, 255, 0.028), transparent 44%),
    linear-gradient(156deg, #121316 0%, var(--obsidian) 63%, #15171a 100%);
  color: rgba(244, 240, 232, 0.98);
  font-family: 'Neue Haas Grotesk KYN', 'Neue Haas Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  padding: clamp(1.2rem, 2.5vw, 2.8rem) clamp(1.2rem, 3vw, 3.2rem);
}

.page-shell {
  width: min(1440px, 100%);
  margin: 0 auto;
  position: relative;
  display: grid;
  gap: clamp(2.1rem, 5vw, 5rem);
}

.site-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.07;
  background-image: repeating-linear-gradient(
    90deg,
    transparent 0,
    transparent calc(25% - 1px),
    rgba(201, 197, 190, 0.2) calc(25% - 1px),
    rgba(201, 197, 190, 0.2) 25%
  );
}

.vertical-brass-axis {
  position: absolute;
  top: 8.3rem;
  bottom: 2rem;
  left: 66%;
  width: 1px;
  background: linear-gradient(180deg, transparent, var(--brass-2) 18%, var(--brass-1) 66%, transparent);
  opacity: 0.53;
  z-index: 1;
}

.brand-mark {
  margin: clamp(1rem, 2.8vw, 2rem) 0 0;
  min-height: clamp(6rem, 10vw, 8.2rem);
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-end;
}

.kynLogo {
  display: block;
  width: min(94vw, 38rem);
  max-width: 100%;
  height: auto;
}

.modularity-header {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(320px, 0.85fr);
  gap: clamp(1.2rem, 4vw, 4rem);
  align-items: stretch;
}

.overline {
  margin: 0 0 1.1rem;
  font-size: 0.77rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #c9c5be;
}

h1 {
  margin: 0;
  font-size: clamp(2.1rem, 4.8vw, 4rem);
  line-height: 1.2;
  font-weight: 300;
  letter-spacing: 0.03em;
  color: var(--ivory);
}

.subhead {
  margin: 1.2rem 0 0;
  max-width: 54ch;
  color: rgba(232, 226, 216, 0.85);
  font-size: clamp(1rem, 1.4vw, 1.14rem);
  line-height: 1.62;
}

.diagram-card,
.step-card,
.compatibility-section {
  border: 1px solid rgba(201, 197, 190, 0.28);
  background:
    linear-gradient(145deg, rgba(24, 25, 29, 0.9), rgba(17, 18, 20, 0.98)),
    repeating-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.012) 0,
      rgba(255, 255, 255, 0.012) 1px,
      transparent 1px,
      transparent 6px
    );
  backdrop-filter: blur(2px);
}

.diagram-card {
  padding: clamp(1.2rem, 2.5vw, 1.8rem);
  display: grid;
  gap: 1rem;
}

.diagram-title {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #c9c5be;
}

.core-line {
  min-height: 4rem;
  border: 1px solid rgba(201, 197, 190, 0.32);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.core-line::before {
  content: '';
  width: 78%;
  height: 1px;
  background: var(--kyn-brass-gradient);
}

.attach-point {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.64rem;
  letter-spacing: 0.18em;
  color: #e0d8ca;
}

.attach-point:first-of-type {
  left: 18%;
}

.attach-point:last-of-type {
  right: 18%;
}

.module-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.module-chip {
  padding: 0.42rem 0.64rem;
  border: 1px solid rgba(201, 197, 190, 0.32);
  font-size: 0.66rem;
  letter-spacing: 0.13em;
  color: #ded6c8;
}

.steps-section {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.95rem;
}

.step-card {
  padding: 1.15rem;
  display: grid;
  gap: 0.8rem;
}

.step-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 400;
  color: #f4f0e8;
}

.step-copy {
  margin: 0;
  color: rgba(232, 226, 216, 0.85);
  line-height: 1.58;
  font-size: 0.94rem;
}

.step-tag {
  margin: 0;
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  color: #b6afa2;
}

.compatibility-section {
  position: relative;
  z-index: 2;
  padding: clamp(1.2rem, 2vw, 1.6rem);
}

h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #d9d2c5;
}

.compatibility-grid {
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
}

.compatibility-grid li {
  padding: 0.72rem 0.76rem;
  border: 1px solid rgba(201, 197, 190, 0.24);
  color: #d8d0c2;
  font-size: 0.83rem;
  line-height: 1.44;
}

.cta-section {
  position: relative;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.btn {
  appearance: none;
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
  padding: 0.875rem 1.25rem;
  font-size: 0.82rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease;
}

.btn-primary {
  background: linear-gradient(120deg, rgba(34, 36, 40, 0.92), rgba(20, 21, 23, 0.98));
  border-color: rgba(201, 197, 190, 0.35);
  color: var(--ivory);
}

.btn-primary:hover {
  background: linear-gradient(120deg, rgba(244, 240, 232, 0.09), rgba(28, 30, 33, 0.95));
  border-color: var(--brass-2);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--brass-2) 30%, transparent);
  transform: translateY(-1px);
}

.btn-secondary {
  border-color: rgba(201, 197, 190, 0.35);
  color: #e8e2d8;
}

.btn-secondary:hover {
  background: rgba(232, 226, 216, 0.08);
  border-color: var(--brass-2);
}

.btn:focus-visible {
  outline: 2px solid var(--brass-3);
  outline-offset: 2px;
}

@media (max-width: 1024px) {
  .modularity-header {
    grid-template-columns: 1fr;
  }

  .vertical-brass-axis {
    left: auto;
    right: 1.5rem;
    top: 4.6rem;
  }

  .steps-section,
  .compatibility-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .modularity-page {
    padding: 1.1rem;
  }

  .cta-section {
    flex-direction: column;
    align-items: stretch;
  }

  .btn {
    width: 100%;
    text-align: center;
  }
}
</style>
