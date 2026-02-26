<template>
  <section class="explore-system" aria-label="Explore the system page">
    <div class="page-shell">
      <div class="site-grid" aria-hidden="true"></div>
      <span class="vertical-brass-axis" aria-hidden="true"></span>

      <header class="brand-mark" aria-hidden="true">
        <img src="/proyectos/hero-kyn/assets/kyn-logo.svg" class="kynLogo" alt="KYN" />
      </header>

      <section class="intro-section" aria-labelledby="system-overview-title">
        <div class="intro-copy">
          <p class="overline">SYSTEM OVERVIEW</p>
          <h1 id="system-overview-title">Explore the system.</h1>
          <p class="subhead">A modular framework built around a configurable core.</p>
        </div>

        <article class="architectural-panel" aria-label="Architectural system schematic">
          <div class="schematic-row">
            <span
              class="schematic-block"
              :class="schematicStateClass('core')"
              tabindex="0"
              @mouseenter="setActiveSection('core')"
              @focus="setActiveSection('core')"
              @mouseleave="clearActiveSection"
              @blur="clearActiveSection"
            >
              CORE
            </span>
            <span class="schematic-link"></span>
            <span
              class="schematic-block"
              :class="schematicStateClass('modules')"
              tabindex="0"
              @mouseenter="setActiveSection('modules')"
              @focus="setActiveSection('modules')"
              @mouseleave="clearActiveSection"
              @blur="clearActiveSection"
            >
              MODULE
            </span>
            <span class="schematic-link"></span>
            <span
              class="schematic-block"
              :class="schematicStateClass('configurations')"
              tabindex="0"
              @mouseenter="setActiveSection('configurations')"
              @focus="setActiveSection('configurations')"
              @mouseleave="clearActiveSection"
              @blur="clearActiveSection"
            >
              EXTENSION
            </span>
          </div>
        </article>
      </section>

      <section class="system-blocks" aria-label="System components overview">
        <article
          class="system-card"
          :class="cardStateClass('core')"
          tabindex="0"
          @mouseenter="setActiveSection('core')"
          @focus="setActiveSection('core')"
          @mouseleave="clearActiveSection"
          @blur="clearActiveSection"
        >
          <p class="card-title">The Core</p>
          <p class="card-copy">
            The foundation of the system. It establishes shared geometry, attachment logic, and
            stable behavior across every compatible element.
          </p>
          <p class="card-tag">BASE INTERFACE</p>
        </article>

        <article
          class="system-card"
          :class="cardStateClass('modules')"
          tabindex="0"
          @mouseenter="setActiveSection('modules')"
          @focus="setActiveSection('modules')"
          @mouseleave="clearActiveSection"
          @blur="clearActiveSection"
        >
          <p class="card-title">Modules</p>
          <p class="card-copy">
            Interchangeable components that connect through consistent interfaces, allowing parts
            to be attached or swapped without disrupting the framework.
          </p>
          <p class="card-tag">ATTACH / SWAP</p>
        </article>

        <article
          class="system-card"
          :class="cardStateClass('configurations')"
          tabindex="0"
          @mouseenter="setActiveSection('configurations')"
          @focus="setActiveSection('configurations')"
          @mouseleave="clearActiveSection"
          @blur="clearActiveSection"
        >
          <p class="card-title">Configurations</p>
          <p class="card-copy">
            Adaptable setups created by combining compatible elements, enabling structural variety
            while preserving a coherent system language.
          </p>
          <p class="card-tag">RECONFIGURE</p>
        </article>
      </section>

      <section class="rhythm-strip" aria-label="System rhythm labels">
        <p>LOCK · ALIGN · EXTEND · ADAPT · RECONFIGURE · LOCK</p>
      </section>

      <footer class="cta-footer" aria-label="Explore system actions">
        <a href="../modularity/" data-route="/modularity" class="btn btn-primary">View modular logic</a>
        <a href="../" data-route="/" class="btn btn-secondary">Back to home</a>
      </footer>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import '../../src/styles/kyn-tokens.css';

const activeSection = ref(null);

const setActiveSection = (section) => {
  activeSection.value = section;
};

const clearActiveSection = () => {
  activeSection.value = null;
};

const cardStateClass = (section) => ({
  'is-active': activeSection.value === section,
  'is-inactive': activeSection.value !== null && activeSection.value !== section,
});

const schematicStateClass = (section) => ({
  'is-active': activeSection.value === section,
  'is-inactive': activeSection.value !== null && activeSection.value !== section,
});
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

