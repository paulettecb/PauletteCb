<template>
  <section class="designer">
    <div class="designer-toolbar">
      <label class="control">
        <span>Categoría</span>
        <select v-model="categoria">
          <option
            v-for="cat in SIZE_CATEGORIES"
            :key="cat.id"
            :value="cat.id"
          >
            {{ cat.id }} · {{ cat.nombre }}
          </option>
        </select>
      </label>
      <label class="control">
        <span>Grado</span>
        <select v-model.number="grado">
          <option
            v-for="(g, id) in GRADOS"
            :key="id"
            :value="Number(id)"
          >{{ g.nombre }}</option>
        </select>
      </label>
      <label class="control">
        <span>Modalidad</span>
        <select v-model="modalidad">
          <option value="agility">Agility (con contactos)</option>
          <option value="jumping">Jumping (sin contactos)</option>
        </select>
      </label>
      <label class="control">
        <span>Velocidad (m/s)</span>
        <input
          v-model.number="velocidad"
          type="number"
          min="1"
          max="6"
          step="0.1"
        >
      </label>
      <label class="control checkbox">
        <input
          v-model="showPath"
          type="checkbox"
        >
        <span>Trayectoria</span>
      </label>
      <label class="control checkbox">
        <input
          v-model="showDistances"
          type="checkbox"
        >
        <span>Distancias</span>
      </label>
    </div>

    <div class="designer-layout">
      <aside class="palette">
        <h3>Obstáculos</h3>
        <button
          v-for="tipo in OBSTACLE_TYPES"
          :key="tipo.id"
          class="palette-item"
          type="button"
          :title="tipo.nombre"
          @click="addObstacle(tipo.id)"
        >
          <span class="palette-icon">{{ tipo.icono }}</span>
          <span>{{ tipo.nombre }}</span>
        </button>
        <button
          class="btn btn-primary palette-example"
          type="button"
          @click="loadExample"
        >
          🐾 Pista de ejemplo
        </button>
        <button
          class="btn palette-clear"
          type="button"
          @click="clearCourse"
        >
          🗑️ Vaciar pista
        </button>
      </aside>

      <div class="field-wrap">
        <svg
          ref="svgRef"
          class="field"
          viewBox="-1 -1 42 22"
          @pointerdown="onFieldPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <rect
            x="0"
            y="0"
            width="40"
            height="20"
            class="grass"
          />
          <g class="grid">
            <line
              v-for="gx in 19"
              :key="`vx${gx}`"
              :x1="gx * 2"
              y1="0"
              :x2="gx * 2"
              y2="20"
              :class="{ major: (gx * 2) % 10 === 0 }"
            />
            <line
              v-for="gy in 9"
              :key="`hy${gy}`"
              x1="0"
              :y1="gy * 2"
              x2="40"
              :y2="gy * 2"
              :class="{ major: (gy * 2) % 10 === 0 }"
            />
          </g>
          <rect
            x="0"
            y="0"
            width="40"
            height="20"
            class="fence"
          />
          <text
            x="0"
            y="-0.35"
            class="field-label"
          >40 × 20 m</text>

          <g
            v-if="showPath && pathSegments.length"
            class="path-layer"
          >
            <defs>
              <marker
                id="course-arrow"
                viewBox="0 0 6 6"
                refX="5"
                refY="3"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path
                  d="M 0 0 L 6 3 L 0 6 z"
                  class="arrow-head"
                />
              </marker>
            </defs>
            <line
              v-for="(seg, i) in pathSegments"
              :key="`seg${i}`"
              :x1="seg.a.x"
              :y1="seg.a.y"
              :x2="seg.b.x"
              :y2="seg.b.y"
              class="path-line"
              marker-end="url(#course-arrow)"
            />
            <text
              v-for="(seg, i) in pathSegments"
              v-show="showDistances"
              :key="`dist${i}`"
              :x="(seg.a.x + seg.b.x) / 2"
              :y="(seg.a.y + seg.b.y) / 2 - 0.25"
              class="distance-label"
            >{{ seg.dist.toFixed(1) }} m</text>
          </g>

          <g
            v-for="(item, index) in items"
            :key="item.id"
            class="obstacle"
            :class="{ selected: item.id === selectedId }"
            @pointerdown.stop="onObstaclePointerDown($event, item)"
          >
            <g :transform="`translate(${item.x}, ${item.y}) rotate(${item.rot})`">
              <rect
                :x="-hitBox(item).w / 2"
                :y="-hitBox(item).h / 2"
                :width="hitBox(item).w"
                :height="hitBox(item).h"
                rx="0.2"
                class="hit-area"
              />
              <ObstacleGlyph
                :type="item.type"
                :categoria="categoria"
                :length="item.len || 4"
              />
            </g>
            <g
              :transform="`translate(${numberPos(item).x}, ${numberPos(item).y})`"
              class="seq-badge"
            >
              <circle r="0.55" />
              <text y="0.2">{{ index + 1 }}</text>
            </g>
          </g>
        </svg>

        <div class="stats-bar">
          <div class="stat">
            <span class="stat-label">Obstáculos</span><strong>{{ items.length }}</strong>
          </div>
          <div class="stat">
            <span class="stat-label">Saltos</span><strong>{{ jumpCount }}</strong>
          </div>
          <div class="stat">
            <span class="stat-label">Contactos</span><strong>{{ contactCount }}</strong>
          </div>
          <div class="stat">
            <span class="stat-label">Longitud</span><strong>{{ geometry.length.toFixed(0) }} m</strong>
          </div>
          <div class="stat">
            <span class="stat-label">TRS</span><strong>{{ times.trs.toFixed(0) }} s</strong>
          </div>
          <div class="stat">
            <span class="stat-label">TRM</span><strong>{{ times.trm.toFixed(0) }} s</strong>
          </div>
        </div>
      </div>

      <aside class="side-panel">
        <div
          v-if="selected"
          class="panel-card"
        >
          <h3>{{ selectedType.icono }} {{ selectedType.nombre }} · #{{ selectedIndex + 1 }}</h3>
          <label class="control">
            <span>Rotación: {{ selected.rot }}°</span>
            <input
              v-model.number="selected.rot"
              type="range"
              min="0"
              max="355"
              step="5"
            >
          </label>
          <label
            v-if="selected.type === 'tunel'"
            class="control"
          >
            <span>Longitud del túnel: {{ (selected.len || 4).toFixed(1) }} m</span>
            <input
              v-model.number="selected.len"
              type="range"
              min="3"
              max="6"
              step="0.5"
            >
          </label>
          <div class="panel-actions">
            <button
              class="btn mini"
              type="button"
              :disabled="selectedIndex === 0"
              @click="moveInSequence(-1)"
            >
              ↑ Antes
            </button>
            <button
              class="btn mini"
              type="button"
              :disabled="selectedIndex === items.length - 1"
              @click="moveInSequence(1)"
            >
              ↓ Después
            </button>
            <button
              class="btn mini"
              type="button"
              @click="duplicateSelected"
            >
              ⧉ Duplicar
            </button>
            <button
              class="btn mini danger"
              type="button"
              @click="removeSelected"
            >
              ✕ Eliminar
            </button>
          </div>
          <ul class="specs-list">
            <li
              v-for="(spec, i) in selectedType.specs"
              :key="i"
            >
              {{ spec }}
            </li>
          </ul>
        </div>
        <div
          v-else
          class="panel-card muted"
        >
          <h3>Sin selección</h3>
          <p>Agrega un obstáculo desde la paleta y arrástralo sobre la pista. Tócalo para rotarlo, duplicarlo o cambiar su lugar en la secuencia.</p>
        </div>

        <div class="panel-card">
          <h3>Reglamento</h3>
          <ul class="validation-list">
            <li
              v-for="(finding, i) in validations"
              :key="i"
              :class="finding.nivel"
            >
              <span class="validation-dot" />{{ finding.texto }}
            </li>
            <li
              v-if="!validations.length"
              class="aviso"
            >
              <span class="validation-dot" />Agrega obstáculos para validar la pista.
            </li>
          </ul>
        </div>

        <div class="panel-card">
          <h3>Guardar y compartir</h3>
          <div class="save-row">
            <input
              v-model="courseName"
              type="text"
              placeholder="Nombre de la pista"
            >
            <button
              class="btn mini"
              type="button"
              @click="saveCourse"
            >
              💾 Guardar
            </button>
          </div>
          <ul
            v-if="savedCourses.length"
            class="saved-list"
          >
            <li
              v-for="course in savedCourses"
              :key="course.nombre"
            >
              <span class="saved-name">{{ course.nombre }}</span>
              <button
                class="btn mini"
                type="button"
                @click="loadCourse(course)"
              >
                Abrir
              </button>
              <button
                class="btn mini danger"
                type="button"
                @click="deleteCourse(course.nombre)"
              >
                ✕
              </button>
            </li>
          </ul>
          <div class="panel-actions">
            <button
              class="btn mini"
              type="button"
              @click="exportJson"
            >
              ⇩ JSON
            </button>
            <button
              class="btn mini"
              type="button"
              @click="exportSvg"
            >
              ⇩ SVG
            </button>
            <label class="btn mini import-btn">
              ⇧ Importar
              <input
                type="file"
                accept="application/json"
                @change="importJson"
              >
            </label>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import ObstacleGlyph from './ObstacleGlyph.vue'
