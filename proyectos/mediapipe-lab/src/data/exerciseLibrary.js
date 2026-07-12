// Biblioteca de ejercicios de Exercise (MotionLab · entrenador de postura).
//
// Cada ejercicio trae dos cosas:
//   1. Contenido educativo (para qué sirve, músculos, cómo se hace, errores,
//      precauciones) — pensado para leerse escaneable.
//   2. Una "referencia de postura" (`ref`): qué articulaciones vigila el coach,
//      el ángulo objetivo de cada una y su tolerancia, más el rango para contar
//      repeticiones. Los ángulos son los que calcula `services/poseCompare.js`
//      sobre los 33 landmarks de MediaPipe Pose. Son valores por defecto,
//      razonables para una vista lateral; cuando Paulette captura su propia
//      pose (modo Capturar), esos ángulos se vuelven el objetivo real.
//
// NADA de esto es consejo médico: son señales geométricas para cuidar la forma.
//
// Nombres de métricas que expone poseCompare (ver ese archivo):
//   rodillaIzq/rodillaDer, caderaIzq/caderaDer (+ caderaMin/caderaProm),
//   codoIzq/codoDer (+ codoProm), hombroIzq/hombroDer (+ hombroProm),
//   espalda (grados respecto a la vertical: 0 = tronco erguido).

// Un aviso de seguridad compartido para no repetir el descargo en cada ficha.
const DESCARGO = 'Trabaja en un rango sin dolor. Esto no es consejo médico; ante molestia persistente, consulta a un profesional.'

