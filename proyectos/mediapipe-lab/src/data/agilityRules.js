// Reglamento de Agility FCI: reglas de fondo vigentes desde el 1.1.2023
// (edición documental reestructurada en 2025), aplicado en México por la
// Federación Canófila Mexicana (FCM, miembro de la FCI).
// Todas las medidas en centímetros salvo indicación contraria.

export const SIZE_CATEGORIES = [
  {
    id: 'S',
    nombre: 'Small',
    cruz: 'menos de 35 cm a la cruz',
    alturaValla: { min: 25, max: 30 },
    alturaNeumatico: 55,
    riaElementos: 2,
    riaLongitud: { min: 40, max: 50 },
  },
  {
    id: 'M',
    nombre: 'Medium',
    cruz: 'de 35 cm a menos de 43 cm',
    alturaValla: { min: 35, max: 40 },
    alturaNeumatico: 55,
    riaElementos: 3,
    riaLongitud: { min: 70, max: 90 },
  },
  {
    id: 'I',
    nombre: 'Intermediate',
    cruz: 'de 43 cm a menos de 48 cm (categoría nueva desde 2023)',
    alturaValla: { min: 45, max: 50 },
    alturaNeumatico: 70,
    riaElementos: 3,
    riaLongitud: { min: 90, max: 110 },
  },
  {
    id: 'L',
    nombre: 'Large',
    cruz: '48 cm o más (un Border Collie compite aquí)',
    alturaValla: { min: 55, max: 60 },
    alturaNeumatico: 80,
    riaElementos: 4,
    riaLongitud: { min: 120, max: 150 },
  },
]

// La FCI no fija rangos de obstáculos distintos por grado: todo recorrido tiene
// de 15 a 22. La diferencia entre grados es longitud, dificultad y la velocidad
// elegida por el juez para el TRS (las velocidades aquí son sugerencias editables).
export const GRADOS = {
  1: {
    nombre: 'Grado 1',
    descripcion: 'Nivel inicial. Recorridos fluidos, sin dobles ni trampas complejas.',
    obstaculos: { min: 15, max: 22 },
    contactosMax: 3,
    velocidadAgility: 2.5,
    velocidadJumping: 3.0,
  },
  2: {
    nombre: 'Grado 2',
    descripcion: 'Nivel intermedio. Cambios de mano y líneas más exigentes.',
    obstaculos: { min: 15, max: 22 },
    contactosMax: 4,
    velocidadAgility: 3.0,
    velocidadJumping: 3.5,
  },
  3: {
    nombre: 'Grado 3',
    descripcion: 'Nivel avanzado. Recorridos técnicos de campeonato.',
    obstaculos: { min: 15, max: 22 },
    contactosMax: 4,
    velocidadAgility: 3.5,
    velocidadJumping: 4.0,
  },
}

export const COURSE_RULES = {
  longitud: { min: 100, max: 220 },
  saltosMinimos: 7,
  // Mínimo 5 m sobre la trayectoria del perro; máximo 7 m en línea recta
  // (hasta 9 m sobre la trayectoria).
  distanciaEntreObstaculos: { min: 5, max: 7 },
  // El TRM debe quedar entre 1.5 y 2 veces el TRS; se usa 1.5 como referencia.
  factorTRM: 1.5,
  tunelPasesMax: 5,
  ring: { ancho: 20, largo: 40 },
}

export const SCORING = {
  falta: 5,
  rehuse: 5,
  rehusesParaEliminar: 3,
  calificaciones: [
    { nombre: 'Excelente', maxPenalizacion: 5.99 },
    { nombre: 'Muy Bueno', maxPenalizacion: 15.99 },
    { nombre: 'Bueno', maxPenalizacion: 25.99 },
    { nombre: 'No clasificado', maxPenalizacion: Infinity },
  ],
}