import {
  GRADOS,
  OBSTACLES_BY_ID,
  OBSTACLE_TYPES,
  SIZE_CATEGORIES,
  courseTimes,
  validateCourse,
} from '../../data/agilityRules'

const STORAGE_KEY = 'motionlab-agility-courses'
const LONG_TYPES = new Set(['tunel', 'slalom', 'empalizada', 'pasarela', 'balancin'])

const categoria = ref('L')
const grado = ref(1)
const modalidad = ref('agility')
const velocidadManual = ref(null)
const showPath = ref(true)
const showDistances = ref(false)

const items = ref([])
const selectedId = ref(null)
const courseName = ref('')
const savedCourses = ref(readSavedCourses())
const svgRef = ref(null)
let nextId = 1
let drag = null
let applyingCourse = false

const velocidad = computed({
  get: () => velocidadManual.value ?? defaultSpeed(),
  set: (value) => { velocidadManual.value = value },
})

// Al cambiar grado/modalidad se vuelve a la velocidad sugerida, excepto
// cuando el cambio viene de cargar una pista guardada (que trae la suya).
watch([grado, modalidad], () => {
  if (!applyingCourse) velocidadManual.value = null
})

function defaultSpeed() {
  const g = GRADOS[grado.value] || GRADOS[1]
  return modalidad.value === 'jumping' ? g.velocidadJumping : g.velocidadAgility
}

