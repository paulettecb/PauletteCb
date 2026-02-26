<template>
  <section class="material-intelligence" aria-label="Material intelligence page">
    <div class="page-shell">
      <div class="site-grid" aria-hidden="true"></div>
      <span class="vertical-brass-axis" aria-hidden="true"></span>

      <header class="brand-mark" aria-hidden="true">
        <img src="/proyectos/hero-kyn/assets/kyn-logo.svg" class="kynLogo" alt="KYN" />
      </header>

      <section class="hero" aria-labelledby="material-intelligence-title">
        <p class="overline">SYSTEM STUDY</p>
        <h1 id="material-intelligence-title">MATERIAL INTELLIGENCE</h1>
        <p class="subtitle">Materials aren’t decoration.<br />They are behavior under load.</p>
        <p class="lead-copy">
          KYN is engineered around contact, force, and repeatability. Every interface, edge radius,
          and material decision is selected for controllable response under real handling
          conditions.
        </p>
      </section>

      <section class="section-stack" aria-labelledby="material-stack-title">
        <div class="section-heading">
          <p class="section-index">SECTION 01</p>
          <h2 id="material-stack-title">THE MATERIAL STACK</h2>
        </div>

        <div class="material-row">
          <figure class="media-column">
            <MaterialMacroBiothane />
            <figcaption>Biothane® — Surface Integrity</figcaption>
          </figure>
          <article class="text-column">
            <h3>Biothane as the adaptive shell</h3>
            <p>
              The exterior layer must remain dimensionally stable while flexing through repeated
              cycles. Biothane provides weather resistance, low absorption, and predictable bend
              behavior without fiber fray or edge collapse.
            </p>
          </article>
        </div>

        <div class="material-row">
          <figure class="media-column">
            <MaterialMacroBrass />
            <figcaption>Solid Brass — Structural Density</figcaption>
          </figure>
          <article class="text-column">
            <h3>Brass as the structural anchor</h3>
            <p>
              Dense brass hardware protects the load path against deformation and distributes force
              through stable connection geometry. It delivers reliable mass, machining accuracy,
              and long-term wear behavior.
            </p>
          </article>
        </div>
      </section>

      <section class="section-mechanical" aria-labelledby="mechanical-truth-title">
        <div class="section-heading section-heading--center">
          <p class="section-index">SECTION 02</p>
          <h2 id="mechanical-truth-title">MECHANICAL TRUTH</h2>
        </div>

        <div class="diagram-wrap">
          <ExplodedConnectionDiagram />
          <p class="caption">Controlled load path.</p>
        </div>

        <p class="body-copy">
          Mechanical clarity is built by minimizing uncertain behavior at connection points.
          Components are arranged to keep force vectors centered, constrain unintended torsion, and
          maintain repeatable handling feedback as conditions change.
        </p>
      </section>

      <section class="section-rules" aria-labelledby="interface-rules-title">
        <div class="section-heading">
          <p class="section-index">SECTION 03</p>
          <h2 id="interface-rules-title">INTERFACE RULES</h2>
        </div>

        <div class="rules-grid" role="list" aria-label="Interface rules">
          <article class="rule-card" role="listitem" tabindex="0">
            <h3>Shared Width Standards</h3>
            <p>Unified dimensions maintain compatibility across modules and simplify replacement.</p>
          </article>
          <article class="rule-card" role="listitem" tabindex="0">
            <h3>Single Attachment Logic</h3>
            <p>Connections lock through one clear path to reduce setup ambiguity and error.</p>
          </article>
          <article class="rule-card" role="listitem" tabindex="0">
            <h3>Orientation Control</h3>
            <p>Guided orientation keeps hardware aligned and prevents rotational drift under load.</p>
          </article>
          <article class="rule-card" role="listitem" tabindex="0">
            <h3>Centered Connection Paths</h3>
            <p>Force transfer stays centered for balanced response and clean mechanical behavior.</p>
          </article>
        </div>
      </section>

      <section class="section-tolerances" aria-labelledby="tolerances-title">
        <div class="section-heading">
          <p class="section-index">SECTION 04</p>
          <h2 id="tolerances-title">TOLERANCES</h2>
        </div>
        <p>
          A modular system is only as stable as its dimensional discipline. Tolerances are tuned to
          preserve fit without seizure, allowing movement where needed while keeping critical
          interfaces constrained and secure.
        </p>
      </section>

      <section class="section-aging" aria-labelledby="aging-care-title">
        <div class="section-heading">
          <p class="section-index">SECTION 05</p>
          <h2 id="aging-care-title">AGING &amp; CARE</h2>
        </div>

        <div class="aging-grid">
          <article>
            <p>
              Material longevity depends on routine inspection, cleaning, and controlled storage.
              Biothane should be wiped and dried after high debris use; brass should be cleaned
              gently to maintain function while allowing natural patina over time.
            </p>
          </article>
          <figure class="aging-media">
            <BrassAgingMacro />
          </figure>
        </div>
      </section>

      <section class="divider-strip" aria-label="System rhythm">
        <span class="divider-line" aria-hidden="true"></span>
        <p>LOCK · ALIGN · EXTEND · ADAPT · RECONFIGURE</p>
        <span class="divider-line" aria-hidden="true"></span>
      </section>

      <footer class="final-cta" aria-label="Material intelligence actions">
        <h2>READY TO BUILD?</h2>
        <div class="cta-group">
          <a href="../modularity/" data-route="/modularity" class="btn btn-primary"
            >BUILD YOUR CONFIGURATION</a
          >
          <a href="../explore/" data-route="/explore" class="btn btn-secondary">VIEW SYSTEM LOGIC</a>
        </div>
      </footer>
    </div>
  </section>
