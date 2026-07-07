<template>
  <!-- Vista cenital del obstáculo, centrada en el origen. Unidades en metros. -->
  <g class="obstacle-glyph">
    <template v-if="type === 'valla'">
      <line
        x1="-0.65"
        y1="0"
        x2="0.65"
        y2="0"
        class="bar"
      />
      <rect
        x="-0.72"
        y="-0.07"
        width="0.14"
        height="0.14"
        class="post"
      />
      <rect
        x="0.58"
        y="-0.07"
        width="0.14"
        height="0.14"
        class="post"
      />
      <line
        x1="-0.72"
        y1="-0.3"
        x2="-0.72"
        y2="0.3"
        class="wing"
      />
      <line
        x1="0.72"
        y1="-0.3"
        x2="0.72"
        y2="0.3"
        class="wing"
      />
    </template>

    <template v-else-if="type === 'muro'">
      <rect
        x="-0.65"
        y="-0.14"
        width="1.3"
        height="0.28"
        class="solid"
      />
      <rect
        x="-0.72"
        y="-0.2"
        width="0.2"
        height="0.4"
        class="post"
      />
      <rect
        x="0.52"
        y="-0.2"
        width="0.2"
        height="0.4"
        class="post"
      />
    </template>

    <template v-else-if="type === 'neumatico'">
      <line
        x1="-0.7"
        y1="0"
        x2="0.7"
        y2="0"
        class="wing"
      />
      <circle
        cx="0"
        cy="0"
        r="0.3"
        class="tire"
      />
      <circle
        cx="0"
        cy="0"
        r="0.16"
        class="tire-hole"
      />
    </template>

    <template v-else-if="type === 'ria'">
      <rect
        v-for="n in riaElementCount"
        :key="n"
        x="-0.6"
        :y="riaElementY(n)"
        width="1.2"
        height="0.09"
        class="solid"
      />
      <circle
        v-for="(pole, i) in riaPoles"
        :key="`p${i}`"
        :cx="pole.x"
        :cy="pole.y"
        r="0.05"
        class="post-dot"
      />
    </template>

    <template v-else-if="type === 'tunel'">
      <rect
        x="-0.3"
        :y="-halfLen"
        width="0.6"
        :height="tunnelLength"
        rx="0.3"
        class="tunnel"
      />
      <line
        x1="-0.3"
        :y1="-halfLen + 0.25"
        x2="0.3"
        :y2="-halfLen + 0.25"
        class="tunnel-ring"
      />
      <line
        x1="-0.3"
        :y1="halfLen - 0.25"
        x2="0.3"
        :y2="halfLen - 0.25"
        class="tunnel-ring"
      />
    </template>

    <template v-else-if="type === 'slalom'">
      <line
        x1="0"
        y1="-3.3"
        x2="0"
        y2="3.3"
        class="wing"
      />
      <circle
        v-for="n in 12"
        :key="n"
        cx="0"
        :cy="-3.3 + (n - 1) * 0.6"
        r="0.07"
        class="pole"
      />
    </template>

    <template v-else-if="type === 'empalizada'">
      <rect
        x="-0.45"
        y="-1.9"
        width="0.9"
        height="3.8"
        class="ramp"
      />
      <rect
        x="-0.45"
        y="-1.9"
        width="0.9"
        height="0.95"
        class="contact"
      />
      <rect
        x="-0.45"
        y="0.95"
        width="0.9"
        height="0.95"
        class="contact"
      />
      <line
        x1="-0.45"
        y1="0"
        x2="0.45"
        y2="0"
        class="apex"
      />
    </template>

    <template v-else-if="type === 'pasarela'">
      <rect
        x="-0.175"
        y="-5.4"
        width="0.35"
        height="10.8"
        class="ramp"
      />
      <rect
        x="-0.175"
        y="-5.4"
        width="0.35"
        height="0.9"
        class="contact"
      />
      <rect
        x="-0.175"
        y="4.5"
        width="0.35"
        height="0.9"
        class="contact"
      />
      <line
        x1="-0.175"
        y1="-1.8"
        x2="0.175"
        y2="-1.8"
        class="apex"
      />
      <line
        x1="-0.175"
        y1="1.8"
        x2="0.175"
        y2="1.8"
        class="apex"
      />
    </template>

    <template v-else-if="type === 'balancin'">
      <rect
        x="-0.175"
        y="-1.85"
        width="0.35"
        height="3.7"
        class="ramp"
      />
      <rect
        x="-0.175"
        y="-1.85"
        width="0.35"
        height="0.9"
        class="contact"
      />
      <rect
        x="-0.175"
        y="0.95"
        width="0.35"
        height="0.9"
        class="contact"
      />
      <circle
        cx="0"
        cy="0"
        r="0.14"
        class="pivot"
      />
    </template>

    <template v-else-if="type === 'mesa'">
      <rect
        x="-0.45"
        y="-0.45"
        width="0.9"
        height="0.9"
        rx="0.08"
        class="table"
      />
      <text
        x="0"
        y="0.12"
        class="table-label"
      >
        5s
      </text>
    </template>
  </g>