const selected = computed(() => items.value.find((item) => item.id === selectedId.value) || null)
const selectedIndex = computed(() => items.value.findIndex((item) => item.id === selectedId.value))
const selectedType = computed(() => (selected.value ? OBSTACLES_BY_ID[selected.value.type] : null))

const jumpCount = computed(() => items.value.filter((item) => OBSTACLES_BY_ID[item.type]?.esSalto).length)
const contactCount = computed(() => items.value.filter((item) => OBSTACLES_BY_ID[item.type]?.esContacto).length)

const itemDepth = (item) => (item.type === 'tunel' ? (item.len || 4) : OBSTACLES_BY_ID[item.type].huella.d)

// Vector del eje local +y del obstáculo en coordenadas de campo (SVG rota en
// sentido horario con y hacia abajo): (0,1) → (-sin θ, cos θ).
const axisOf = (item) => {
  const rad = (item.rot * Math.PI) / 180
  return { x: -Math.sin(rad), y: Math.cos(rad) }
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

// Puntos de entrada/salida por obstáculo: los largos (túnel, slalom, contactos)
// se modelan como segmento sobre su eje; el resto como punto en su centro.
const waypoints = computed(() => {
  const list = items.value
  return list.map((item, i) => {
    if (!LONG_TYPES.has(item.type)) {
      const p = { x: item.x, y: item.y }
      return { entry: p, exit: p, internal: 0 }
    }
    const axis = axisOf(item)
    const half = itemDepth(item) / 2
    const e1 = { x: item.x - axis.x * half, y: item.y - axis.y * half }
    const e2 = { x: item.x + axis.x * half, y: item.y + axis.y * half }
    const neighbor = i > 0 ? list[i - 1] : list[i + 1]
    if (!neighbor) return { entry: e1, exit: e2, internal: itemDepth(item) }
    const refPoint = { x: neighbor.x, y: neighbor.y }
    let entry = e1
    let exit = e2
    if (i > 0) {
      // La entrada es el extremo más cercano al obstáculo anterior.
      if (dist(e2, refPoint) < dist(e1, refPoint)) { entry = e2; exit = e1 }
    } else if (dist(e1, refPoint) < dist(e2, refPoint)) {
      // Primer obstáculo: la salida apunta hacia el siguiente.
      entry = e2
      exit = e1
    }
    return { entry, exit, internal: itemDepth(item) }
  })
})

const geometry = computed(() => {
  const wp = waypoints.value
  const gaps = []
  let length = 0
  for (let i = 0; i < wp.length; i += 1) {
    if (i > 0) {
      const gap = dist(wp[i - 1].exit, wp[i].entry)
      gaps.push(gap)
      length += gap
    }
    length += wp[i].internal
  }
  return { gaps, length }
})

const pathSegments = computed(() => {
  const wp = waypoints.value
  const segments = []
  for (let i = 1; i < wp.length; i += 1) {
    segments.push({ a: wp[i - 1].exit, b: wp[i].entry, dist: geometry.value.gaps[i - 1] })
  }
  return segments
})

const times = computed(() => courseTimes(geometry.value.length, velocidad.value))

const validations = computed(() => {
  if (!items.value.length) return []
  const findings = validateCourse(items.value, grado.value, geometry.value)

  if (modalidad.value === 'jumping' && contactCount.value > 0) {
    findings.push({ nivel: 'error', texto: 'Un recorrido de Jumping no lleva obstáculos de contacto.' })
  }

  // Aproximación recta requerida (neumático y ría): ángulo entre la dirección
  // de llegada y el eje de cruce del obstáculo.
  const wp = waypoints.value
  items.value.forEach((item, i) => {
    if (!OBSTACLES_BY_ID[item.type]?.aproximacionRecta || i === 0) return
    const from = wp[i - 1].exit
    const to = wp[i].entry
    const d = { x: to.x - from.x, y: to.y - from.y }
    const mag = Math.hypot(d.x, d.y)
    if (!mag) return
    const axis = axisOf(item)
    const cos = Math.abs((d.x * axis.x + d.y * axis.y) / mag)
    const angle = (Math.acos(Math.min(1, cos)) * 180) / Math.PI
    if (angle > 45) {
      findings.push({ nivel: 'aviso', texto: `El obstáculo #${i + 1} (${OBSTACLES_BY_ID[item.type].nombre}) requiere aproximación recta; la llegada actual es muy angulada (${angle.toFixed(0)}°).` })
    }
  })

  return findings
})

const hitBox = (item) => {
  const huella = OBSTACLES_BY_ID[item.type].huella
  return { w: Math.max(huella.w, 1) + 0.4, h: Math.max(itemDepth(item), 1) + 0.4 }
}

const numberPos = (item) => {
  const rad = (item.rot * Math.PI) / 180
  const huella = OBSTACLES_BY_ID[item.type].huella
  const offset = huella.w / 2 + 0.9
  const x = Math.min(39.2, Math.max(0.8, item.x + Math.cos(rad) * offset))
  const y = Math.min(19.2, Math.max(0.8, item.y + Math.sin(rad) * offset))
  return { x, y }
}

const addObstacle = (type) => {
  const stagger = (items.value.length % 5) * 1.2
  const item = { id: nextId, type, x: 18 + stagger, y: 8 + stagger * 0.6, rot: 0 }
  if (type === 'tunel') item.len = 4
  nextId += 1
  items.value.push(item)
  selectedId.value = item.id
}

const removeSelected = () => {
  if (!selected.value) return
  items.value = items.value.filter((item) => item.id !== selectedId.value)
  selectedId.value = null
}

const duplicateSelected = () => {
  if (!selected.value) return
  const copy = { ...selected.value, id: nextId, x: Math.min(39, selected.value.x + 2), y: Math.min(19, selected.value.y + 1.5) }
  nextId += 1
  items.value.push(copy)
  selectedId.value = copy.id
}

const moveInSequence = (delta) => {
  const index = selectedIndex.value
  const target = index + delta
  if (index < 0 || target < 0 || target >= items.value.length) return
  const list = [...items.value]
  const [moved] = list.splice(index, 1)
  list.splice(target, 0, moved)
  items.value = list
}

const clearCourse = () => {
  items.value = []
  selectedId.value = null
}

const svgPoint = (event) => {
  const svg = svgRef.value
  const point = svg.createSVGPoint()
  point.x = event.clientX
  point.y = event.clientY
  return point.matrixTransform(svg.getScreenCTM().inverse())
}

const onObstaclePointerDown = (event, item) => {
  selectedId.value = item.id
  const point = svgPoint(event)
  drag = { id: item.id, dx: item.x - point.x, dy: item.y - point.y }
  event.target.closest('svg').setPointerCapture?.(event.pointerId)
}

const onFieldPointerDown = () => { selectedId.value = null }

const onPointerMove = (event) => {
  if (!drag) return
  const point = svgPoint(event)
  const item = items.value.find((entry) => entry.id === drag.id)
  if (!item) return
  item.x = Math.round(Math.min(40, Math.max(0, point.x + drag.dx)) * 10) / 10
  item.y = Math.round(Math.min(20, Math.max(0, point.y + drag.dy)) * 10) / 10
}

const onPointerUp = () => { drag = null }

// --- Persistencia ---

function readSavedCourses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

const serializeCourse = (nombre) => ({
  version: 1,
  nombre,
  categoria: categoria.value,
  grado: grado.value,
  modalidad: modalidad.value,
  velocidad: velocidad.value,
  items: items.value.map((item) => ({ ...item })),
})

const persist = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCourses.value))
}