// Catálogo de obstáculos aprobados por la FCI. `huella` es el tamaño en metros
// (ancho × profundidad) que ocupa el obstáculo visto desde arriba en el diseñador;
// `eje` indica si el perro lo cruza a lo largo (long) o a lo ancho (cross).
export const OBSTACLE_TYPES = [
  {
    id: 'valla',
    nombre: 'Valla',
    icono: '🚧',
    grupo: 'salto',
    esSalto: true,
    esContacto: false,
    huella: { w: 1.3, d: 0.6 },
    specs: [
      'Ancho interior: 1.20 a 1.30 m',
      'Barra superior desplazable (derribarla = 5 faltas)',
      'Altura según categoría: S 25–30 · M 35–40 · I 45–50 · L 55–60 cm',
    ],
  },
  {
    id: 'muro',
    nombre: 'Muro / Viaducto',
    icono: '🧱',
    grupo: 'salto',
    esSalto: true,
    esContacto: false,
    huella: { w: 1.3, d: 0.4 },
    specs: [
      'Ancho: 1.20 a 1.30 m',
      'Elementos superiores desplazables (derribarlos = 5 faltas)',
      'Misma altura que la valla según categoría',
    ],
  },
  {
    id: 'neumatico',
    nombre: 'Neumático',
    icono: '🛞',
    grupo: 'salto',
    esSalto: true,
    esContacto: false,
    aproximacionRecta: true,
    huella: { w: 1.4, d: 0.6 },
    specs: [
      'Diámetro interior: 50 a 60 cm',
      'Altura al centro: S/M 55 · I 70 · L 80 cm',
      'Obligatorio tipo separable (breakaway): se abre en 2 a 4 partes al impacto',
      'Desde 2023 solo se fija con dos montantes laterales (sin marco colgante)',
      'Requiere aproximación recta · solo aparece una vez por recorrido',
    ],
  },
  {
    id: 'ria',
    nombre: 'Salto de longitud (ría)',
    icono: '📏',
    grupo: 'salto',
    esSalto: true,
    esContacto: false,
    aproximacionRecta: true,
    huella: { w: 1.5, d: 1.5 },
    specs: [
      'Elementos según categoría: S 2 · M 3 · I 3–4 · L 4',
      'Longitud total: S 40–50 · M 70–90 · I 90–110 · L 120–150 cm',
      'Elementos ascendentes de 15 a 28 cm de alto',
      'Cuatro postes de esquina; requiere aproximación recta',
    ],
  },
  {
    id: 'tunel',
    nombre: 'Túnel rígido',
    icono: '🕳️',
    grupo: 'tunel',
    esSalto: false,
    esContacto: false,
    huella: { w: 0.6, d: 4 },
    eje: 'long',
    specs: [
      'Diámetro: 60 cm',
      'Longitud: 3 a 6 m',
      'Puede colocarse recto o en curva · máximo 5 pasadas de túnel por recorrido',
      'El túnel de tela (chute) fue eliminado del reglamento FCI en 2023',
    ],
  },
  {
    id: 'slalom',
    nombre: 'Slalom',
    icono: '〰️',
    grupo: 'slalom',
    esSalto: false,
    esContacto: false,
    huella: { w: 0.8, d: 6.6 },
    eje: 'long',
    specs: [
      '12 postes rígidos separados 60 cm',
      'Altura de postes: 1.00 a 1.20 m · diámetro 3 a 5 cm',
      'ENTRADA: el primer poste siempre queda al hombro IZQUIERDO del perro',
      'Entrada incorrecta = rehúse · error de secuencia = falta (se corrige y continúa)',
      'Solo puede aparecer una vez en el recorrido',
    ],
  },
  {
    id: 'empalizada',
    nombre: 'Empalizada (A-frame)',
    icono: '⛰️',
    grupo: 'contacto',
    esSalto: false,
    esContacto: true,
    huella: { w: 0.9, d: 3.8 },
    eje: 'long',
    zonaContacto: 1.06,
    specs: [
      'Dos rampas de 2.65 a 2.75 m, ancho 90 cm',
      'Altura del vértice: 1.70 m para todas las categorías',
      'Zonas de contacto: 1.06 m en cada rampa',
      'No pisar la zona de bajada = 5 faltas',
    ],
  },
  {
    id: 'pasarela',
    nombre: 'Pasarela (dog walk)',
    icono: '🌉',
    grupo: 'contacto',
    esSalto: false,
    esContacto: true,
    huella: { w: 0.35, d: 10.8 },
    eje: 'long',
    zonaContacto: 0.9,
    specs: [
      'Tres tablones de 3.60 a 3.80 m, ancho 30 cm',
      'Altura: 1.20 a 1.30 m',
      'Zonas de contacto: 90 cm en subida y bajada',
    ],
  },
  {
    id: 'balancin',
    nombre: 'Balancín (see-saw)',
    icono: '⚖️',
    grupo: 'contacto',
    esSalto: false,
    esContacto: true,
    huella: { w: 0.35, d: 3.7 },
    eje: 'long',
    zonaContacto: 0.9,
    specs: [
      'Tablón de 3.60 a 3.80 m, ancho 30 cm',
      'Altura del eje: 60 cm',
      'Debe bascular y tocar el suelo antes de que el perro baje',
      'Bajarse antes de que toque el suelo = 5 faltas',
    ],
  },
  {
    id: 'mesa',
    nombre: 'Mesa (histórica)',
    icono: '🟦',
    grupo: 'otro',
    esSalto: false,
    esContacto: false,
    historico: true,
    huella: { w: 0.9, d: 0.9 },
    specs: [
      'Retirada del reglamento FCI desde 2018: ya no se usa en pruebas oficiales',
      'Puede aparecer en reglamentos locales antiguos y en entrenamiento',
      'Superficie: 90 × 90 cm antiderrapante · pausa clásica de 5 segundos',
    ],
  },
]

export const OBSTACLES_BY_ID = Object.fromEntries(OBSTACLE_TYPES.map((o) => [o.id, o]))

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

// Longitud aproximada del recorrido: polilínea por los centros de los obstáculos
// en orden de secuencia (aproximación de la trayectoria del perro).
export const courseLength = (obstacles) => {
  let total = 0
  for (let i = 1; i < obstacles.length; i += 1) {
    total += distance(obstacles[i - 1], obstacles[i])
  }
  return total
}