.explore-system {
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
  gap: clamp(2.3rem, 5vw, 5.4rem);
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

.intro-section {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(320px, 0.85fr);
  gap: clamp(1.4rem, 4vw, 4rem);
  align-items: center;
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

.architectural-panel,
.system-card,
.rhythm-strip {
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

.architectural-panel {
  min-height: clamp(11rem, 24vw, 14.6rem);
  display: grid;
  place-items: center;
  padding: clamp(1.1rem, 2.1vw, 1.8rem);
}

.schematic-row {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  gap: clamp(0.45rem, 1vw, 0.8rem);
  align-items: center;
}

.schematic-block {
  position: relative;
  border: 1px solid rgba(201, 197, 190, 0.34);
  background: rgba(16, 17, 19, 0.72);
  min-height: clamp(3.2rem, 6vw, 4.1rem);
  display: grid;
  place-items: center;
  font-size: clamp(0.65rem, 0.85vw, 0.76rem);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(232, 226, 216, 0.88);
  transition: border-color 220ms ease, box-shadow 220ms ease, opacity 220ms ease;
}

.schematic-block::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  width: 0;
  margin: 0 auto;
  background: #b89b5e;
  transition: width 200ms ease;
}

.schematic-block.is-active {
  border-color: rgba(212, 183, 121, 0.78);
  box-shadow: 0 0 0 1px rgba(184, 155, 94, 0.2), inset 0 0 0 1px rgba(184, 155, 94, 0.14);
}

.schematic-block.is-active::after {
  width: 100%;
}

.schematic-block.is-inactive {
  opacity: 0.72;
}

.schematic-link {
  height: 1px;
  min-width: clamp(1.2rem, 2.4vw, 2.2rem);
  background: var(--kyn-brass-gradient);
}

.system-blocks {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.system-card {
  padding: 1.2rem 1.12rem 1.08rem;
  display: grid;
  gap: 0.85rem;
  transition: transform 220ms ease, border-color 220ms ease, filter 220ms ease, box-shadow 220ms ease,
    opacity 220ms ease;
}

.system-card::before {
  content: '';
  display: block;
  width: 100%;
  height: 1px;
  background: var(--kyn-brass-gradient);
  margin-bottom: 0.22rem;
}

.system-card:hover,
.system-card:focus-within {
  transform: translateY(-3px);
  border-color: rgba(201, 197, 190, 0.42);
}

.system-card.is-active {
  filter: brightness(1.04);
  border-color: rgba(212, 183, 121, 0.62);
  box-shadow: inset 0 0 0 1px rgba(184, 155, 94, 0.16);
}

.system-card.is-inactive {
  opacity: 0.72;
}

.card-title {
  margin: 0;
  font-size: clamp(1.08rem, 1.5vw, 1.3rem);
  letter-spacing: 0.02em;
  font-weight: 400;
}

.card-copy {
  margin: 0;
  color: rgba(226, 220, 209, 0.84);
  line-height: 1.55;
  font-size: 0.95rem;
}

.card-tag {
  margin: 0.2rem 0 0;
  font-size: 0.68rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #c4b9a3;
  font-weight: 500;
}

.rhythm-strip {
  position: relative;
  z-index: 2;
  padding: 0.68rem 1rem;
  overflow: hidden;
}

.rhythm-strip p {
  margin: 0;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.25em;
  font-size: 0.66rem;
  color: rgba(219, 212, 200, 0.26);
}

.cta-footer {
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
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease,
    transform 160ms ease;
}

.btn:focus-visible {
  outline: 2px solid rgba(227, 197, 122, 0.8);
  outline-offset: 2px;
}

.btn-primary {
  border-color: rgba(201, 197, 190, 0.4);
  background: linear-gradient(120deg, rgba(32, 33, 38, 0.92), rgba(24, 25, 29, 0.98));
}

.btn-primary:hover,
.btn-primary:focus-visible {
  border-color: rgba(227, 197, 122, 0.75);
  color: #f7f2e7;
  transform: translateY(-1px);
}

.btn-secondary {
  border-color: rgba(201, 197, 190, 0.32);
  color: #d6cec1;
}

.btn-secondary:hover,
.btn-secondary:focus-visible {
  border-color: rgba(201, 197, 190, 0.55);
  color: #f4f0e8;
  transform: translateY(-1px);
}

@media (max-width: 980px) {
  .intro-section {
    grid-template-columns: 1fr;
  }

  .vertical-brass-axis {
    left: auto;
    right: 7%;
  }

  .system-blocks {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .schematic-block,
  .schematic-block::after,
  .system-card,
  .btn {
    transition: none;
  }
}
</style>