const saveCourse = () => {
  const nombre = courseName.value.trim() || `Pista ${savedCourses.value.length + 1}`
  const data = serializeCourse(nombre)
  const existing = savedCourses.value.findIndex((course) => course.nombre === nombre)
  if (existing >= 0) savedCourses.value.splice(existing, 1, data)
  else savedCourses.value.push(data)
  persist()
  courseName.value = nombre
}

const applyCourse = (data) => {
  applyingCourse = true
  categoria.value = data.categoria || 'L'
  grado.value = data.grado || 1
  modalidad.value = data.modalidad || 'agility'
  velocidadManual.value = data.velocidad ?? null
  items.value = (data.items || []).map((item) => ({
    ...item,
    ...(item.type === 'tunel' ? { len: item.len ?? 4 } : {}),
    id: nextId++,
  }))
  selectedId.value = null
  courseName.value = data.nombre || ''
  nextTick(() => { applyingCourse = false })
}

const loadCourse = (course) => applyCourse(course)

const deleteCourse = (nombre) => {
  savedCourses.value = savedCourses.value.filter((course) => course.nombre !== nombre)
  persist()
}

const download = (filename, content, mime) => {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const exportJson = () => {
  const nombre = courseName.value.trim() || 'pista-agility'
  download(`${nombre}.json`, JSON.stringify(serializeCourse(nombre), null, 2), 'application/json')
}

// Las clases del componente son estilos scoped que no viajan con el nodo:
// se copian los estilos calculados como estilos inline en el clon.
const SVG_STYLE_PROPS = [
  'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap',
  'opacity', 'font-size', 'font-weight', 'font-family', 'text-anchor',
  'paint-order', 'vector-effect',
]

const exportSvg = () => {
  const svg = svgRef.value
  if (!svg) return
  const clone = svg.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const liveNodes = svg.querySelectorAll('*')
  const cloneNodes = clone.querySelectorAll('*')
  liveNodes.forEach((node, i) => {
    const styles = getComputedStyle(node)
    SVG_STYLE_PROPS.forEach((prop) => {
      const value = styles.getPropertyValue(prop)
      if (value) cloneNodes[i].style.setProperty(prop, value)
    })
    cloneNodes[i].removeAttribute('class')
  })
  download(`${courseName.value.trim() || 'pista-agility'}.svg`, clone.outerHTML, 'image/svg+xml')
}

const importJson = (event) => {
  const [file] = event.target.files || []
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      applyCourse(JSON.parse(reader.result))
    } catch {
      // Archivo inválido: se ignora sin romper la sesión de diseño.
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}

// Pista de ejemplo: Grado 1, 15 obstáculos, distancias dentro del reglamento.
const EXAMPLE_COURSE = {
  version: 1,
  nombre: 'Ejemplo Grado 1',
  categoria: 'L',
  grado: 1,
  modalidad: 'agility',
  items: [
    { type: 'valla', x: 3.2, y: 17, rot: 90 },
    { type: 'valla', x: 9.5, y: 17, rot: 90 },
    { type: 'valla', x: 15.8, y: 16, rot: 105 },
    { type: 'tunel', x: 22, y: 13.5, rot: 310, len: 4 },
    { type: 'valla', x: 29.4, y: 16, rot: 60 },
    { type: 'neumatico', x: 35.2, y: 12.5, rot: 33 },
    { type: 'valla', x: 38.3, y: 7, rot: 335 },
    { type: 'valla', x: 33.1, y: 3.5, rot: 100 },
    { type: 'valla', x: 26.3, y: 3, rot: 95 },
    { type: 'slalom', x: 17.9, y: 4, rot: 100 },
    { type: 'valla', x: 8.9, y: 5.5, rot: 55 },
    { type: 'tunel', x: 4.2, y: 10.5, rot: 15, len: 4 },
    { type: 'valla', x: 8.4, y: 15.5, rot: 130 },
    { type: 'valla', x: 14.7, y: 13, rot: 105 },
    { type: 'valla', x: 21, y: 10, rot: 120 },
  ],
}

const loadExample = () => applyCourse(EXAMPLE_COURSE)
</script>

<style scoped>
.designer { display: grid; gap: var(--space-4); }

.designer-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--surface-brand-soft);
  border: var(--border-width) solid var(--border-strong);
  border-radius: var(--radius-md);
}