export const courseTimes = (lengthMeters, speed, factorTRM = COURSE_RULES.factorTRM) => {
  if (!lengthMeters || !speed) return { trs: 0, trm: 0 }
  const trs = lengthMeters / speed
  return { trs, trm: trs * factorTRM }
}

// Valida un diseño de pista contra el reglamento. Devuelve una lista de
// hallazgos { nivel: 'ok' | 'aviso' | 'error', texto }. `geometry` permite
// pasar huecos y longitud calculados sobre la trayectoria real (entradas y
// salidas de obstáculos largos); si falta, se aproxima por centros.
export const validateCourse = (obstacles, grado, geometry = null) => {
  const findings = []
  const rules = GRADOS[grado] || GRADOS[1]
  const total = obstacles.length
  const jumps = obstacles.filter((o) => OBSTACLES_BY_ID[o.type]?.esSalto)
  const contacts = obstacles.filter((o) => OBSTACLES_BY_ID[o.type]?.esContacto)
  const slaloms = obstacles.filter((o) => o.type === 'slalom')

  const push = (nivel, texto) => findings.push({ nivel, texto })

  if (total < rules.obstaculos.min || total > rules.obstaculos.max) {
    push('error', `${rules.nombre}: se requieren entre ${rules.obstaculos.min} y ${rules.obstaculos.max} obstáculos (hay ${total}).`)
  } else {
    push('ok', `Número de obstáculos correcto para ${rules.nombre} (${total}).`)
  }

  if (jumps.length < COURSE_RULES.saltosMinimos) {
    push('error', `Se requieren al menos ${COURSE_RULES.saltosMinimos} obstáculos de salto (hay ${jumps.length}).`)
  } else {
    push('ok', `Saltos suficientes (${jumps.length} de mínimo ${COURSE_RULES.saltosMinimos}).`)
  }

  if (contacts.length > rules.contactosMax) {
    push('error', `${rules.nombre} admite máximo ${rules.contactosMax} obstáculos de contacto (hay ${contacts.length}).`)
  } else if (contacts.length > 0) {
    push('ok', `Obstáculos de contacto dentro del límite (${contacts.length} de máximo ${rules.contactosMax}).`)
  }

  if (slaloms.length > 1) {
    push('error', 'El slalom solo puede aparecer una vez en el recorrido.')
  } else if (slaloms.length === 0 && total >= rules.obstaculos.min) {
    push('aviso', 'El reglamento pide usar el slalom en todo recorrido (una sola vez).')
  }

  const onceOnly = { neumatico: 'El neumático', muro: 'El muro' }
  Object.entries(onceOnly).forEach(([type, label]) => {
    if (obstacles.filter((o) => o.type === type).length > 1) {
      push('error', `${label} solo puede aparecer una vez en el recorrido.`)
    }
  })

  const tunnelPasses = obstacles.filter((o) => o.type === 'tunel').length
  if (tunnelPasses > COURSE_RULES.tunelPasesMax) {
    push('error', `Máximo ${COURSE_RULES.tunelPasesMax} pasadas de túnel por recorrido (hay ${tunnelPasses}).`)
  }

  if (obstacles.some((o) => OBSTACLES_BY_ID[o.type]?.historico)) {
    push('aviso', 'La mesa fue retirada del reglamento FCI en 2018; úsala solo para entrenar o en reglamentos locales antiguos.')
  }

  if (total >= 2) {
    if (obstacles[0].type !== 'valla') {
      push('aviso', 'Se recomienda que el primer obstáculo sea una valla simple.')
    }
    if (obstacles[total - 1].type !== 'valla') {
      push('aviso', 'Se recomienda que el último obstáculo sea una valla simple.')
    }
  }

  const gapValues = geometry?.gaps
    ?? obstacles.slice(1).map((o, i) => distance(obstacles[i], o))
  const badGaps = []
  gapValues.forEach((gap, i) => {
    if (gap < COURSE_RULES.distanciaEntreObstaculos.min || gap > COURSE_RULES.distanciaEntreObstaculos.max) {
      badGaps.push(`${i + 1}→${i + 2} (${gap.toFixed(1)} m)`)
    }
  })
  if (badGaps.length) {
    push('aviso', `Distancias fuera del rango ${COURSE_RULES.distanciaEntreObstaculos.min}–${COURSE_RULES.distanciaEntreObstaculos.max} m: ${badGaps.join(', ')}.`)
  } else if (total >= 2) {
    push('ok', 'Distancias entre obstáculos dentro del rango recomendado.')
  }

  const length = geometry?.length ?? courseLength(obstacles)
  if (total >= 2 && (length < COURSE_RULES.longitud.min || length > COURSE_RULES.longitud.max)) {
    push('aviso', `Longitud estimada ${length.toFixed(0)} m; el reglamento indica ${COURSE_RULES.longitud.min}–${COURSE_RULES.longitud.max} m.`)
  }

  return findings
}
