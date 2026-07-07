// Biblioteca de maniobras de manejo con su terminología real (en inglés, como
// se usa en el mundo del agility) y fases verificables con la cámara.
// buildPhases recibe el contexto del intento: dogSign (+1 = perro a la
// izquierda del guía, -1 = derecha) y, para las maniobras de giro, un
// directional turn tracker del motor que el componente actualiza por frame.

const sideName = (sign) => (sign >= 0 ? 'izquierda' : 'derecha')
const armFor = (sign) => (sign >= 0 ? 'leftArm' : 'rightArm')

export const MANEUVERS = [
  {
    id: 'front-cross',
    nombreEN: 'Front Cross',
    nombreES: 'Cruce frontal',
    icono: '🔄',
    resumen: 'Cambias al perro de lado girando DE FRENTE a él, sin perderlo de vista.',
    cuandoUsar: 'Cuando puedes llegar antes que el perro al punto de cruce. Es el cruce más preciso: le avisa el giro antes del salto y pide colección.',
    virtualDog: true,
    vozIntro: 'Cruce frontal. Gira siempre hacia tu perro.',
    erroresComunes: [
      'Girar ALEJÁNDOTE del perro (te sale un cruce ciego accidental y lo pierdes de vista).',
      'Llegar tarde al punto de cruce: el perro salta largo o tira la barra.',
      'Quitarle los ojos de encima a mitad del giro: el perro se te cruza por la espalda.',
    ],
    buildPhases({ dogSign, turnTracker }) {
      const newSide = -dogSign
      return [
        {
          id: 'posicion',
          titulo: 'Posición y conexión',
          instruccion: `De frente, con el perro a tu ${sideName(dogSign)}. Hombros al frente.`,
          voz: 'De frente. Conecta con tu perro.',
          holdMs: 800,
          check: (m) => m.visible && Math.abs(m.yaw) < 35,
        },
        {
          id: 'senal',
          titulo: 'Señal de línea',
          instruccion: `Extiende el brazo ${sideName(dogSign)} marcando la línea del perro.`,
          voz: `Señala con tu brazo ${sideName(dogSign)}.`,
          holdMs: 800,
          check: (m) => m[armFor(dogSign)].extended && !m[armFor(dogSign)].raised && Math.abs(m.yaw) < 45,
        },
        {
          id: 'giro',
          titulo: 'Giro hacia el perro',
          instruccion: `Gira 360° HACIA tu ${sideName(dogSign)}: pasa de frente → espaldas → frente.`,
          voz: `Gira hacia tu ${sideName(dogSign)}, sin dejar de mirar al perro.`,
          holdMs: 100,
          check: () => {
            const state = turnTracker.state
            return state.stage === 'done' && state.direction === dogSign
          },
        },
        {
          id: 'salida',
          titulo: 'Salida por el nuevo lado',
          instruccion: `El perro quedó a tu ${sideName(newSide)}: señala la nueva línea con ese brazo.`,
          voz: `Ahora señala con tu brazo ${sideName(newSide)}.`,
          holdMs: 900,
          check: (m) => m[armFor(newSide)].extended && Math.abs(m.yaw) < 40,
        },
      ]
    },
  },
  {
    id: 'rear-cross',
    nombreEN: 'Rear Cross',
    nombreES: 'Cruce trasero',
    icono: '↩️',
    resumen: 'Cambias de lado cruzando POR DETRÁS del perro mientras él va comprometido adelante.',
    cuandoUsar: 'Cuando el perro es más rápido que tú y no alcanzas a cruzar de frente. Requiere que el perro sepa trabajar adelante de ti.',
    virtualDog: false,
    vozIntro: 'Cruce trasero. Paciencia: el perro pasa primero.',
    erroresComunes: [
      'Cruzar demasiado pronto: empujas al perro fuera de su línea antes de que se comprometa.',
      'Levantar los brazos durante el cruce: los brazos van BAJOS hasta que el perro aterriza.',
      'Frenarte junto al salto: el perro gira hacia ti y hace un spin.',
    ],
    buildPhases({ dogSign }) {
      const newSide = -dogSign
      return [
        {
          id: 'linea',
          titulo: 'Impulsa la línea',
          instruccion: `De frente, brazo ${sideName(dogSign)} bajo marcando la línea. El perro va adelante.`,
          voz: `Marca la línea con tu brazo ${sideName(dogSign)}, bajo.`,
          holdMs: 800,
          check: (m) => m.visible && Math.abs(m.yaw) < 40 && m[armFor(dogSign)].extended && !m[armFor(dogSign)].raised,
        },
        {
          id: 'cruce',
          titulo: 'Cruza por detrás',
          instruccion: `Desplázate hacia tu ${sideName(dogSign)}, cruzando la línea del perro por detrás, con los hombros al frente.`,
          voz: `Cruza hacia tu ${sideName(dogSign)}, hombros al frente.`,
          holdMs: 500,
          check: (m, tracker) => {
            const vel = tracker.hipVelocity()
            return vel !== null && vel * dogSign > 0.08 && Math.abs(m.yaw) < 55
          },
        },
        {
          id: 'cambio',
          titulo: 'Cambia la señal',
          instruccion: `Ya del otro lado: el perro queda a tu ${sideName(newSide)}. Señala con ese brazo.`,
          voz: `Cambia: señala con tu brazo ${sideName(newSide)}.`,
          holdMs: 900,
          check: (m) => m[armFor(newSide)].extended && Math.abs(m.yaw) < 50,
        },
      ]
    },
  },
  {
    id: 'blind-cross',
    nombreEN: 'Blind Cross',
    nombreES: 'Cruce ciego',
    icono: '🙈',
    resumen: 'Cambias de lado dándole la espalda al perro un instante, sin frenar tu carrera.',
    cuandoUsar: 'En líneas abiertas y rápidas donde no necesitas colección: mantiene tu velocidad. Reconecta de inmediato sobre el nuevo hombro.',
    virtualDog: false,
    vozIntro: 'Cruce ciego. Rápido y sin frenar.',
    erroresComunes: [
      'Usarlo en giros cerrados: el ciego NO pide colección, el perro salta largo.',
      'Tardar en reconectar por el nuevo hombro: pierdes al perro y puede tomar otro obstáculo.',
      'Cruzarte sobre la línea del perro: choque en la salida del obstáculo.',
    ],
    buildPhases({ dogSign, turnTracker }) {
      const newSide = -dogSign
      return [
        {
          id: 'posicion',
          titulo: 'Posición adelante',
          instruccion: `De frente, perro a tu ${sideName(dogSign)}, señal con ese brazo.`,
          voz: `De frente, señala con tu brazo ${sideName(dogSign)}.`,
          holdMs: 800,
          check: (m) => m.visible && Math.abs(m.yaw) < 35 && m[armFor(dogSign)].extended,
        },
        {
          id: 'giro-ciego',
          titulo: 'Giro de espaldas',
          instruccion: `Gira 360° ALEJÁNDOTE del perro (hacia tu ${sideName(newSide)}): la espalda le pasa de frente un instante.`,
          voz: `Gira hacia tu ${sideName(newSide)}, rápido.`,
          holdMs: 100,
          check: () => {
            const state = turnTracker.state
            return state.stage === 'done' && state.direction === newSide
          },
        },
        {
          id: 'reconexion',
          titulo: 'Reconexión inmediata',
          instruccion: `El perro quedó a tu ${sideName(newSide)}: reconecta y señala con ese brazo.`,
          voz: `Reconecta: brazo ${sideName(newSide)}.`,
          holdMs: 900,
          check: (m) => m[armFor(newSide)].extended && Math.abs(m.yaw) < 40,
        },
      ]
    },
  },
  {
    id: 'false-turn',
    nombreEN: 'False Turn',
    nombreES: 'Giro falso',
    icono: '🪃',
    resumen: 'Te "regresas" justo antes del despegue para que el perro colecte y aterrice girando hacia ti.',
    cuandoUsar: 'Antes de un salto seguido de giro cerrado de vuelta: si no avisas, la inercia dispara al perro largo. El timing lo es todo: la reversa va EN la ventana de despegue.',
    virtualDog: true,
    vozIntro: 'Giro falso. Todo está en el timing de tu reversa.',
    erroresComunes: [
      'Regresarte demasiado pronto: el perro rehúsa el salto o se despega de la línea.',
      'Regresarte tarde (cuando ya despegó sin aviso): aterriza largo y el giro sale ancho.',
      'Solo girar los hombros sin mover los pies: la señal fuerte es tu dirección de carrera.',
    ],
    buildPhases({ dogSign, reversalDetector }) {
      return [
        {
          id: 'aproximacion',
          titulo: 'Impulsa hacia el salto',
          instruccion: `Camina con decisión hacia tu ${sideName(dogSign)} (hacia el salto), señalando la línea.`,
          voz: `Avanza hacia tu ${sideName(dogSign)}.`,
          holdMs: 100,
          check: () => reversalDetector.state.stage !== 'waiting',
        },
        {
          id: 'reversa',
          titulo: 'La reversa',
          instruccion: 'Invierte tu dirección: pies y hombros de regreso por donde viniste.',
          voz: '¡Regresa ahora!',
          holdMs: 100,
          check: () => reversalDetector.state.stage === 'reversed',
        },
        {
          id: 'salida',
          titulo: 'Sostén la salida',
          instruccion: 'Sigue moviéndote en la nueva dirección: el perro aterriza girando hacia ti.',
          voz: 'Sostén la salida.',
          holdMs: 700,
          check: (m, tracker) => {
            const vel = tracker.hipVelocity()
            return vel !== null && vel * dogSign < -0.05
          },
        },
      ]
    },
  },
]