.control { display: grid; gap: var(--space-1); font-size: var(--text-sm); color: var(--text-secondary); font-weight: var(--weight-semibold); }
.control select,
.control input[type='number'],
.control input[type='text'] {
  min-height: 38px;
  padding: 6px 10px;
  border: var(--border-width) solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  font: inherit;
  color: var(--text-primary);
}
.control.checkbox { grid-auto-flow: column; align-items: center; gap: var(--space-2); padding-bottom: 8px; }

.designer-layout {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) 300px;
  gap: var(--space-4);
  align-items: start;
}

.palette { display: grid; gap: var(--space-2); align-content: start; }
.palette h3 { margin: 0 0 var(--space-1); font-size: var(--text-md); }
.palette-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px 12px;
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  text-align: left;
  transition: border-color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);
}
.palette-item:hover { border-color: var(--periwinkle-400); transform: translateX(2px); }
.palette-icon { font-size: var(--text-md); }
.palette-example,
.palette-clear { justify-content: center; min-height: 38px; padding: 8px 12px; font-size: var(--text-sm); }

.field-wrap { display: grid; gap: var(--space-3); min-width: 0; }
.field {
  width: 100%;
  height: auto;
  touch-action: none;
  border-radius: var(--radius-md);
  background: var(--surface-card);
  border: var(--border-width) solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
}
.grass { fill: #eef4ea; }
.grid line { stroke: rgba(79, 164, 122, 0.14); stroke-width: 1px; vector-effect: non-scaling-stroke; }
.grid line.major { stroke: rgba(79, 164, 122, 0.3); }
.fence { fill: none; stroke: var(--success); stroke-width: 2px; vector-effect: non-scaling-stroke; }
.field-label { font-size: 0.55px; fill: var(--text-muted); }

.path-line { stroke: var(--periwinkle-500); stroke-width: 2px; stroke-dasharray: 6 4; vector-effect: non-scaling-stroke; opacity: 0.8; }
.arrow-head { fill: var(--periwinkle-500); }
.distance-label { font-size: 0.55px; fill: var(--periwinkle-800); text-anchor: middle; font-weight: 600; paint-order: stroke; stroke: white; stroke-width: 0.12px; }

.obstacle { cursor: grab; }
.obstacle:active { cursor: grabbing; }
.hit-area { fill: transparent; }
.obstacle.selected .hit-area {
  fill: rgba(135, 149, 210, 0.12);
  stroke: var(--periwinkle-500);
  stroke-width: 1.5px;
  stroke-dasharray: 4 3;
  vector-effect: non-scaling-stroke;
}

.seq-badge circle { fill: var(--periwinkle-800); stroke: white; stroke-width: 1.5px; vector-effect: non-scaling-stroke; }
.seq-badge text { font-size: 0.62px; fill: white; text-anchor: middle; font-weight: 700; }

.stats-bar { display: flex; flex-wrap: wrap; gap: var(--space-3); }
.stat {
  display: grid;
  gap: 2px;
  min-width: 84px;
  padding: var(--space-2) var(--space-3);
  background: var(--surface-card);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius-sm);
}
.stat-label { color: var(--text-muted); font-size: var(--text-xs); font-weight: var(--weight-semibold); text-transform: uppercase; letter-spacing: 0.05em; }
.stat strong { color: var(--periwinkle-800); font-size: var(--text-md); }

