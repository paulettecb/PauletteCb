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
    grupo: 'esencial',
    virtualDog: true,
    virtualKind: 'giro',
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
    grupo: 'esencial',
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
    grupo: 'esencial',
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
    grupo: 'esencial',
    virtualDog: true,
    virtualKind: 'reversal',
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
  {
    id: 'post-turn',
    nombreEN: 'Post Turn / Shoulder Pull',
    nombreES: 'Giro de poste',
    icono: '🌀',
    resumen: 'Jalas al perro alrededor de tu cuerpo girando sobre tu eje, SIN cambiar de lado.',
    cuandoUsar: 'En giros hacia tu lado donde no necesitas cruce: el perro rodea tu cuerpo como un poste. Simple y confiable, aunque más lento que un front cross.',
    grupo: 'avanzada',
    virtualDog: false,
    vozIntro: 'Giro de poste. El perro rodea tu cuerpo, sin cambio de lado.',
    erroresComunes: [
      'Girar de más y convertirlo en front cross sin querer (cambias al perro de lado).',
      'Perder la conexión a mitad del giro: el perro se despega y sale ancho.',
      'Adelantar el hombro contrario: le cierras la línea al perro.',
    ],
    buildPhases({ dogSign }) {
      return [
        {
          id: 'posicion',
          titulo: 'Posición y señal',
          instruccion: `De frente, perro a tu ${sideName(dogSign)}, brazo ${sideName(dogSign)} marcando la línea.`,
          voz: `De frente, señala con tu brazo ${sideName(dogSign)}.`,
          holdMs: 800,
          check: (m) => m.visible && Math.abs(m.yaw) < 35 && m[armFor(dogSign)].extended,
        },
        {
          id: 'jala',
          titulo: 'Jala alrededor',
          instruccion: `Gira parcialmente HACIA tu ${sideName(dogSign)} (hasta quedar de perfil) manteniendo la señal: el perro te rodea.`,
          voz: `Gira hacia tu ${sideName(dogSign)}, hasta el perfil.`,
          holdMs: 700,
          check: (m) => {
            const toward = m.yaw * dogSign
            return toward > 50 && toward < 135
          },
        },
        {
          id: 'cierra',
          titulo: 'Cierra el giro',
          instruccion: `Regresa de frente: el perro sigue a tu ${sideName(dogSign)}, listo para la nueva línea.`,
          voz: 'Cierra el giro y retoma la línea.',
          holdMs: 800,
          check: (m) => Math.abs(m.yaw) < 30 && m[armFor(dogSign)].extended,
        },
      ]
    },
  },
  {
    id: 'wrap',
    nombreEN: 'Wrap',
    nombreES: 'Envuelta',
    icono: '🎀',
    resumen: 'Pides al perro envolver el ala del salto con el giro más cerrado posible.',
    cuandoUsar: 'Cuando después del salto la pista regresa: colección máxima. La señal es TODO antes del despegue: frenas, bajas y giras.',
    grupo: 'avanzada',
    virtualDog: false,
    vozIntro: 'Envuelta. Frena, baja y gira: colección máxima.',
    erroresComunes: [
      'Dar la señal cuando el perro ya despegó: envuelve ancho o tira la barra.',
      'No bajar la velocidad ni el cuerpo: sin colección no hay envuelta cerrada.',
      'Brazo alto (eso pide extensión): la envuelta se marca con brazo bajo.',
    ],
    buildPhases({ dogSign, reversalDetector }) {
      return [
        {
          id: 'aproxima',
          titulo: 'Aproxima al salto',
          instruccion: `Avanza con decisión hacia tu ${sideName(dogSign)}, marcando la línea al salto.`,
          voz: `Avanza hacia tu ${sideName(dogSign)}.`,
          holdMs: 100,
          check: () => reversalDetector.state.stage !== 'waiting',
        },
        {
          id: 'colecta',
          titulo: 'Colecta',
          instruccion: 'Frena y flexiona las rodillas: cuerpo pequeño = zancada corta.',
          voz: 'Frena y baja: colecta.',
          holdMs: 500,
          check: (m) => m.kneeMin !== null && m.kneeMin < 145,
        },
        {
          id: 'envuelve',
          titulo: 'Envuelve el ala',
          instruccion: `Gira hacia tu ${sideName(dogSign)} con el brazo bajo, dibujando la envuelta alrededor del ala.`,
          voz: `Gira hacia tu ${sideName(dogSign)}, brazo bajo.`,
          holdMs: 700,
          check: (m) => m.yaw * dogSign > 45 && !m[armFor(dogSign)].raised,
        },
      ]
    },
  },
  {
    id: 'serpentine',
    nombreEN: 'Serpentine',
    nombreES: 'Serpentina',
    icono: '🐍',
    resumen: 'El perro alterna lados sobre una línea de saltos mientras TÚ corres recto.',
    cuandoUsar: 'Líneas de 3+ saltos en zigzag: tú sostienes una línea recta y el manejo es puro cambio de brazo con hombros al frente.',
    grupo: 'avanzada',
    virtualDog: false,
    vozIntro: 'Serpentina. Tú recto: solo cambian los brazos.',
    erroresComunes: [
      'Girar los hombros en cada salto: rompes tu línea y frenas al perro.',
      'Cambiar el brazo tarde: el perro no encuentra el siguiente salto.',
      'Acercarte a los saltos: la serpentina se maneja desde la línea media.',
    ],
    buildPhases({ dogSign }) {
      const other = -dogSign
      return [
        {
          id: 'linea',
          titulo: 'Línea recta',
          instruccion: `Hombros al frente, brazo ${sideName(dogSign)} marcando el primer salto.`,
          voz: `Al frente, brazo ${sideName(dogSign)}.`,
          holdMs: 800,
          check: (m) => m.visible && Math.abs(m.yaw) < 25 && m[armFor(dogSign)].extended,
        },
        {
          id: 'cambio-1',
          titulo: 'Primer cambio',
          instruccion: `SIN girar los hombros, cambia la señal al brazo ${sideName(other)}.`,
          voz: `Cambia: brazo ${sideName(other)}, hombros quietos.`,
          holdMs: 800,
          check: (m) => Math.abs(m.yaw) < 25 && m[armFor(other)].extended && !m[armFor(dogSign)].extended,
        },
        {
          id: 'cambio-2',
          titulo: 'Segundo cambio',
          instruccion: `De vuelta al brazo ${sideName(dogSign)}, siempre de frente: ese es el ritmo de la serpentina.`,
          voz: `Otra vez: brazo ${sideName(dogSign)}.`,
          holdMs: 800,
          check: (m) => Math.abs(m.yaw) < 25 && m[armFor(dogSign)].extended && !m[armFor(other)].extended,
        },
      ]
    },
  },
  {
    id: 'threadle',
    nombreEN: 'Threadle',
    nombreES: 'Threadle',
    icono: '🪡',
    resumen: 'Llamas al perro a pasar ENTRE dos obstáculos hacia tu lado antes del siguiente.',
    cuandoUsar: 'Cuando la línea obvia es el salto de al lado y necesitas "enhebrar" al perro por el hueco. La llamada va antes de que aterrice del salto anterior.',
    grupo: 'avanzada',
    virtualDog: false,
    vozIntro: 'Threadle. Una llamada corta que enhebra al perro por el hueco.',
    erroresComunes: [
      'Girar de más: se convierte en post turn y pierdes el hueco.',
      'Llamar tarde (ya está en el aire hacia el salto equivocado).',
      'Señalar con el brazo contrario: la llamada threadle es del brazo del lado del perro.',
    ],
    buildPhases({ dogSign }) {
      return [
        {
          id: 'linea',
          titulo: 'Línea de llegada',
          instruccion: `De frente, brazo ${sideName(dogSign)} marcando la llegada del perro.`,
          voz: `De frente, brazo ${sideName(dogSign)}.`,
          holdMs: 800,
          check: (m) => m.visible && Math.abs(m.yaw) < 25 && m[armFor(dogSign)].extended,
        },
        {
          id: 'llamada',
          titulo: 'La llamada',
          instruccion: `Gira LIGERAMENTE hacia tu ${sideName(dogSign)} (solo un poco) manteniendo el brazo: eso jala al perro hacia el hueco.`,
          voz: 'Llamada corta: gira solo un poco.',
          holdMs: 800,
          check: (m) => {
            const toward = m.yaw * dogSign
            return toward > 15 && toward < 55 && m[armFor(dogSign)].extended
          },
        },
        {
          id: 'reenvia',
          titulo: 'Reenvía',
          instruccion: 'Vuelve de frente y reenvía al perro al siguiente obstáculo.',
          voz: 'Reenvía: de frente otra vez.',
          holdMs: 800,
          check: (m) => Math.abs(m.yaw) < 25 && m[armFor(dogSign)].extended,
        },
      ]
    },
  },
  {
    id: 'lead-out-pivot',
    nombreEN: 'Lead-Out Pivot',
    nombreES: 'Pivote de salida',
    icono: '🎯',
    resumen: 'Front cross estático: te adelantas desde la salida y pivotas cuando el perro se compromete.',
    cuandoUsar: 'Con un buen stay en la salida: te colocas adelante, sueltas al perro y pivotas EN TU LUGAR para recibirlo del otro lado.',
    grupo: 'avanzada',
    virtualDog: false,
    vozIntro: 'Pivote de salida. Todo el giro, cero pasos.',
    erroresComunes: [
      'Caminar durante el pivote: deja de ser estático y confunde la línea.',
      'Pivotar antes de que el perro se comprometa al primer salto.',
      'Soltar al perro con el movimiento en vez de con la palabra de liberación.',
    ],
    buildPhases({ dogSign, turnTracker }) {
      const newSide = -dogSign
      return [
        {
          id: 'estatico',
          titulo: 'Posición adelantada',
          instruccion: `Quieta, de frente, brazo ${sideName(dogSign)} hacia tu perro en la salida.`,
          voz: `Quieta, de frente, brazo ${sideName(dogSign)}.`,
          holdMs: 1000,
          check: (m, tracker) => {
            const vel = tracker.hipVelocity()
            return m.visible && Math.abs(m.yaw) < 30 && m[armFor(dogSign)].extended && vel !== null && Math.abs(vel) < 0.06
          },
        },
        {
          id: 'pivota',
          titulo: 'El pivote',
          instruccion: `Gira 360° HACIA tu ${sideName(dogSign)} SIN desplazarte: puro pivote sobre tu eje.`,
          voz: `Pivota hacia tu ${sideName(dogSign)}, sin moverte de lugar.`,
          holdMs: 100,
          check: (m, tracker) => {
            const state = turnTracker.state
            const vel = tracker.hipVelocity()
            return state.stage === 'done' && state.direction === dogSign && vel !== null && Math.abs(vel) < 0.1
          },
        },
        {
          id: 'recibe',
          titulo: 'Recibe al perro',
          instruccion: `El perro llega a tu ${sideName(newSide)}: recíbelo con ese brazo.`,
          voz: `Recibe con tu brazo ${sideName(newSide)}.`,
          holdMs: 900,
          check: (m) => m[armFor(newSide)].extended && Math.abs(m.yaw) < 40,
        },
      ]
    },
  },
  {
    id: 'ketschker',
    nombreEN: 'Ketschker (German Turn)',
    nombreES: 'Ketschker',
    icono: '🌪️',
    resumen: 'Híbrido veloz: front cross que remata en ciego, envolviendo al perro cerradísimo.',
    cuandoUsar: 'Envueltas agresivas junto al ala: el giro completo y CONTINUO hacia el perro lo enrolla y te deja saliendo a máxima velocidad.',
    grupo: 'avanzada',
    virtualDog: true,
    virtualKind: 'giro',
    vozIntro: 'Ketschker. Un solo giro continuo y veloz hacia tu perro.',
    erroresComunes: [
      'Girar lento o en dos tiempos: pierde el efecto envolvente.',
      'Girar alejándote del perro: eso es otra cosa (y lo pierdes de vista dos veces).',
      'Usarlo lejos del ala: el ketschker vive pegado al salto.',
    ],
    buildPhases({ dogSign, turnTracker }) {
      const newSide = -dogSign
      return [
        {
          id: 'posicion',
          titulo: 'Posición junto al ala',
          instruccion: `De frente, perro a tu ${sideName(dogSign)}, señal con ese brazo.`,
          voz: `De frente, brazo ${sideName(dogSign)}.`,
          holdMs: 800,
          check: (m) => m.visible && Math.abs(m.yaw) < 35 && m[armFor(dogSign)].extended,
        },
        {
          id: 'giro-completo',
          titulo: 'Giro continuo',
          instruccion: `Gira 360° HACIA tu ${sideName(dogSign)} en un solo movimiento fluido y rápido.`,
          voz: `Gira completo hacia tu ${sideName(dogSign)}, rápido y fluido.`,
          holdMs: 100,
          check: () => {
            const state = turnTracker.state
            if (state.stage !== 'done' || state.direction !== dogSign) return false
            return state.finishT !== null && state.startT !== null && state.finishT - state.startT < 2400
          },
        },
        {
          id: 'latigazo',
          titulo: 'Salida látigo',
          instruccion: `Sal disparada por la nueva línea, señal con el brazo ${sideName(newSide)}.`,
          voz: `Sal con tu brazo ${sideName(newSide)}.`,
          holdMs: 800,
          check: (m) => m[armFor(newSide)].extended && Math.abs(m.yaw) < 45,
        },
      ]
    },
  },
  {
    id: 'tandem-turn',
    nombreEN: 'Tandem Turn',
    nombreES: 'Giro tándem',
    icono: '🫱',
    resumen: 'Cruce por detrás en pleno giro abierto, con una señal de brazo grande y visible.',
    cuandoUsar: 'Giros abiertos alejándose de ti donde llegas tarde para un front: cruzas por detrás en la curva con un brazo alto que el perro ve claramente.',
    grupo: 'avanzada',
    virtualDog: false,
    vozIntro: 'Giro tándem. Cruce por detrás con señal grande.',
    erroresComunes: [
      'Hacerlo de frente al perro: el tándem es un cruce por DETRÁS en el giro.',
      'Señal tímida: el brazo del tándem es grande para leerse a distancia.',
      'Cruzar antes de que el perro se comprometa a la curva.',
    ],
    buildPhases({ dogSign }) {
      const newSide = -dogSign
      return [
        {
          id: 'linea',
          titulo: 'Línea del giro',
          instruccion: `De frente, brazo ${sideName(dogSign)} BAJO marcando la curva.`,
          voz: `Marca la curva con tu brazo ${sideName(dogSign)}, bajo.`,
          holdMs: 800,
          check: (m) => m.visible && Math.abs(m.yaw) < 40 && m[armFor(dogSign)].extended && !m[armFor(dogSign)].raised,
        },
        {
          id: 'cruza',
          titulo: 'Cruza en la curva',
          instruccion: `Desplázate hacia tu ${sideName(dogSign)} cruzando la línea por detrás, hombros al frente.`,
          voz: `Cruza hacia tu ${sideName(dogSign)}.`,
          holdMs: 500,
          check: (m, tracker) => {
            const vel = tracker.hipVelocity()
            return vel !== null && vel * dogSign > 0.08 && Math.abs(m.yaw) < 55
          },
        },
        {
          id: 'senal-tandem',
          titulo: 'Señal tándem',
          instruccion: `Levanta el brazo ${sideName(newSide)} bien visible: esa es la firma del tándem.`,
          voz: `¡Brazo ${sideName(newSide)} arriba, grande!`,
          holdMs: 700,
          check: (m) => m[armFor(newSide)].extended && m[armFor(newSide)].raised,
        },
      ]
    },
  },
]