export const MANEUVERS_BY_ID = Object.fromEntries(MANEUVERS.map((m) => [m.id, m]))

// Glosario de manejo: los nombres reales con los que vas a encontrar todo en
// videos, seminarios y sistemas de handling (OneMind Dogs, Mecklenburg, etc.).
export const GLOSSARY = [
  { en: 'Front Cross', es: 'Cruce frontal', desc: 'Cambio de lado girando de frente al perro. Pide colección y giro.' },
  { en: 'Rear Cross', es: 'Cruce trasero', desc: 'Cambio de lado cruzando por detrás del perro comprometido adelante.' },
  { en: 'Blind Cross', es: 'Cruce ciego', desc: 'Cambio de lado dando la espalda un instante, sin perder velocidad.' },
  { en: 'False Turn', es: 'Giro falso', desc: 'Amago de regreso en la ventana de despegue: el perro colecta y aterriza girando hacia ti.' },
  { en: 'Post Turn / Shoulder Pull', es: 'Giro de poste', desc: 'Giras sobre tu eje jalando al perro alrededor tuyo, sin cambio de lado.' },
  { en: 'Wrap', es: 'Envuelta', desc: 'El perro envuelve el ala del salto girando lo más cerrado posible.' },
  { en: 'Serpentine', es: 'Serpentina', desc: 'Línea de saltos que el perro toma alternando lados mientras tú corres recto.' },
  { en: 'Threadle', es: 'Threadle', desc: 'El perro pasa ENTRE dos obstáculos hacia tu lado antes de tomar el siguiente.' },
  { en: 'Lead-Out Pivot', es: 'Pivote de salida', desc: 'Front cross estático: te adelantas desde la salida y pivotas cuando el perro se compromete.' },
  { en: 'Ketschker', es: 'Ketschker', desc: 'Híbrido: front cross que termina en giro ciego. Envuelve al perro muy cerrado.' },
  { en: 'Lead Change', es: 'Cambio de mano', desc: 'El perro cambia la pata que lidera su galope; tus cruces se lo piden.' },
  { en: '2-on-2-off', es: 'Dos abajo', desc: 'Criterio de contacto: dos patas en el suelo, dos en la rampa, hasta tu liberación.' },
  { en: 'Running Contact', es: 'Contacto corrido', desc: 'El perro pisa la zona a toda velocidad, sin frenar. Rápido y difícil de mantener.' },
]
