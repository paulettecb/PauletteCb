<template>
  <section class="hero-kyn" aria-label="KYN modular canine systems hero">
    <div class="hero-shell">
      <div class="site-grid" aria-hidden="true"></div>
      <span class="vertical-brass-axis" aria-hidden="true"></span>

      <header class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 1080 220" role="img" focusable="false">
          <title>KYN</title>
          <defs>
            <linearGradient id="brassGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#5f5030" />
              <stop offset="16%" stop-color="#8a7242" />
              <stop offset="34%" stop-color="#e2c98d" />
              <stop offset="52%" stop-color="#6f5b34" />
              <stop offset="74%" stop-color="#ddc286" />
              <stop offset="100%" stop-color="#675533" />
            </linearGradient>
          </defs>

          <text x="94" y="132" class="wordmark-letter">K</text>
          <text x="470" y="132" class="wordmark-letter">Y</text>
          <text x="835" y="132" class="wordmark-letter">N</text>

          <path class="brass-signature" d="M100 168 C 272 158, 444 176, 615 161 S 862 158, 980 159" />
          <path class="signature-tip" d="M980 159 L1018 157.4" />
        </svg>
      </header>

      <div class="hero-grid">
        <div class="hero-content">
          <p class="overline">MODULAR CANINE SYSTEMS</p>
          <h1>Quiet strength. Modular control.</h1>
          <p class="subhead">
            Biothane + solid brass. Adjustable configurations for urban walks and active dogs.
          </p>

          <ul class="spec-list">
            <li>Adjustable length, hands-free compatible</li>
            <li>Solid brass hardware, built to last</li>
            <li>Minimal aesthetic, maximum utility</li>
          </ul>

          <p class="system-tag">SYSTEM 01</p>
          <div class="cta-group">
            <button type="button" class="btn btn-primary">Explore the System</button>
            <button type="button" class="btn btn-secondary">How Modularity Works</button>
          </div>

          <aside class="micro-spec" aria-label="Product quick specs">
            <p class="micro-title">Specs</p>
            <dl>
              <div>
                <dt>MATERIAL</dt>
                <dd>BIOTHANE + BRASS</dd>
              </div>
              <div>
                <dt>SYSTEM</dt>
                <dd>MODULAR / ADJUSTABLE</dd>
              </div>
              <div>
                <dt>ENVIRONMENT</dt>
                <dd>URBAN + TRAIL</dd>
              </div>
            </dl>
          </aside>
        </div>

        <div class="spec-display-wrap" aria-hidden="true">
          <div class="spec-display">
            <span class="display-brass-divider"></span>
            <span class="display-tick tick-tl"></span>
            <span class="display-tick tick-tr"></span>
            <span class="display-tick tick-bl"></span>
            <span class="display-tick tick-br"></span>
            <span class="measure-label top">12.8 in</span>
            <span class="measure-label side">AXIS / 01</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// Static presentation component.
</script>