export const MANEUVERS_BY_ID = Object.fromEntries(MANEUVERS.map((m) => [m.id, m]))

export const MANEUVER_GROUPS = [
  { id: 'esencial', titulo: 'Esenciales', descripcion: 'Los 4 cruces con los que corres el 95% de cualquier pista.' },
  { id: 'avanzada', titulo: 'Avanzadas', descripcion: 'Giros, envueltas y llamadas para líneas técnicas.' },
]

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
  { en: 'Tandem Turn', es: 'Giro tándem', desc: 'Cruce por detrás en pleno giro abierto, con señal de brazo grande.' },
  { en: 'Lap Turn', es: 'Lap turn', desc: 'El perro rodea tu cuerpo por delante y sale en dirección opuesta; útil en threadles cerrados.' },
  { en: 'Double Lap Turn', es: 'Doble lap turn', desc: 'Lap turn con media vuelta extra para invertir la dirección por completo.' },
  { en: 'Reverse Spin', es: 'Giro invertido', desc: 'Giro completo del guía sobre su eje para colectar y redirigir al perro alrededor tuyo.' },
  { en: 'Jaakko Turn', es: 'Jaakko', desc: 'Envuelta avanzada del sistema OneMind: el perro envuelve el ala alejándose de ti, a máxima velocidad.' },
  { en: 'Whisky Turn', es: 'Whisky', desc: 'Prima del Jaakko en OneMind: envuelta alejándose, por la variante contraria.' },
  { en: 'Flick', es: 'Flick', desc: 'Señal corta OneMind para mandar al perro a envolver alejándose de ti.' },
  { en: 'Lead Change', es: 'Cambio de mano', desc: 'El perro cambia la pata que lidera su galope; tus cruces se lo piden.' },
  { en: '2-on-2-off', es: 'Dos abajo', desc: 'Criterio de contacto: dos patas en el suelo, dos en la rampa, hasta tu liberación.' },
  { en: 'Running Contact', es: 'Contacto corrido', desc: 'El perro pisa la zona a toda velocidad, sin frenar. Rápido y difícil de mantener.' },
]