</template>

<script setup>
import '../../src/styles/kyn-tokens.css';
import BrassAgingMacro from './components/placeholders/BrassAgingMacro.vue';
import ExplodedConnectionDiagram from './components/placeholders/ExplodedConnectionDiagram.vue';
import MaterialMacroBiothane from './components/placeholders/MaterialMacroBiothane.vue';
import MaterialMacroBrass from './components/placeholders/MaterialMacroBrass.vue';
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

.material-intelligence {
  min-height: 100vh;
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
  gap: clamp(3rem, 8vw, 8rem);
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
  top: 7rem;
  bottom: 2rem;
  left: 66%;
  width: 1px;
  opacity: 0.4;
  background: linear-gradient(180deg, transparent, var(--brass-2) 25%, var(--brass-1) 64%, transparent);
}

.brand-mark {
  margin: 0;
  min-height: clamp(8rem, 9vw, 12rem);
  display: flex;
  align-items: flex-end;
}

.kynLogo {
  display: block;
  width: min(62vw, 45rem);
  max-width: 100%;
  height: auto;
}

.hero {
  text-align: center;
  max-width: 72ch;
  margin: 0 auto;
  display: grid;
  gap: 1.4rem;
}

.overline,
.section-index {
  margin: 0;
  font-size: 0.76rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #bfb8ab;
}

h1,
h2,
h3,
p {
  margin: 0;
}

h1 {
  font-size: clamp(2.3rem, 5.8vw, 5rem);
  font-weight: 300;
  letter-spacing: 0.03em;
}

.subtitle {
  font-size: clamp(1.2rem, 2.2vw, 1.8rem);
  line-height: 1.45;
  color: rgba(244, 240, 232, 0.92);
}

.lead-copy,
.body-copy,
.text-column p,
.section-tolerances p,
.aging-grid p,
.rule-card p {
  color: rgba(229, 223, 214, 0.86);
  font-size: 1rem;
  line-height: 1.72;
}

.section-stack,
.section-rules,
.section-tolerances,
.section-aging,
.section-mechanical {
  display: grid;
  gap: clamp(1.6rem, 3.3vw, 2.8rem);
}

.section-heading {
  display: grid;
  gap: 0.7rem;
}

.section-heading--center {
  justify-items: center;
  text-align: center;
}

h2 {
  font-size: clamp(1.5rem, 2.7vw, 2.4rem);
  font-weight: 400;
  letter-spacing: 0.04em;
}

h3 {
  font-size: 1.12rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  color: var(--ivory);
  margin-bottom: 0.75rem;
}

.material-row,
.aging-grid {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(320px, 1fr);
  gap: clamp(1.5rem, 3vw, 3rem);
  align-items: start;
}

.media-column,
.aging-media {
  display: grid;
  gap: 0.9rem;
}

figcaption,
.caption {
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #a89f90;
}

.diagram-wrap {
  display: grid;
  gap: 0.9rem;
  max-width: 980px;
  margin: 0 auto;
  width: 100%;
}

.caption {
  text-align: center;
  opacity: 0.84;
}

.body-copy {
  max-width: 74ch;
  margin: 0 auto;
  text-align: center;
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(260px, 1fr));
  gap: 1rem;
}

.rule-card {
  border: 1px solid rgba(188, 163, 111, 0.22);
  background: rgba(18, 20, 23, 0.62);
  padding: 1.25rem;
  transition: border-color 180ms ease, box-shadow 180ms ease;
}

.rule-card:hover,
.rule-card:focus-visible {
  border-color: rgba(198, 171, 109, 0.72);
  box-shadow: 0 0 0 1px rgba(198, 171, 109, 0.22) inset;
  outline: none;
}

.divider-strip {
  display: grid;
  gap: 0.85rem;
  justify-items: center;
  text-align: center;
}

.divider-line {
  width: min(680px, 84%);
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--brass-2), transparent);
}

.divider-strip p {
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #c9c2b4;
}

.final-cta {
  background: linear-gradient(180deg, rgba(28, 31, 36, 0.9), rgba(20, 22, 26, 0.92));
  border: 1px solid rgba(198, 171, 109, 0.3);
  padding: clamp(1.6rem, 3vw, 2.8rem);
  display: grid;
  gap: 1rem;
  justify-items: center;
  text-align: center;
}

.cta-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
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
  transition: border-color 180ms ease, background-color 180ms ease, color 180ms ease;
}

.btn:focus-visible {
  outline: 2px solid rgba(198, 171, 109, 0.72);
  outline-offset: 2px;
}

.btn-primary {
  border-color: rgba(198, 171, 109, 0.45);
  background: linear-gradient(120deg, rgba(198, 171, 109, 0.14), rgba(198, 171, 109, 0.05));
}

.btn-secondary {
  border-color: rgba(233, 227, 217, 0.33);
  color: rgba(233, 227, 217, 0.95);
}

@media (max-width: 900px) {
  .material-row,
  .aging-grid,
  .rules-grid {
    grid-template-columns: 1fr;
  }

  .vertical-brass-axis {
    left: 84%;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