<style scoped>
@font-face {
  font-family: 'Neue Haas Grotesk KYN';
  src: url('/proyectos/hero-kyn/assets/fonts/neuehaasgrottext-45light-trial.otf') format('opentype');
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

.hero-kyn {
  --obsidian: #101113;
  --ivory: #f4f0e8;
  --graphite: #2b2d31;
  --stone: #c9c5be;
  --bone: #e8e2d8;

  --brass-dark: #5f5030;
  --brass-mid: #967d4c;
  --brass-light: #d0b678;
  --brass-oxide: #74613a;

  min-height: 90vh;
  display: flex;
  align-items: center;
  background:
    radial-gradient(circle at 12% 18%, rgba(255, 255, 255, 0.028), transparent 44%),
    linear-gradient(156deg, #121316 0%, #101114 63%, #15171a 100%);
  color: rgba(244, 240, 232, 0.98);
  font-family: 'Neue Haas Grotesk KYN', 'Neue Haas Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  padding: clamp(1.4rem, 3vw, 3rem);
}

.hero-shell {
  width: min(1240px, 100%);
  margin: 0 auto;
  position: relative;
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
  top: 5.4rem;
  bottom: 2rem;
  left: 64%;
  width: 1px;
  background:
    linear-gradient(
      180deg,
      rgba(95, 80, 48, 0),
      rgba(199, 173, 114, 0.6) 20%,
      rgba(116, 97, 58, 0.52) 66%,
      rgba(95, 80, 48, 0)
    ),
    linear-gradient(90deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
  z-index: 1;
}

.brand-mark {
  margin-bottom: clamp(1.25rem, 2.4vw, 2.25rem);
  position: relative;
  z-index: 2;
}

.brand-mark svg {
  width: 100%;
  max-width: 920px;
  height: auto;
  overflow: visible;
}

.wordmark-letter {
  fill: var(--ivory);
  font-size: 8rem;
  font-weight: 300;
  letter-spacing: 0.14em;
}

.brass-signature,
.signature-tip {
  fill: none;
  stroke: url(#brassGradient);
  stroke-linecap: round;
  stroke-linejoin: round;
}

.brass-signature {
  stroke-width: 2.28;
  stroke-dasharray: 940;
  stroke-dashoffset: 0;
  animation: brass-glide 6.2s ease-in-out infinite alternate;
}

.signature-tip {
  stroke-width: 1.2;
  stroke-linecap: butt;
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(320px, 0.84fr);
  gap: clamp(2rem, 5vw, 5.2rem);
  align-items: start;
  position: relative;
  z-index: 2;
}

.hero-content {
  max-width: 640px;
}

.overline {
  font-size: 0.77rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--stone);
  margin: 0 0 1.1rem;
}

h1 {
  margin: 0;
  font-size: clamp(2.1rem, 4.9vw, 4.25rem);
  line-height: 1.2;
  font-weight: 300;
  letter-spacing: 0.03em;
  color: var(--ivory);
  max-width: 18ch;
}

.subhead {
  margin: 1.5rem 0 0;
  max-width: 56ch;
  color: rgba(232, 226, 216, 0.85);
  font-size: clamp(1rem, 1.4vw, 1.18rem);
  line-height: 1.62;
  font-weight: 400;
}

.spec-list {
  margin: 1.65rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.7rem;
}

.spec-list li {
  color: var(--stone);
  font-size: 0.96rem;
  line-height: 1.45;
  padding-left: 1.2rem;
  position: relative;
}

.spec-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.58rem;
  width: 0.48rem;
  height: 1px;
  background:
    linear-gradient(90deg, rgba(95, 80, 48, 0.5), rgba(208, 182, 120, 0.9), rgba(95, 80, 48, 0.5));
}

.system-tag {
  margin: 1.875rem 0 0.625rem;
  font-weight: 500;
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #b6afa2;
}

.cta-group {
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
  cursor: pointer;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease,
    transform 160ms ease;
}

.btn-primary {
  background: linear-gradient(120deg, rgba(34, 36, 40, 0.92), rgba(20, 21, 23, 0.98));
  border-color: rgba(201, 197, 190, 0.35);
  color: var(--ivory);
}

.btn-primary:hover {
  background: linear-gradient(120deg, rgba(244, 240, 232, 0.09), rgba(28, 30, 33, 0.95));
  border-color: rgba(208, 182, 120, 0.78);
  box-shadow: 0 0 0 1px rgba(208, 182, 120, 0.16);
  transform: translateY(-1px);
}

.btn-secondary {
  border-color: rgba(201, 197, 190, 0.35);
  color: var(--bone);
}

.btn-secondary:hover {
  background: rgba(232, 226, 216, 0.08);
  border-color: rgba(208, 182, 120, 0.8);
}

.btn:focus-visible {
  outline: 2px solid #d0b678;
  outline-offset: 2px;
}

.micro-spec {
  margin-top: 1.35rem;
  padding: 1rem 1.05rem;
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
  max-width: 470px;
}

.micro-title {
  margin: 0 0 0.78rem;
  font-weight: 500;
  color: var(--stone);
  font-size: 0.71rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

dl {
  margin: 0;
  display: grid;
  gap: 0.52rem;
}

dl div {
  display: grid;
  grid-template-columns: max-content 1fr max-content;
  align-items: center;
  gap: 0.6rem;
}

dl div::before {
  content: '';
  order: 2;
  border-bottom: 1px dotted rgba(201, 197, 190, 0.3);
  transform: translateY(1px);
}

dt,
dd {
  margin: 0;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

dt {
  color: #afa99f;
  order: 1;
}

dd {
  color: rgba(244, 240, 232, 0.99);
  order: 3;
}

.spec-display-wrap {
  min-height: min(62vh, 560px);
  display: flex;
  align-items: stretch;
}

.spec-display {
  position: relative;
  width: 100%;
  border: 1px solid rgba(201, 197, 190, 0.3);
  background:
    linear-gradient(170deg, rgba(33, 35, 39, 0.95), rgba(15, 16, 18, 0.97) 72%),
    radial-gradient(circle at 52% 28%, rgba(247, 243, 236, 0.06), transparent 66%);
  overflow: hidden;
}

.spec-display::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    0deg,
    rgba(255, 255, 255, 0.012) 0,
    rgba(255, 255, 255, 0.012) 1px,
    transparent 1px,
    transparent 5px
  );
}

.display-brass-divider {
  position: absolute;
  top: 13%;
  left: 10%;
  right: 10%;
  height: 1px;
  background:
    linear-gradient(90deg, rgba(95, 80, 48, 0.15), rgba(208, 182, 120, 0.94), rgba(95, 80, 48, 0.15));
}

.display-tick {
  position: absolute;
  width: 16px;
  height: 16px;
  border-color: rgba(201, 197, 190, 0.56);
}

.tick-tl {
  top: 12px;
  left: 12px;
  border-top: 1px solid;
  border-left: 1px solid;
}

.tick-tr {
  top: 12px;
  right: 12px;
  border-top: 1px solid;
  border-right: 1px solid;
}

.tick-bl {
  bottom: 12px;
  left: 12px;
  border-bottom: 1px solid;
  border-left: 1px solid;
}

.tick-br {
  bottom: 12px;
  right: 12px;
  border-bottom: 1px solid;
  border-right: 1px solid;
}

.measure-label {
  position: absolute;
  font-size: 0.63rem;
  letter-spacing: 0.14em;
  color: #a9a293;
  text-transform: uppercase;
}

.measure-label.top {
  top: 5.9%;
  right: 10%;
}

.measure-label.side {
  right: 2.1%;
  top: 50%;
  transform: rotate(90deg) translateX(-50%);
  transform-origin: right top;
}

@keyframes brass-glide {
  0% {
    stroke-dashoffset: 0;
    opacity: 0.95;
  }

  100% {
    stroke-dashoffset: -26;
    opacity: 1;
  }
}

@media (max-width: 1024px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 1.8rem;
  }

  .vertical-brass-axis {
    left: auto;
    right: 1.5rem;
    top: 4.6rem;
  }

  .spec-display-wrap {
    min-height: 42vh;
  }

  .wordmark-letter {
    font-size: 6.2rem;
  }
}

@media (max-width: 680px) {
  .hero-kyn {
    padding: 1.1rem;
  }

  .wordmark-letter {
    font-size: 4.8rem;
  }

  .cta-group {
    flex-direction: column;
    align-items: stretch;
  }

  .btn {
    width: 100%;
    text-align: center;
  }

  dl div {
    grid-template-columns: 1fr;
    gap: 0.25rem;
  }

  dl div::before {
    display: none;
  }

  .measure-label.side {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
</style>