export const EXERCISES = [
  {
    id: 'sentadilla',
    nombre: 'Sentadilla',
    pose: 'squat',
    zona: 'Piernas',
    aparato: 'Sin aparato',
    nivel: 'Principiante',
    cat: 'Fuerza',
    pastel: 'var(--pastel-mint)',
    para: 'El patrón de fuerza más funcional del tren inferior: sentarse y levantarse bien protege rodillas, cadera y espalda en la vida diaria.',
    musculos: ['Cuádriceps', 'Glúteos', 'Isquiotibiales', 'Core'],
    beneficios: [
      'Fuerza funcional para subir escaleras y cargar peso',
      'Más movilidad de cadera y tobillo',
      'Rodillas más estables y protegidas',
    ],
    como: [
      { n: 1, t: 'Pies al ancho de los hombros, puntas ligeramente hacia afuera.' },
      { n: 2, t: 'Baja llevando la cadera atrás, como si buscaras una silla.' },
      { n: 3, t: 'Rodillas siguiendo la punta del pie, pecho arriba.' },
      { n: 4, t: 'Sube empujando el piso con toda la planta.' },
    ],
    errores: [
      'Las rodillas se van hacia adentro al subir.',
      'Los talones se levantan del piso.',
      'La espalda baja se redondea en el fondo.',
    ],
    precauciones: DESCARGO,
    instruccion: 'Baja hasta que el muslo quede paralelo al piso',
    instruccionSub: 'Mantén las rodillas alineadas con las puntas de los pies.',
    dosis: { series: 3, reps: 12, repsLabel: 'reps', descanso: '60 s' },
    ref: {
      vista: 'lateral',
      joints: [
        { label: 'Rodilla izq.', metric: 'rodillaIzq', target: 95, tol: 18, cue: { menos: 'Baja un poco más', mas: 'No fuerces la rodilla' } },
        { label: 'Rodilla der.', metric: 'rodillaDer', target: 95, tol: 18, cue: { menos: 'Baja un poco más', mas: 'No fuerces la rodilla' } },
        { label: 'Cadera', metric: 'caderaMin', target: 72, tol: 22, cue: { menos: 'Baja un poco más la cadera', mas: 'Lleva la cadera hacia atrás' } },
        { label: 'Espalda', metric: 'espalda', target: 22, tol: 16, cue: { mas: 'Pecho arriba, endereza la espalda' } },
        { label: 'Hombros', tipo: 'vis', region: 'hombros' },
        { label: 'Tobillos', tipo: 'vis', region: 'tobillos' },
      ],
      rep: { metric: 'rodillaProm', abajo: 110, arriba: 158 },
    },
  },
  {
    id: 'plancha',
    nombre: 'Plancha',
    pose: 'plank',
    zona: 'Core',
    aparato: 'Sin aparato',
    nivel: 'Intermedio',
    cat: 'Estabilidad',
    pastel: 'var(--pastel-sky)',
    para: 'Enseña al core a mantener el tronco firme como una tabla. Es la base de una espalda que no se lastima al cargar o girar.',
    musculos: ['Core', 'Abdomen', 'Hombros', 'Glúteos'],
    beneficios: [
      'Un core que estabiliza y protege la espalda baja',
      'Mejor postura al estar de pie o sentada',
      'Resistencia para sostener el tronco firme',
    ],
    como: [
      { n: 1, t: 'Antebrazos en el piso, codos justo debajo de los hombros.' },
      { n: 2, t: 'Estira las piernas y apoya las puntas de los pies.' },
      { n: 3, t: 'Aprieta glúteos y abdomen: cuerpo en línea recta.' },
      { n: 4, t: 'Cabeza neutra, mirada al piso. Respira parejo.' },
    ],
    errores: [
      'La cadera se hunde y arquea la espalda baja.',
      'La cola sube demasiado (te pliegas en V).',
      'Aguantas la respiración en vez de respirar.',
    ],
    precauciones: DESCARGO,
    instruccion: 'Cuerpo en una sola línea, de la cabeza a los talones',
    instruccionSub: 'Aprieta glúteos y abdomen para no hundir la cadera.',
    dosis: { series: 3, reps: '0:40', repsLabel: 'aguante', descanso: '45 s' },
    ref: {
      vista: 'lateral',
      tipo: 'aguante',
      joints: [
        { label: 'Cadera', metric: 'caderaProm', target: 172, tol: 14, cue: { menos: 'Sube la cadera, no la hundas', mas: 'Baja un poco la cadera' } },
        { label: 'Espalda', metric: 'espalda', target: 82, tol: 16, cue: { menos: 'Baja la cola, alinea el tronco', mas: 'No hundas la espalda baja' } },
        { label: 'Hombros', tipo: 'vis', region: 'hombros' },
        { label: 'Rodillas', metric: 'rodillaProm', target: 172, tol: 14, cue: { menos: 'Estira más las piernas' } },
      ],
      rep: null,
    },
  },
  {
    id: 'estocada',
    nombre: 'Estocada',
    pose: 'lunge',
    zona: 'Piernas',
    aparato: 'Sin aparato',
    nivel: 'Intermedio',
    cat: 'Fuerza',
    pastel: 'var(--pastel-lilac)',
    para: 'Trabaja una pierna a la vez, así que corrige diferencias entre lado y lado y entrena el equilibrio que usas al caminar.',
    musculos: ['Cuádriceps', 'Glúteos', 'Isquiotibiales', 'Core'],
    beneficios: [
      'Equilibra la fuerza entre pierna izquierda y derecha',
      'Mejora el equilibrio y la estabilidad de cadera',
      'Se parece mucho al gesto de caminar y subir escaleras',
    ],
    como: [
      { n: 1, t: 'Da un paso largo al frente, tronco erguido.' },
      { n: 2, t: 'Baja doblando ambas rodillas hacia 90°.' },
      { n: 3, t: 'La rodilla de adelante sobre el tobillo, no más allá.' },
      { n: 4, t: 'Empuja con el talón de adelante para volver.' },
    ],
    errores: [
      'La rodilla de adelante se va hacia adentro.',
      'El tronco se inclina mucho al frente.',
      'La rodilla de atrás golpea el piso de golpe.',
    ],
    precauciones: DESCARGO,
    instruccion: 'Baja hasta que las dos rodillas lleguen cerca de 90°',
    instruccionSub: 'Rodilla de adelante alineada con el pie, tronco vertical.',
    dosis: { series: 3, reps: 10, repsLabel: 'x lado', descanso: '60 s' },
    ref: {
      vista: 'lateral',
      joints: [
        { label: 'Rodilla frontal', metric: 'rodillaMin', target: 92, tol: 18, cue: { menos: 'Baja un poco más', mas: 'No pases la rodilla del pie' } },
        { label: 'Rodilla trasera', metric: 'rodillaMax', target: 100, tol: 22, cue: { menos: 'Baja la rodilla de atrás' } },
        { label: 'Cadera', metric: 'caderaMin', target: 105, tol: 22 },
        { label: 'Espalda', metric: 'espalda', target: 14, tol: 15, cue: { mas: 'Endereza el tronco' } },
        { label: 'Tobillos', tipo: 'vis', region: 'tobillos' },
      ],
      rep: { metric: 'rodillaMin', abajo: 108, arriba: 156 },
    },
  },
  {
    id: 'press',
    nombre: 'Press de hombro',
    pose: 'press',
    zona: 'Hombros',
    aparato: 'Mancuerna',
    nivel: 'Intermedio',
    cat: 'Fuerza',
    pastel: 'var(--pastel-peach)',
    para: 'Empujar peso por encima de la cabeza con control. Fortalece los hombros para cargar cosas en alto sin lastimarte.',
    musculos: ['Deltoides', 'Tríceps', 'Trapecio', 'Core'],
    beneficios: [
      'Hombros fuertes para alcanzar y cargar en alto',
      'Mejor estabilidad del hombro y el omóplato',
      'Core activo para no arquear la espalda',
    ],
    como: [
      { n: 1, t: 'Mancuernas a la altura de los hombros, codos abajo.' },
      { n: 2, t: 'Aprieta el abdomen para no arquear la espalda.' },
      { n: 3, t: 'Empuja arriba hasta casi estirar los codos.' },
      { n: 4, t: 'Baja con control a la altura de los hombros.' },
    ],
    errores: [
      'Arquear la espalda baja para empujar.',
      'Estirar del todo el codo con un tirón.',
      'Subir los hombros hacia las orejas.',
    ],
    precauciones: DESCARGO,
    instruccion: 'Empuja arriba hasta casi estirar los codos',
    instruccionSub: 'Sin arquear la espalda: el core sostiene el tronco.',
    dosis: { series: 2, reps: 12, repsLabel: 'reps', descanso: '60 s' },
    ref: {
      vista: 'frontal',
      joints: [
        { label: 'Codo izq.', metric: 'codoIzq', target: 162, tol: 22, cue: { menos: 'Empuja un poco más arriba' } },
        { label: 'Codo der.', metric: 'codoDer', target: 162, tol: 22, cue: { menos: 'Empuja un poco más arriba' } },
        { label: 'Hombro izq.', metric: 'hombroIzq', target: 155, tol: 25 },
        { label: 'Hombro der.', metric: 'hombroDer', target: 155, tol: 25 },
        { label: 'Espalda', metric: 'espalda', target: 8, tol: 14, cue: { mas: 'No arquees la espalda' } },
      ],
      rep: { metric: 'codoProm', abajo: 100, arriba: 158 },
    },
  },
  {
    id: 'remo',
    nombre: 'Remo con banda',
    pose: 'row',
    zona: 'Espalda',
    aparato: 'Banda',
    nivel: 'Principiante',
    cat: 'Fuerza',
    pastel: 'var(--pastel-butter)',
    para: 'Jalar hacia ti fortalece toda la espalda alta, que es justo lo que contrarresta las horas frente a la pantalla.',
    musculos: ['Dorsal ancho', 'Romboides', 'Trapecio', 'Bíceps'],
    beneficios: [
      'Contrarresta la postura encorvada del escritorio',
      'Espalda alta fuerte y hombros más abiertos',
      'Menos tensión en cuello y trapecios',
    ],
    como: [
      { n: 1, t: 'Sujeta la banda con los brazos estirados al frente.' },
      { n: 2, t: 'Pecho arriba, hombros lejos de las orejas.' },
      { n: 3, t: 'Jala los codos hacia atrás, juntando los omóplatos.' },
      { n: 4, t: 'Vuelve al frente con control, sin soltar de golpe.' },
    ],
    errores: [
      'Encoger los hombros hacia las orejas al jalar.',
      'Usar el impulso del tronco en vez de la espalda.',
      'Soltar la banda de golpe en la vuelta.',
    ],
    precauciones: DESCARGO,
    instruccion: 'Jala los codos atrás juntando los omóplatos',
    instruccionSub: 'Hombros abajo y lejos de las orejas.',
    dosis: { series: 3, reps: 12, repsLabel: 'reps', descanso: '45 s' },
    ref: {
      vista: 'frontal',
      joints: [
        { label: 'Codo izq.', metric: 'codoIzq', target: 88, tol: 24, cue: { mas: 'Jala más, junta los omóplatos' } },
        { label: 'Codo der.', metric: 'codoDer', target: 88, tol: 24, cue: { mas: 'Jala más, junta los omóplatos' } },
        { label: 'Hombros', tipo: 'vis', region: 'hombros' },
        { label: 'Espalda', metric: 'espalda', target: 8, tol: 14, cue: { mas: 'No uses el impulso del tronco' } },
      ],
      rep: { metric: 'codoProm', abajo: 100, arriba: 150 },
    },
  },
  {
    id: 'puente',
    nombre: 'Puente de glúteo',
    pose: 'bridge',
    zona: 'Glúteos',
    aparato: 'Sin aparato',
    nivel: 'Principiante',
    cat: 'Movilidad',
    pastel: 'var(--pastel-blush)',
    para: 'Despierta los glúteos, que suelen quedarse dormidos de tanto estar sentada, y le quita carga a la espalda baja.',
    musculos: ['Glúteos', 'Isquiotibiales', 'Core', 'Espalda baja'],
    beneficios: [
      'Activa glúteos que se apagan al estar sentada',
      'Alivia y protege la espalda baja',
      'Mejora la extensión de cadera para caminar',
    ],
    como: [
      { n: 1, t: 'Boca arriba, rodillas dobladas, pies apoyados.' },
      { n: 2, t: 'Brazos a los lados, palmas abajo.' },
      { n: 3, t: 'Empuja con los talones y sube la cadera.' },
      { n: 4, t: 'Aprieta glúteos arriba y baja con control.' },
    ],
    errores: [
      'Empujar con la espalda baja en vez de los glúteos.',
      'Subir demasiado y arquear la espalda.',
      'Dejar caer la cadera de golpe.',
    ],
    precauciones: DESCARGO,
    instruccion: 'Sube la cadera hasta alinear rodilla, cadera y hombro',
    instruccionSub: 'Aprieta los glúteos arriba, sin arquear la espalda.',
    dosis: { series: 3, reps: 15, repsLabel: 'reps', descanso: '45 s' },
    ref: {
      vista: 'lateral',
      joints: [
        { label: 'Cadera', metric: 'caderaProm', target: 165, tol: 16, cue: { menos: 'Sube más la cadera', mas: 'No arquees, baja un poco' } },
        { label: 'Rodillas', metric: 'rodillaProm', target: 95, tol: 20 },
        { label: 'Espalda', metric: 'espalda', target: 62, tol: 20 },
        { label: 'Hombros', tipo: 'vis', region: 'hombros' },
      ],
      rep: { metric: 'caderaProm', abajo: 130, arriba: 160 },
    },
  },
  {
    id: 'elevacion',
    nombre: 'Elevación lateral',
    pose: 'press',
    zona: 'Hombros',
    aparato: 'Mancuerna',
    nivel: 'Principiante',
    cat: 'Fuerza',
    pastel: 'var(--pastel-sky)',
    para: 'Aísla la parte media del hombro para darle forma y estabilidad. Poco peso y mucho control mandan aquí.',
    musculos: ['Deltoides medio', 'Trapecio', 'Supraespinoso'],
    beneficios: [
      'Hombros más estables y con mejor forma',
      'Control fino del movimiento del brazo',
      'Complementa cualquier trabajo de empuje',
    ],
    como: [
      { n: 1, t: 'De pie, mancuernas a los lados, codos casi rectos.' },
      { n: 2, t: 'Sube los brazos a los lados hasta la altura del hombro.' },
      { n: 3, t: 'Codos apenas doblados, muñecas neutras.' },
      { n: 4, t: 'Baja despacio, sin usar impulso.' },
    ],
    errores: [
      'Subir por encima de los hombros y encogerlos.',
      'Usar impulso balanceando el tronco.',
      'Bajar los brazos de golpe.',
    ],
    precauciones: DESCARGO,
    instruccion: 'Sube los brazos a los lados hasta la altura del hombro',
    instruccionSub: 'No pases de la horizontal ni encojas los hombros.',
    dosis: { series: 3, reps: 15, repsLabel: 'reps', descanso: '45 s' },
    ref: {
      vista: 'frontal',
      joints: [
        { label: 'Hombro izq.', metric: 'hombroIzq', target: 88, tol: 20, cue: { menos: 'Sube un poco más', mas: 'No pases de la horizontal' } },
        { label: 'Hombro der.', metric: 'hombroDer', target: 88, tol: 20, cue: { menos: 'Sube un poco más', mas: 'No pases de la horizontal' } },
        { label: 'Codo izq.', metric: 'codoIzq', target: 165, tol: 22 },
        { label: 'Codo der.', metric: 'codoDer', target: 165, tol: 22 },
        { label: 'Espalda', metric: 'espalda', target: 8, tol: 14, cue: { mas: 'No balancees el tronco' } },
      ],
      rep: { metric: 'hombroProm', abajo: 40, arriba: 80 },
    },
  },
  {
    id: 'silla',
    nombre: 'Sentadilla en silla',
    pose: 'squat',
    zona: 'Piernas',
    aparato: 'Silla',
    nivel: 'Principiante',
    cat: 'Movilidad',
    pastel: 'var(--pastel-mint)',
    para: 'La sentadilla más amable: la silla te da un punto de referencia y confianza para aprender el patrón sin miedo a caer.',
    musculos: ['Cuádriceps', 'Glúteos', 'Core'],
    beneficios: [
      'Aprende el patrón de sentadilla sin miedo a caer',
      'Fuerza para levantarte de una silla con facilidad',
      'Ideal para empezar o para días de poca energía',
    ],
    como: [
      { n: 1, t: 'Párate frente a una silla, pies al ancho de cadera.' },
      { n: 2, t: 'Baja llevando la cadera atrás hasta rozar la silla.' },
      { n: 3, t: 'Toca apenas el asiento sin dejarte caer.' },
      { n: 4, t: 'Empuja con los talones para volver a subir.' },
    ],
    errores: [
      'Dejarte caer de golpe sobre la silla.',
      'Las rodillas se van hacia adentro.',
      'Impulsarte con los brazos en vez de las piernas.',
    ],
    precauciones: DESCARGO,
    instruccion: 'Baja llevando la cadera atrás hasta rozar la silla',
    instruccionSub: 'Toca apenas el asiento y sube empujando con los talones.',
    dosis: { series: 3, reps: 10, repsLabel: 'reps', descanso: '45 s' },
    ref: {
      vista: 'lateral',
      joints: [
        { label: 'Rodilla izq.', metric: 'rodillaIzq', target: 108, tol: 20, cue: { menos: 'Baja un poco más', mas: 'No fuerces la rodilla' } },
        { label: 'Rodilla der.', metric: 'rodillaDer', target: 108, tol: 20, cue: { menos: 'Baja un poco más', mas: 'No fuerces la rodilla' } },
        { label: 'Cadera', metric: 'caderaMin', target: 92, tol: 22, cue: { menos: 'Lleva la cadera hacia atrás' } },
        { label: 'Espalda', metric: 'espalda', target: 20, tol: 16, cue: { mas: 'Pecho arriba' } },
        { label: 'Tobillos', tipo: 'vis', region: 'tobillos' },
      ],
      rep: { metric: 'rodillaProm', abajo: 118, arriba: 158 },
    },
  },
]