.side-panel { display: grid; gap: var(--space-3); align-content: start; }
.panel-card {
  padding: var(--space-4);
  background: var(--surface-card);
  border: var(--border-width) solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.panel-card h3 { margin: 0 0 var(--space-3); font-size: var(--text-md); }
.panel-card.muted p { margin: 0; color: var(--text-muted); font-size: var(--text-sm); }

.panel-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-3); }
.btn.mini { min-height: 32px; padding: 5px 12px; font-size: var(--text-xs); box-shadow: none; border-color: var(--border-subtle); }
.btn.mini:hover { border-color: var(--periwinkle-400); }
.btn.mini.danger { color: var(--danger); border-color: rgba(217, 83, 79, 0.4); }
.btn.mini:disabled { opacity: 0.45; cursor: default; }

.specs-list { margin: var(--space-3) 0 0; padding-left: 18px; display: grid; gap: 4px; color: var(--text-secondary); font-size: var(--text-sm); }

.validation-list { margin: 0; padding: 0; list-style: none; display: grid; gap: var(--space-2); font-size: var(--text-sm); }
.validation-list li { display: flex; gap: var(--space-2); align-items: baseline; color: var(--text-secondary); }
.validation-dot { flex: none; width: 9px; height: 9px; border-radius: 50%; transform: translateY(-1px); }
.validation-list li.ok .validation-dot { background: var(--success); }
.validation-list li.aviso .validation-dot { background: var(--warning); }
.validation-list li.error .validation-dot { background: var(--danger); }
.validation-list li.error { color: var(--danger); font-weight: var(--weight-medium); }

.save-row { display: flex; gap: var(--space-2); }
.save-row input { flex: 1; min-width: 0; min-height: 38px; padding: 6px 10px; border: var(--border-width) solid var(--border-strong); border-radius: var(--radius-sm); font: inherit; }

.saved-list { margin: var(--space-3) 0 0; padding: 0; list-style: none; display: grid; gap: var(--space-2); }
.saved-list li { display: flex; align-items: center; gap: var(--space-2); }
.saved-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--text-sm); font-weight: var(--weight-medium); }

.import-btn { position: relative; overflow: hidden; cursor: pointer; }
.import-btn input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

@media (max-width: 1080px) {
  .designer-layout { grid-template-columns: 1fr; }
  .palette { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
  .palette h3 { grid-column: 1 / -1; }
}
</style>