</template>

<script setup>
import { computed } from 'vue'
import { SIZE_CATEGORIES } from '../../data/agilityRules'

const props = defineProps({
  type: { type: String, required: true },
  categoria: { type: String, default: 'L' },
  length: { type: Number, default: 4 },
})

const categoryData = computed(() => SIZE_CATEGORIES.find((c) => c.id === props.categoria) || SIZE_CATEGORIES[3])

const tunnelLength = computed(() => Math.min(6, Math.max(3, props.length)))
const halfLen = computed(() => tunnelLength.value / 2)

const riaElementCount = computed(() => categoryData.value.riaElementos)
const riaDepth = computed(() => categoryData.value.riaLongitud.max / 100)
const riaElementY = (n) => {
  const count = riaElementCount.value
  const depth = riaDepth.value
  return -depth / 2 + ((n - 1) / Math.max(1, count - 1)) * (depth - 0.09)
}
const riaPoles = computed(() => {
  const half = riaDepth.value / 2 + 0.15
  return [
    { x: -0.72, y: -half },
    { x: 0.72, y: -half },
    { x: -0.72, y: half },
    { x: 0.72, y: half },
  ]
})
</script>

<style scoped>
.obstacle-glyph line,
.obstacle-glyph rect,
.obstacle-glyph circle {
  vector-effect: non-scaling-stroke;
}

.bar { stroke: var(--periwinkle-700); stroke-width: 3px; stroke-linecap: round; }
.wing { stroke: var(--ink-300); stroke-width: 2px; stroke-linecap: round; }
.post { fill: var(--periwinkle-800); }
.post-dot { fill: var(--ink-500); }
.solid { fill: var(--periwinkle-300); stroke: var(--periwinkle-700); stroke-width: 1px; }
.tire { fill: none; stroke: var(--pop-magenta); stroke-width: 4px; }
.tire-hole { fill: var(--surface-page); stroke: var(--pop-magenta); stroke-width: 1px; }
.tunnel { fill: var(--pastel-sky); stroke: var(--periwinkle-600); stroke-width: 2px; }
.tunnel-ring { stroke: var(--periwinkle-600); stroke-width: 1.5px; stroke-dasharray: 3 2; }
.pole { fill: var(--pop-magenta); }
.ramp { fill: var(--pastel-mint); stroke: var(--success); stroke-width: 1.5px; }
.contact { fill: var(--pastel-butter); stroke: var(--warning); stroke-width: 1px; }
.apex { stroke: var(--success); stroke-width: 1.5px; }
.pivot { fill: var(--warning); stroke: var(--ink-700); stroke-width: 1px; }
.table { fill: var(--pastel-lilac); stroke: var(--periwinkle-700); stroke-width: 1.5px; }
.table-label { font-size: 0.32px; font-weight: 700; text-anchor: middle; fill: var(--periwinkle-800); }
</style>