// Grupos de filtro de la biblioteca (el primer chip de cada grupo = "todos").
export const FILTERS = [
  { key: 'aparato', label: 'APARATO', chips: ['Todos', 'Sin aparato', 'Mancuerna', 'Banda', 'Silla'] },
  { key: 'zona', label: 'ZONA', chips: ['Todas', 'Piernas', 'Core', 'Hombros', 'Espalda', 'Glúteos'] },
  { key: 'nivel', label: 'NIVEL', chips: ['Todos', 'Principiante', 'Intermedio', 'Avanzado'] },
  { key: 'cat', label: 'CATEGORÍA', chips: ['Todas', 'Fuerza', 'Movilidad', 'Estabilidad'] },
]

// Rutina semilla de tren inferior (misma del diseño). Cada ítem referencia un
// ejercicio + su dosis para esa rutina.
export const DEFAULT_ROUTINE = {
  id: 'tren-inferior',
  nombre: 'Rutina de tren inferior',
  items: [
    { id: 'sentadilla', series: 3, reps: 12, repsLabel: 'reps', descanso: '60 s' },
    { id: 'puente', series: 3, reps: 15, repsLabel: 'reps', descanso: '45 s' },
    { id: 'plancha', series: 3, reps: '0:40', repsLabel: 'aguante', descanso: '45 s' },
    { id: 'estocada', series: 3, reps: 10, repsLabel: 'x lado', descanso: '60 s' },
    { id: 'press', series: 2, reps: 12, repsLabel: 'reps', descanso: '60 s' },
  ],
}

export const getExercise = (id) => EXERCISES.find((e) => e.id === id) || EXERCISES[0]

// Niveles de rigor del coach: escalan la tolerancia de cada articulación.
export const RIGOR = {
  tolerante: { label: 'Tolerante', factor: 1.5, grados: 22 },
  media: { label: 'Media', factor: 1, grados: 15 },
  exigente: { label: 'Exigente', factor: 0.6, grados: 9 },
}
