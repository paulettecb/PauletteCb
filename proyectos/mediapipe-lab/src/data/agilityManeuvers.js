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

// Glosario de manejo: TODAS las maniobras con descripción completa y ejecutable.
// Las entradas con `entrenable` apuntan a la maniobra que se practica con cámara;
// las demás traen todo lo necesario para ejecutarlas solo leyendo (sin cámara).
export const GLOSSARY = [
  {
    en: "Front Cross",
    es: "Cruce frontal",
    desc: "Cambio de lado por delante del perro: giras de frente a él, sin perderlo de vista ni un segundo.",
    entrenable: "front-cross",
    queEs: "Es el cambio de lado más usado en agility: tú cruzas la línea del perro por delante de él, girando siempre con el pecho hacia él. El perro te ve durante toda la rotación y pasa de tu lado izquierdo a tu derecho (o al revés). Tú haces todo el trabajo del giro; el perro solo lee tu rotación y ajusta su curva.",
    comoSeHace: [
      "Gana ventaja primero: necesitas llegar al punto de cruce antes que Kenna. Si van empatadas, el front no es opción ese día; escoge rear o blind.",
      "Colócate en el punto exacto donde quieres que el perro gire, con él viniendo hacia ti por un lado (digamos tu izquierdo) y tu brazo izquierdo señalando el obstáculo que va a tomar.",
      "Timing: la información completa debe llegarle al perro ANTES de que despegue hacia el salto donde gira. Empieza a rotar en cuanto se comprometa al obstáculo anterior; si esperas a que aterrice, ya vas tarde.",
      "Rota hacia el perro: gira sobre tus pies pasando el pecho frente a su cara, sin darle nunca la espalda. Si lo traes a la izquierda, rotas hacia tu izquierda. Cuánto rotas depende del ángulo del giro; en un giro de 90 grados del perro ronda los 270.",
      "A la mitad de la rotación cambia de brazo: baja el brazo viejo y levanta el nuevo (el que queda del lado del perro) apuntando a la nueva línea.",
      "Termina el giro ya corriendo en la nueva dirección, con el perro en tu otro lado. No te quedes parada viendo si funcionó: tu arranque es parte de la señal.",
    ],
    cuandoUsar: "Cuando puedes ganarle al perro al punto de cruce y quieres un giro cerrado con máximo control; el front te deja manejando por el interior de la curva.",
    claves: [
      "El giro se ejecuta ANTES de que el perro llegue al punto, no cuando llega. Front tardío es la falla número uno en pista.",
      "Pecho hacia el perro durante TODA la rotación: si tu espalda pasa frente a él aunque sea un instante, ya le vendiste un blind cross.",
      "Haz el cruce en el punto donde quieres el giro del perro, no donde te quedó cómodo pararte; medio metro de diferencia cambia toda su línea.",
      "Variante entre sistemas: OneMind Dogs suele marcar un paso hacia el punto de aterrizaje del perro antes de rotar; el estilo Derrett prioriza la rotación continua de hombros. Ambas funcionan si la señal llega antes del despegue.",
    ],
    errores: [
      "Girar tarde: el perro aterriza y te encuentra a medio giro, frena en seco o se pasa de largo por tu lado viejo.",
      "Cruzar pegada al obstáculo y bloquear la línea de aterrizaje: el perro te esquiva o chocan.",
      "Quedarte estática después de rotar: el perro lee tu freno como señal de colección y pierde velocidad sin necesidad.",
    ],
  },
  {
    en: "Rear Cross",
    es: "Cruce trasero",
    desc: "Cambio de lado por detrás: el perro va adelante comprometido y tú cruzas su línea a sus espaldas.",
    entrenable: "rear-cross",
    queEs: "Cambias de lado cruzando la línea del perro por detrás de él, mientras él ya va comprometido hacia el obstáculo. El perro aterriza girando alejándose de ti: si lo llevas a tu izquierda, gira a la derecha (y queda en tu derecha). Exige un perro que trabaje adelante sin voltearte a ver; tu trabajo es avisar el giro con presión sobre su línea antes de cruzar.",
    comoSeHace: [
      "Manda al perro adelante hacia el obstáculo con el brazo del lado en que lo traes, con tu voz de 'sigue' si la usan, mientras tú corres en diagonal convergiendo hacia su línea.",
      "Presiona la línea: converge en diagonal hacia la línea del perro, apuntando a su punto de despegue. Esa convergencia previa es la verdadera señal de que viene un giro.",
      "Timing del cruce: pasa por detrás de él justo cuando despega hacia el obstáculo. Ni una zancada antes: si cruzas sin que esté comprometido, se voltea o se saca del salto.",
      "Al cruzar, tus hombros y tu nuevo brazo (el que queda del lado del perro al aterrizar) apuntan ya a la nueva dirección; tú quedas del lado contrario al giro.",
      "Sal acelerando por la nueva línea; el perro aterriza girando lejos de ti y te recoge en su nuevo lado.",
    ],
    cuandoUsar: "Cuando el perro te gana la carrera y no llegas a un front, o cuando conviene que él vaya adelante a toda velocidad: rectas rápidas donde tú manejas desde atrás.",
    claves: [
      "Regla de oro: el perro se compromete primero, tú cruzas después. Si tu cruce llega antes que su compromiso, tú lo sacaste del obstáculo, no él.",
      "La señal real es la convergencia hacia su línea ANTES del cruce; sin esa presión previa, el perro aterriza derecho y el giro te sale dos zancadas tarde.",
      "Con una Border Collie como Kenna, primero blinda el 've adelante': el rear se derrumba si el perro te voltea a ver buscando información.",
      "Entrena el giro alejándose de ti en plano (sin obstáculos, con premio lanzado) antes de meterlo a saltos.",
    ],
    errores: [
      "Cruzar demasiado pronto: el perro gira antes del salto o hace un spin (vuelta completa) frente al obstáculo.",
      "Frenarte al momento de cruzar: el perro lee tu desaceleración como duda y rehúsa o frena.",
      "Cruzar sin haber convergido antes: el perro aterriza sin saber que había giro y la curva sale ancha y lenta.",
    ],
  },
  {
    en: "Blind Cross",
    es: "Cruce ciego",
    desc: "Cambio de lado por delante dándole la espalda al perro un instante; lo recibes con el otro brazo.",
    entrenable: "blind-cross",
    queEs: "Como el front cross, cruzas por delante de la línea del perro, pero en lugar de rotar de frente a él, giras dándole la espalda: pierdes el contacto visual una fracción de segundo y lo 'recoges' con el otro brazo. Es el cruce más rápido porque nunca frenas tu carrera. El perro cambia de lado leyendo tu nuevo hombro y tu nueva mano.",
    comoSeHace: [
      "Igual que en el front, necesitas ventaja: tu cuerpo debe cruzar la línea del perro antes de que él llegue a ese punto.",
      "Corre cruzando su línea sin bajar el ritmo. En el punto de cruce cambia la cabeza: deja de mirarlo por encima de un hombro y búscalo por encima del otro.",
      "Simultáneo al cambio de cabeza, cambia de brazo: baja el viejo y levanta el nuevo del lado por donde va a aparecer el perro, señalando la nueva línea.",
      "Timing: ejecuta el cambio mientras el perro está en el aire o comprometido al obstáculo anterior, para que aterrice ya leyendo tu nuevo brazo.",
      "Reconecta de inmediato: en cuanto lo veas por el nuevo hombro, tu brazo nuevo le confirma el lado y ambos siguen a toda velocidad.",
    ],
    cuandoUsar: "Cuando necesitas velocidad y la línea del perro es recta o abierta: es el cruce que no te frena. Brilla saliendo de túneles, donde ejecutas el cambio mientras el perro va adentro y al salir ya te ve del lado nuevo.",
    claves: [
      "La diferencia física con el front: aquí tu espalda pasa frente al perro. Debe ser elección consciente, no un front que se te chorreó.",
      "Cambio de cabeza y de brazo nítidos y al mismo tiempo: si dudas, el perro no sabe a qué lado ir y se te mete por atrás.",
      "El blind premia al perro que corre hacia tu mano: entrénalo primero en plano, tú caminando y cambiando de mano con premio en la mano nueva.",
      "Por diseño mantiene velocidad, no cierra giros: para giro cerrado suele convenir el front. (Y ojo: en el sistema Derrett clásico el blind se evitaba; hoy es estándar en los sistemas de estilo europeo.)",
    ],
    errores: [
      "Hacerlo sin ventaja: el perro te alcanza a media espalda y te rebasa por el lado viejo.",
      "Seguir mirando al frente sin reconectar por el nuevo hombro: el perro no encuentra tu mano y se cruza detrás de ti.",
      "Abusar de él en giros cerrados: sale un giro ancho y lento donde un front habría cerrado la curva.",
    ],
  },
  {
    en: "False Turn",
    es: "Giro falso",
    desc: "Amago de front cross para colectar al perro o cerrar su línea hacia ti, sin cambiar de lado.",
    entrenable: "false-turn",
    queEs: "Es un amago de front cross: rotas brevemente hacia el perro como si fueras a cruzar, él responde colectando y curvando su línea hacia ti, y entonces deshaces la rotación y sigues por la misma línea y el mismo lado. Sirve para jalar la línea del perro o quitarle velocidad sin cambio de lado. El nombre viene de OneMind Dogs; en otros sistemas lo verás como RFP (reverse flow pivot), que es prácticamente la misma maniobra.",
    comoSeHace: [
      "Vas corriendo con el perro a un lado (digamos el izquierdo) y ves venir un problema: un obstáculo trampa en su línea natural o un giro que necesita colección.",
      "Rota pecho y hombros hacia el perro, como si iniciaras un front cross, dando uno o dos pasos en diagonal hacia él o ligeramente hacia atrás.",
      "Observa la respuesta: el perro acorta la zancada, gira la cabeza hacia ti y su línea se curva hacia tu cuerpo. Esa es la reacción que estabas comprando.",
      "En cuanto la veas, deshaz el amago: rota de regreso a la dirección original y retoma tu carrera con el perro en el mismo lado de siempre.",
      "Timing: el amago va cuando el perro está en el aire o entre obstáculos, con espacio suficiente para que reaccione ANTES del punto de decisión (la trampa).",
    ],
    cuandoUsar: "Para librar trampas: cuando hay un obstáculo incorrecto en la línea natural del perro y necesitas jalarlo hacia ti sin cambiar de lado. También para meter colección antes de un giro cerrado.",
    claves: [
      "Es amago, no giro: si sostienes la rotación de más, el perro te lee front cross completo y te cambia de lado cuando no querías.",
      "Deshaz en cuanto veas la respuesta (zancada corta, cabeza hacia ti); esperar 'tantito más' es lo que arruina la maniobra.",
      "Dosifica la rotación: a veces bastan unos grados de hombros. Empieza pequeño con Kenna y sube solo si no responde.",
      "No lo confundas con el reverse spin: ahí el guía completa una vuelta entera para cerrar el giro; en el false turn solo insinúas la rotación y la deshaces, sin vuelta completa ni cambio de lado.",
    ],
    errores: [
      "Sostener el amago demasiado tiempo: el perro cambia de lado o se te pega y pierdes la línea que seguía.",
      "Hacerlo tarde, con el perro ya comprometido a la trampa: solo logras que tire la barra o frene feo.",
      "Rotar únicamente el brazo con los hombros fijos al frente: el perro lee hombros, no manos, y no pasa nada.",
    ],
  },
  {
    en: "Post Turn / Shoulder Pull",
    es: "Giro de poste",
    desc: "Giro sin cambio de lado: el perro rodea tu cuerpo como si fueras un poste, siguiendo tus hombros.",
    entrenable: "post-turn",
    queEs: "El perro gira hacia tu lado dando la vuelta alrededor de tu cuerpo, siguiendo la rotación de tus hombros, y termina en el mismo lado en que venía. Tú eres el poste: pivoteas sobre tu eje mientras tu brazo y tu pecho le marcan la curva. Es la forma más básica de girar 'hacia ti' y la base de todo lo demás.",
    comoSeHace: [
      "Escenario: el perro viene por tu lado derecho y el giro de la pista es hacia la derecha, es decir, hacia tu cuerpo.",
      "Antes del punto de giro, desacelera un paso y baja un poco el brazo: esa bajada de ritmo le anuncia al perro que viene curva y lo hace colectar.",
      "Rota hombros y pecho hacia la derecha, pivoteando sobre tus pies con pasos cortos, mientras tu brazo derecho (el del perro) va dibujando la curva.",
      "El perro orbita a tu alrededor, pegado a tu mano derecha; tu mirada lo acompaña todo el tiempo por encima de tu hombro derecho.",
      "Termina la rotación con hombros y pies apuntando a la nueva dirección y reacelera de inmediato; el perro sigue en tu derecha, listo para la siguiente línea.",
    ],
    cuandoUsar: "En cualquier curva hacia el lado donde ya traes al perro, cuando no necesitas cambiar de mano. Es tu giro default de principiante y sigue siendo útil toda la carrera deportiva.",
    claves: [
      "El perro lee tus hombros, no tu mano: sin rotación de pecho no hay giro, por más que agites el brazo.",
      "La desaceleración previa es parte de la señal; entrar a tope y girar de golpe deja al perro abierto y atrás de la curva.",
      "El post turn manda al perro por fuera de ti, así que su curva es más larga: si necesitas giro cerrado y rápido, ahí van front o blind.",
      "El 'shoulder pull' es la versión suave en plena carrera: rotas los hombros solo unos grados para curvar la línea del perro hacia ti sin pivotar completo.",
    ],
    errores: [
      "Girar solo la cabeza o el brazo con los hombros al frente: el perro sigue derecho y te pasas la entrada.",
      "Pivotar demasiado rápido: el perro se queda atrás y termina cortando por detrás de ti en vez de rodear.",
      "No reacelerar al salir del giro: el perro se queda colectado y pierdes segundos que el cronómetro sí cuenta.",
    ],
  },
  {
    en: "Tandem Turn",
    es: "Giro tándem",
    desc: "Cambio de lado por detrás en el aterrizaje o en plano: el perro gira alejándose de ti tras el obstáculo.",
    entrenable: "tandem-turn",
    queEs: "Es un cambio de lado por detrás del perro que se señala en el lado de aterrizaje del obstáculo o en plano entre obstáculos, no en el despegue. El perro gira alejándose de ti y tú cruzas su línea por atrás justo en el punto del giro, yendo casi hombro con hombro con él. Piénsalo como el primo del rear cross: el rear se avisa antes del obstáculo; el tándem, después.",
    comoSeHace: [
      "Corres con el perro a tu lado (digamos el izquierdo) y el giro es hacia afuera, alejándose de ti (hacia la izquierda).",
      "Llega al punto de giro pareja con el perro: el tándem funciona cuando van casi hombro con hombro, no con él muy adelantado ni muy atrás.",
      "En el punto exacto del giro (el aterrizaje del salto o la zancada donde quieres el cambio), baja el brazo cercano al perro y cruza el brazo lejano frente a tu cuerpo señalando la nueva dirección, girando los hombros hacia la nueva línea.",
      "Da el paso de cruce por detrás de su cola justo cuando su cabeza empieza a girar; tus pies cambian a la nueva línea en esa misma zancada.",
      "Sal acelerando en la nueva dirección con el perro ahora en tu lado derecho; los perros suelen ganar velocidad saliendo de un tándem bien hecho.",
    ],
    cuandoUsar: "En giros de 90 grados o más alejándose de ti después de un salto o en plano, cuando vas a la par del perro y no tienes ventaja para un front. Es un giro que imprime velocidad de salida.",
    claves: [
      "La diferencia con el rear: en el rear el perro va adelante y la señal cae antes del obstáculo; en el tándem van parejos y la señal cae en el aterrizaje o en plano. Algunos sistemas lo describen simplemente como rear cross del lado de aterrizaje.",
      "Hay dos escuelas de brazo: cruzar el brazo lejano frente al cuerpo o señalar con el brazo cercano empujando la línea. Escoge una y sé consistente; a Kenna le da igual cuál, pero no soporta que alternes.",
      "Enséñalo primero en plano y caminando: perro al lado, señal, giro alejándose y premio lanzado en la nueva dirección. Luego súbele velocidad, luego mete el salto.",
    ],
    errores: [
      "Señalar antes del despegue: el perro lo lee como rear cross y gira antes del obstáculo o tira la barra.",
      "Intentarlo con el perro muy adelantado: no ve la señal, no hay giro, y te quedas cruzando sola.",
      "Girar los hombros hacia el perro y frenarte en lugar de empujar hacia la nueva línea: eso es señal de pull/post turn y lo jala hacia ti, exactamente al revés de lo que querías.",
    ],
  },
  {
    en: "Lead Change",
    es: "Cambio de mano",
    desc: "El cambio de pata líder del galope del perro al cambiar de dirección; es concepto, no maniobra tuya.",
    entrenable: null,
    queEs: "En el galope, el perro siempre lidera con una pata delantera: la derecha si curva a la derecha, la izquierda si curva a la izquierda. El cambio de mano es cuando cambia de pata líder para cambiar de dirección, casi siempre en un momento de suspensión: en el aire sobre un salto o en una zancada. No es algo que tú ejecutes; es lo que tu manejo provoca (o entorpece) en el cuerpo del perro.",
    comoSeHace: [
      "Aprende a verlo: graba a Kenna galopando en círculo y revisa en cámara lenta. La pata delantera que aterriza al final y se estira más adelante es la líder.",
      "Da tus señales de giro antes del despegue: si el perro conoce la dirección al saltar, hace el cambio de mano en el aire y aterriza ya en la pata correcta, girando.",
      "Reconoce la señal tardía: si el perro aterriza derecho y luego gira, aterrizó en la pata equivocada y necesitó una o dos zancadas extra para cambiar. Eso es curva ancha y tiempo regalado.",
      "Usa los cruces como generadores de cambios: cada front, blind o rear bien cronometrado produce un cambio de mano limpio en el aire.",
      "En plano, mandan tus hombros: una rotación clara y a tiempo le permite meter el cambio en la siguiente zancada de suspensión.",
    ],
    cuandoUsar: "Úsalo como lente para evaluar tu timing en video: si Kenna aterriza ya girando hacia la nueva dirección, tus señales llegaron a tiempo; si aterriza derecha y luego corrige, llegaste tarde.",
    claves: [
      "Regla práctica: información antes del despegue = cambio en el aire; información después del despegue = zancadas extra y giro ancho.",
      "Los giros anchos casi nunca son terquedad del perro: suelen ser cambios de mano tardíos causados por señales tardías del guía.",
      "Ver esto una sola vez en cámara lenta te recalibra el ojo para siempre; son cinco minutos muy bien invertidos.",
    ],
    errores: [
      "Culpar al perro ('no quiere girar cerrado') cuando la señal llegó después del despegue.",
      "Fijarte solo en a dónde va el perro y no en cómo aterriza: el aterrizaje es el veredicto de tu timing.",
      "Machacar giros cerrados repetidos sin calentar: los cambios de mano constantes cargan hombros y carpos del perro.",
    ],
  },
  {
    en: "Lead-Out",
    es: "Salida adelantada",
    desc: "Dejas al perro en quieto en la línea de salida, te adelantas dentro de la pista y luego lo liberas.",
    entrenable: null,
    queEs: "Es empezar el recorrido con ventaja: colocas al perro en un quieto (sentado o parado) antes del primer obstáculo, caminas tú sola hasta tu posición de manejo dentro de la pista, y desde ahí lo liberas con tu palabra de salida. Te regala metros que ya no tendrás que correr y te deja empezar posicionada para el primer giro o cruce. Depende al cien por ciento de un quieto sólido.",
    comoSeHace: [
      "Coloca al perro derecho y alineado con el primer salto: su nariz apuntando al obstáculo, no a ti. Da tu señal de quieto una sola vez.",
      "Camina hacia tu posición con calma y decisión, mirando hacia dónde vas con vistazos al perro; salir corriendo o dudando invita a que rompa.",
      "Párate en tu posición (típicamente a la altura del salto 2 o 3, del lado por donde vas a manejar), con hombros y pies apuntando a la línea que quieres que corra el perro.",
      "Conecta: gira la cabeza y míralo por encima del hombro del lado donde va a pasar, con ese brazo extendido marcando su línea.",
      "Libéralo con tu palabra de salida ('ok', 'go', 'ya'), no con tu movimiento, y arranca a correr justo después de soltarla, nunca antes.",
    ],
    cuandoUsar: "En casi cada salida de competencia, sobre todo si el perro es más rápido que tú (con Kenna, cuenta con ello). Te permite manejar la apertura del recorrido en vez de perseguirla desde el salto uno.",
    claves: [
      "La palabra libera, no tu cuerpo: si el perro sale cuando te mueves, el quieto está roto y hay que reentrenarlo antes de volver a competir con lead-out.",
      "No te adelantes más de lo que tu quieto aguanta hoy: un lead-out corto y confiable vale más que uno largo que revienta la salida.",
      "Alinea al perro con el obstáculo, no contigo: perro sentado chueco sale chueco y tira la barra del uno.",
      "En entrenamiento, paga el quieto con frecuencia (regresa y premia en posición) para que esperar también tenga premio, no solo salir.",
    ],
    errores: [
      "Caminar de espaldas mirando fijo al perro todo el trayecto: lo presionas, tardas más y llegas mal parada a tu posición.",
      "Liberar con el arranque de tu carrera en lugar de la palabra: enseñas al perro a adivinar tu movimiento y a romper.",
      "Dejar que el perro continúe el recorrido después de una salida en falso: acabas de premiar romper el quieto. Regrésalo sin drama y repite.",
    ],
  },
  {
    en: "Wrap",
    es: "Envuelta",
    desc: "Giro cerrado de 180° alrededor del ala del salto, con el perro recogido en vez de extendido.",
    entrenable: "wrap",
    queEs: "El perro toma el salto en colección y gira pegado al ala (el costado del salto), saliendo casi en dirección opuesta a la que traía. Tú se lo avisas ANTES del despegue con desaceleración, rotación de hombros y brazo hacia el ala. Es la base de casi todos los giros avanzados de esta lista.",
    comoSeHace: [
      "Dos o tres zancadas antes del salto, frena: pasos cortos, peso hacia atrás. Kenna lee tu desaceleración como \"viene giro\" y acorta su zancada.",
      "Gira los hombros hacia el ala por donde quieres la envuelta: tu pecho deja de apuntar al frente y apunta al ala.",
      "Baja el brazo del lado del giro y señala la base del ala, no el cielo. Tu mirada va al ala y al punto de aterrizaje, no al fondo de la pista.",
      "Da tu verbal de envuelta (\"wrap\", \"cierra\", el que elijas) antes de que despegue: la información tiene que llegarle con las patas todavía en el piso.",
      "Cuando aterrice girando, tus hombros y brazo ya apuntan a la nueva línea; arranca hacia el siguiente obstáculo sin esperarla.",
    ],
    cuandoUsar: "Cuando después del salto la línea regresa o gira fuerte (más de ~90°): envolver evita que el perro aterrice largo y pierdas dos metros. Es la opción habitual en los 180°.",
    claves: [
      "La diferencia entre la buena y la chafa es el timing: si el cue llega cuando ya despegó, salta largo y el giro sale abierto. Todo se decide antes del despegue.",
      "Un verbal distinto para cada lado (dos palabras diferentes) vale oro con una Border Collie: Kenna lo aprende rápido y te dará giros más cerrados que cualquier brazo.",
      "Al entrenarla, premia pegado al ala: tira el premio sobre la línea de salida del giro, nunca hacia adelante.",
    ],
    errores: [
      "Correr a tope hasta el salto y \"avisar\" cuando el perro ya va en el aire.",
      "Señalar el ala con el brazo pero dejar hombros y pies apuntando al frente: el cuerpo grita más fuerte que el brazo.",
      "Pararte tan pegada al ala que el perro no cabe para girar.",
    ],
  },
  {
    en: "Ketschker",
    es: "Ketschker",
    desc: "Envuelta con cambio de lado: inicias como front cross y rematas con blind cross mientras el perro salta.",
    entrenable: "ketschker",
    queEs: "Es una envuelta con cambio de mano: cueas el giro con el brazo contrario elevado, como si fueras a hacer front cross, y en cuanto el perro se compromete al salto giras de espaldas (blind cross) y sales corriendo por la nueva línea. El perro envuelve el ala apretado y te alcanza en tu otra mano. También lo verás nombrado como \"German turn\".",
    comoSeHace: [
      "Llega cerca del ala de despegue con Kenna en tu derecha, frenando un poco para avisar colección.",
      "Cue de envuelta: levanta tu brazo izquierdo (el contrario) hacia el salto, alto, cruzando sobre el ala, y gira el pecho hacia el poste con un pequeño balanceo del peso hacia atrás. Eso le dice \"recógete y envuelve aquí\".",
      "En cuanto esté comprometida o despegando —nunca antes— gira de espaldas a ella hacia tu izquierda: la cabeza voltea sobre el hombro izquierdo. Ese es el blind.",
      "Tu primer paso ya va en la nueva dirección, con la mano izquierda baja y la mirada buscándola sobre ese hombro.",
      "Ella aterriza envolviendo el ala y te toma en la mano nueva; como no hay pasos de front cross, sales con ventaja de velocidad.",
    ],
    cuandoUsar: "Cuando necesitas envuelta cerrada CON cambio de lado y quieres salir corriendo ya: típico donde un front cross te dejaría plantada o sin tiempo para los pies.",
    claves: [
      "El blind va cuando el perro ya está comprometido o en el aire; si giras antes de que despegue, lo jalas hacia ti y puede rodear el salto (runout).",
      "El brazo contrario alto es el corazón del cue: sin él, el perro solo ve un blind y sale largo en vez de envolver.",
      "Diferencia con el Jaakko: el Ketschker cambia de mano; el Jaakko te deja en la misma. Si dudas cuál hiciste, revisa en qué mano acabó el perro.",
      "Variante: hay quien lo ejecuta como blind puro con el brazo alto, sin insinuar el front; si el perro ya domina la envuelta por verbal, el efecto es prácticamente el mismo.",
    ],
    errores: [
      "Girar de espaldas demasiado pronto, con el perro aún en el piso: barra tirada o rodeo del salto.",
      "Salir corriendo sin reconectar la mirada sobre el hombro nuevo: el perro aterriza sin saber qué mano tomar.",
      "Usarlo donde un front cross normal daba línea recta: el Ketschker es para envueltas cerradas, no para todo.",
    ],
  },
  {
    en: "Lap Turn",
    es: "Lap turn",
    desc: "El perro viene de frente y tu mano baja gira su nariz 180° frente a tu cuerpo; tú sigues avanzando.",
    entrenable: null,
    queEs: "Es un giro donde quien gira es el perro, no tú: Kenna viene de frente hacia ti, tu mano baja \"atrapa\" su nariz y la voltea 180° justo delante de tu cuerpo, alejándola de ti, mientras tú sigues caminando. Sustituye al front cross cuando vas atrás o no hay espacio para rotar. OneMind Dogs la tiene en su catálogo y pide enseñarla primero en el piso.",
    comoSeHace: [
      "Kenna viene de frente (saliendo del túnel, por ejemplo) y necesitas regresarla 180°. Camina hacia ella con el pecho apuntando a su nariz.",
      "Antes de que llegue, baja la mano del lado por donde quieres que salga, pegada a tu muslo —no estirada al frente— a la altura de su nariz.",
      "Cuando su nariz esté a un palmo de tu mano, gira la muñeca dibujando una U pequeña hacia afuera de tu cuerpo: su nariz sigue la mano y su cuerpo rota alejándose de ti.",
      "En el instante en que su cabeza empieza a girar, tú sigues avanzando y pasas junto a ella. Si te frenas, gira hacia ti y la maniobra se muere.",
      "Termina con ella a tu lado viendo en tu misma dirección: levanta ese brazo hacia el siguiente obstáculo y da el verbal.",
    ],
    cuandoUsar: "Cuando el perro viene de frente hacia ti (salida de túnel, después de un pull) y hay que invertir su dirección estando tú atrás, estática o sin espacio para un front cross.",
    claves: [
      "Mano junto al cuerpo, no adelante: OneMind lo repite por algo. La mano al frente jala al perro hacia ti en vez de girarlo.",
      "Tus pies nunca dejan de avanzar; tu movimiento hacia adelante es lo que completa y saca el giro.",
      "Entrénalo primero en el piso sin obstáculos: girar alejándose del guía no es natural para muchos perros.",
      "En otros sistemas lo describen como \"un front cross donde el que gira es el perro, en tu regazo\": misma mecánica, otro énfasis.",
    ],
    errores: [
      "Detenerte a \"recibirlo\": el perro se sienta frente a ti mirándote.",
      "Mano alta o lejos del cuerpo: brinca hacia la mano en vez de girar la nariz.",
      "Girar tus hombros como front cross a media maniobra: le das dos señales contradictorias.",
    ],
  },
  {
    en: "Double Lap Turn",
    es: "Doble lap turn",
    desc: "Lap turn + front cross encadenados: el perro dibuja un giro de 360° alrededor del ala, aun a distancia.",
    entrenable: null,
    queEs: "Combina un lap turn con un front cross: dos manos en relevo que hacen que el perro gire 360° completos alrededor del ala mientras tú solo rotas 180°. Sirve para regresarlo sobre el salto del que viene hacia ti (threadle-wrap, pull-push), incluso estando a varios metros del obstáculo. OneMind lo recomienda justo para guías que no llegan corriendo a cada salto.",
    comoSeHace: [
      "Kenna viene hacia ti (por ejemplo, la jalaste por el hueco entre dos saltos). Recíbela como lap turn: mano baja pegada al muslo, a la altura de su nariz.",
      "Con esa primera mano gira su nariz alejándola de tu cuerpo: primera mitad del giro, unos 180°.",
      "Sin pausa, en cuanto su cabeza pasa tu mano, gira tú 180° sobre tus pies (la parte de front cross) y tu segunda mano recoge su nariz exactamente donde la soltó la primera.",
      "La segunda mano continúa el arco y sube señalando el ala y el salto; ahí va tu verbal de salto, no antes.",
      "Ella completa el círculo (~360° en total) y toma el salto; tú quedas ya girada, conectada con la mano que marca su nueva línea.",
    ],
    cuandoUsar: "Para threadle-wraps y pull-push: la jalas hacia ti por el hueco y la devuelves sobre el salto envolviendo el ala completa. Brilla cuando estás lejos del obstáculo y aun así necesitas giro cerrado.",
    claves: [
      "El secreto es que la nariz nunca se quede sin imán: la transición entre mano uno y mano dos es un relevo inmediato, sin hueco.",
      "Domina lap turn y front cross por separado antes de juntarlos; OneMind lo pone como prerrequisito y en pista se nota quién se lo saltó.",
      "Tú giras 180°, el perro gira 360°: si terminaste dando la vuelta completa tú también, giraste de más y le tapaste la línea.",
    ],
    errores: [
      "Pausa entre las dos manos: el perro se endereza y se va derecho.",
      "Girar tus 180° antes de que la primera mano termine su trabajo.",
      "Dar el verbal de salto demasiado pronto: brinca hacia ti en vez de completar el círculo.",
    ],
  },
  {
    en: "Reverse Spin",
    es: "Giro invertido",
    desc: "Vuelta completa del guía girando hacia el perro, opuesta al giro de él: cierra la curva sin cambiar de mano.",
    entrenable: null,
    queEs: "Tú das una vuelta completa (360°) girando hacia el perro —en sentido contrario al giro que él va a hacer— y reconectas con él sobre tu hombro, en el mismo lado de siempre. Arranca pareciendo un front cross, pero sin cambio de lado: le dice \"cierra la curva hacia mí\" sin frenarlo. Funciona incluso lejos del salto, por eso OneMind lo recomienda a guías que no llegan a cada obstáculo.",
    comoSeHace: [
      "Kenna va en tu izquierda con el salto adelante; después debe girar hacia ti para tomar la nueva línea y esquivar un off-course tentador al frente.",
      "Cuando ella ya está comprometida al salto (última zancada antes de despegar), arranca tu giro: el hombro izquierdo —el del lado del perro— jala hacia atrás, girando HACIA ella como si empezaras un front cross.",
      "No completes el front: sigue girando la vuelta entera. Tu espalda le queda de frente un instante; no pasa nada, continúa.",
      "Sal del giro buscándola con la mirada sobre ese mismo hombro: ella sigue —y debe seguir— en tu izquierda.",
      "Tu primer paso al salir del giro ya va sobre la nueva línea; ella aterriza cerrando la curva hacia ti y te sigue en la misma mano.",
    ],
    cuandoUsar: "Para apretar el giro del perro o cambiar su línea después de un obstáculo SIN cambiar de lado, sobre todo cuando su línea natural apunta a un off-course. Se puede ejecutar a distancia del salto.",
    claves: [
      "El sentido del giro lo es todo: siempre hacia el perro, opuesto al giro de él (él gira a la izquierda, tu pecho rota a la derecha). Si giras al otro lado hiciste otra maniobra y probablemente lo empujaste al off-course.",
      "Es la alternativa al front cross cuando NO quieres cambiar de mano; a diferencia del Ketschker, aquí no hay blind ni cambio de lado.",
      "Casi no necesita desaceleración: la rotación de tu torso es el cue principal, por eso sirve aunque vayas lejos del salto. Un verbal de giro lo redondea.",
      "Tip fino (OneMind): si necesitas el giro todavía más cerrado, retrasa un instante el giro de tu cabeza al salir del spin.",
    ],
    errores: [
      "Girar tarde, con el perro ya aterrizando: sale largo y tu vuelta solo lo confunde.",
      "Quedarte viéndolo al terminar el giro en vez de salir de inmediato por la nueva línea.",
      "Confundir el sentido y girar \"hacia afuera\": el perro lee cambio de lado donde no lo hay.",
    ],
  },
  {
    en: "Jaakko Turn",
    es: "Jaakko",
    desc: "Envuelta sin cambio de lado: amagas front cross pegado al ala y sales en blind cuando el perro despega.",
    entrenable: null,
    queEs: "Técnica OneMind Dogs (por Jaakko Suoknuuti) para envolver el ala dejando al perro en tu misma mano. Te metes pegadita al ala de despegue, giras hacia el perro como si fueras a hacer front cross y, justo cuando levanta las patas para saltar, lo rematas como blind: le das la espalda un instante y arrancas por la nueva línea. Kenna salta recogida, envuelve el ala y te alcanza en la misma mano, ya en movimiento.",
    comoSeHace: [
      "Gánale la posición: llega antes que ella y métete pegada al ala de despegue, casi tocándola con la pierna.",
      "Mientras se acerca, marca un cambio de ritmo (frenadita) y rota hacia ella: hombros y pecho apuntando a su punto de despegue, como si armaras un front cross. Eso le dice \"colección, el giro es aquí\".",
      "Espera. El momento exacto es cuando levanta las manos del piso para despegar, o medio instante antes; ni una zancada más temprano.",
      "En ese instante remata el giro como blind: dale la espalda un instante, sin dar los pasos del front, y arranca en la nueva dirección.",
      "Cuando ella libra el ala, tú ya vas corriendo; reconecta la mirada sobre el hombro del lado de ella. Aterriza envolviendo y sigue en tu misma mano de siempre.",
    ],
    cuandoUsar: "Cuando quieres envuelta cerrada y seguir en la misma mano, y sí alcanzas a llegar al ala antes que el perro. Muy usado en giros de 180° donde el blind te regala una salida veloz.",
    claves: [
      "La posición lo es todo: si no estás pegada al ala, esto se degrada a un blind mal puesto. Al caminar el recorrido decide con honestidad si de verdad llegas.",
      "Diferencia con el Ketschker: el Jaakko \"avienta\" al perro cruzando frente a tu cuerpo y NO cambia de mano; el Ketschker cuea con el brazo contrario alto y SÍ cambia. En pista mucha gente mezcla los nombres: quédate con esta distinción.",
      "Grábate la secuencia \"pecho al despegue → patas arriba → espalda y arrancas\". Si esos tres pasan en ese orden, el Jaakko salió.",
    ],
    errores: [
      "Salirte antes del despegue: el perro lee \"vámonos\" y rodea el salto o tira la barra.",
      "No reconectar la mirada tras el blind: aterriza sin rumbo.",
      "Hacerlo a dos metros del ala: el giro sale abierto y pierdes toda la ventaja.",
    ],
  },
  {
    en: "Whisky Turn",
    es: "Whisky",
    desc: "Rear cross en ángulo cerradísimo: cruzas por detrás cuando el perro entra al salto de lado o por atrás.",
    entrenable: null,
    queEs: "Es un rear cross (cruce por detrás) ejecutado en un ángulo muy cerrado, con el perro entrando al salto de lado o casi desde el plano trasero: tan sesgado que no ve la barra al acercarse y tiene que confiar en tus cues para comprometerse. OneMind lo llama oficialmente \"Whisky Cross\" y es de sus pocas técnicas que exigen enseñanza por pasos al perro.",
    comoSeHace: [
      "Kenna va adelante de ti, en tu izquierda, con una línea muy sesgada hacia el salto (entra casi paralela a la barra); tú vienes atrás.",
      "Corre con convicción hacia su línea, pecho apuntando al ala por donde va a pasar: tu presión desde atrás es lo que la manda a un salto que todavía no ve.",
      "Dos zancadas antes del despegue ella ya debe estar comprometida; ahí cruza por detrás de su cola hacia el lado al que va a girar: su línea pasa de estar a tu izquierda a quedar a tu derecha.",
      "Al aterrizar, ella gira alejándose de ti hacia el lado nuevo y te toma en la otra mano; tú ya vas corriendo la nueva línea, no mirándola.",
      "Al entrenarlo, pon un premio en el punto de aterrizaje las primeras veces: le enseña a comprometerse con un salto que no ve de frente.",
    ],
    cuandoUsar: "Cuando vas atrás de tu perro —lo normal con una Border Collie rápida— y el recorrido pide tomar el salto en ángulo cerrado o desde el plano trasero con cambio de dirección. También construye foco al obstáculo e independencia.",
    claves: [
      "Primero domina el rear cross normal y luego ve cerrando el ángulo poco a poco; saltarse esa progresión es la receta del desastre.",
      "La convicción de tu carrera ES el cue: si dudas o te frenas, ella voltea a mirarte y pierde el salto.",
      "El cruce va detrás de su cola y nunca antes del compromiso: cruzar temprano tira la barra o provoca runout.",
      "El nombre varía según la escuela (Whisky Turn, Whisky Cross); la mecánica es la misma: rear cross con aproximación sesgada extrema.",
    ],
    errores: [
      "Intentarlo sin un rear cross sólido de base.",
      "Cruzar cuando el perro todavía está decidiendo si toma el salto.",
      "Quedarte viendo al perro después del cruce en vez de correr tu nueva línea.",
    ],
  },
  {
    en: "Flick",
    es: "Flick",
    desc: "Señal de mano que manda al perro a envolver el ala girando lejos de ti; da 270-360° y vuelve a tu lado.",
    entrenable: null,
    queEs: "Es una señal rápida de mano que manda al perro a girar ALEJÁNDOSE de ti alrededor del ala: un círculo de 270 a 360° mientras tú te mantienes fuera de su línea o avanzas lateral hacia lo que sigue. Al cerrar el giro, Kenna queda en el mismo lado tuyo que antes. Es la herramienta OneMind para envolver \"por afuera\" cuando vas atrás.",
    comoSeHace: [
      "Kenna va adelante en tu izquierda, enfilada al salto; el recorrido pide que envuelva el ala girando lejos de ti (hacia su izquierda).",
      "Sin acercarte al salto, da el cue: tu brazo izquierdo —el más cercano a ella— hace el flick, un latigazo corto de muñeca y antebrazo hacia el ala exterior, junto con tu verbal de giro externo (\"out\", \"back\", el que entrenes).",
      "Timing: el flick va una o dos zancadas antes del despegue, con ella ya enfilada; tú no invades su línea y puedes irte lateral hacia el siguiente obstáculo.",
      "Ella salta girando hacia afuera, envuelve el ala 270-360° y sale de la curva buscándote: sigue de tu mismo lado y tú ya vas adelantada en el recorrido.",
    ],
    cuandoUsar: "Cuando vas atrás y el recorrido pide una envuelta girando lejos de ti: el flick la cuea a distancia mientras tú cortas camino por tu lado, por ejemplo hacia un túnel.",
    claves: [
      "El flick vive o muere por el combo mano + verbal: a distancia la mano sola casi no se ve, así que entrena el verbal de giro externo hasta que sea reflejo.",
      "Tu hombro NO gira hacia el salto: si rotas el pecho hacia el ala le dices \"hacia mí\" y matas el giro externo.",
      "Medio paso de presión hacia su línea refuerza el \"gira hacia afuera\" sin que tengas que acercarte al salto.",
      "Es primo del tandem turn, pero ocurre alrededor del ala de un salto y con círculo completo de regreso a tu lado.",
    ],
    errores: [
      "Acercarte al ala \"para ayudar\" girando los hombros: contradices tu propia señal.",
      "Flick tardío, con el perro en el aire: aterriza derecho o gira al lado equivocado.",
      "Usarlo sin haberlo construido en el piso: girar lejos del guía no es natural para el perro.",
    ],
  },
  {
    en: "Slice",
    es: "Slice (salto sesgado)",
    desc: "Tomar el salto en diagonal y en extensión, cruzando la barra sesgado para no perder velocidad ni línea.",
    entrenable: null,
    queEs: "Es lo opuesto a la envuelta: el perro cruza el salto en diagonal, en plena extensión, cortando camino hacia la siguiente línea sin recoger la zancada. No hay giro sobre el ala; el ángulo con que cruza la barra YA es la curva. Tú lo cueas corriendo: todo tu cuerpo dice \"sigue de largo\".",
    comoSeHace: [
      "En el caminado del recorrido define la diagonal: por qué punto de la barra cruza Kenna y hacia dónde sale. El slice se decide caminando, no corriendo.",
      "En la ejecución, corre sin desacelerar por tu línea paralela: tu velocidad sostenida es el cue de extensión.",
      "Hombros y pecho apuntando adelante, a la salida de la diagonal —no al salto—, y tu mirada en la línea que sigue.",
      "Brazo adelantado señalando la dirección de salida y tu verbal de extensión (\"go\", \"sigue\") antes del despegue.",
      "Ella cruza la barra sesgada y aterriza ya orientada al siguiente obstáculo: nadie perdió un metro.",
    ],
    cuandoUsar: "En líneas abiertas, serpentinas y cierres de recorrido donde la diagonal ahorra metros y el siguiente obstáculo queda en la misma dirección. Siempre que NO venga un giro cerrado después del salto.",
    claves: [
      "Wrap o slice es LA decisión táctica de cada salto: giro fuerte después = envuelta; línea que sigue de largo = slice. En los recorridos de FCM esa lectura se hace en el caminado.",
      "Cuida el ángulo: un sesgo extremo invita al runout o a tirar barra; si la diagonal pasa de unos 45° (referencia práctica, no regla), abre la aproximación un paso.",
      "Sé consistente: si a veces frenas \"por si acaso\", Kenna empezará a dudar en todos los slices. La extensión se cuea con carrera franca.",
    ],
    errores: [
      "Frenar por nervios: el perro recoge, salta corto y la línea se muere.",
      "Mirar al perro en vez de a la salida de la diagonal.",
      "Elegir slice cuando después viene giro cerrado: aterriza largo y pierdes más de lo que ahorraste.",
    ],
  },
  {
    en: "Serpentine",
    es: "Serpentina",
    desc: "Tres saltos en línea que el perro zigzaguea mientras tú corres casi recto por un solo lado.",
    entrenable: "serpentine",
    queEs: "Son tres saltos en línea (o en arco suave) que el perro toma alternando el lado por el que entra: uno viene hacia ti, el siguiente se aleja y el tercero regresa hacia ti (o el patrón espejo, según el lado que elijas). Tú no cruzas: te quedas de un solo lado corriendo una línea casi recta, y con cambios de brazo y giros pequeños de hombros le dibujas el zigzag.",
    comoSeHace: [
      "Párate del lado donde el salto 1 viene hacia ti; tu línea de carrera corre paralela a la línea de saltos y cerca de las alas (1-2 metros).",
      "Señala el salto 1 con el brazo interior (el más cercano al perro); tus pies y hombros apuntan al frente de tu línea, no hacia el salto.",
      "Timing clave: da la nueva información lo antes posible —idealmente cuando el perro se compromete al salto 1 y, a más tardar, mientras vuela sobre él—: cambia de brazo y gira apenas los hombros hacia el salto 2 para mandarlo al lado contrario.",
      "No frenes: sigue corriendo y repite el cambio de brazo hacia el salto 3 con el mismo timing (compromiso al 2, a más tardar en el aire) para traerlo de regreso hacia ti.",
      "Mirada al perro de reojo, pecho apuntando a la salida de la serpentina; tu avance continuo es lo que sostiene el patrón.",
    ],
    cuandoUsar: "Cuando el juez pone tres saltos en línea con ángulos que obligarían a tres cruces seguidos: la serpentina los resuelve desde un solo lado. La vas a ver muchísimo conforme subas de grado.",
    claves: [
      "La versión limpia vive en el timing: cada cambio de brazo llega a más tardar con el perro en el aire, nunca cuando ya aterrizó; si puedes darlo antes del despegue, mejor.",
      "Mantén tu línea cerca de las alas: cada metro extra que te alejas hace el zigzag del perro más ancho y más lento.",
      "Tu movimiento continuo ES la señal: si te plantas frente a un salto, el patrón se rompe.",
      "Variante: algunos sistemas la corren solo con rotación de hombros, sin cambio de brazo; funciona igual si tu perro lee bien tu torso.",
    ],
    errores: [
      "Frenar en cada salto 'para asegurarlo': el perro también frena y se despega de la línea.",
      "Girar los hombros de más (el perro lo lee como cruce frontal) y mandarlo al lado equivocado.",
      "Señalar cruzando el brazo sobre tu pecho: ensucia la entrada y el perro duda.",
    ],
  },
  {
    en: "Threadle",
    es: "Threadle",
    desc: "Meter al perro por el hueco entre dos saltos para tomar ambos del mismo lado, contra el flujo natural.",
    entrenable: "threadle",
    queEs: "El perro aterriza del salto 1 y, en lugar de seguir de frente, lo traes por el hueco entre los dos saltos hacia tu lado, para luego mandarlo sobre el salto 2 en la misma dirección que el 1. Él dibuja una 'S' cerrada; tú casi no te mueves de tu línea. Es la contraparte de la serpentina: aquí los dos saltos se toman del mismo lado.",
    comoSeHace: [
      "Colócate del lado de aterrizaje del salto 1, a la altura del hueco entre los dos saltos, esperando al perro.",
      "Timing: da tu verbal exclusivo de threadle ANTES de que el perro despegue en el salto 1 (a más tardar en el despegue) y baja el brazo más cercano a él, palma hacia tu pierna, señalando el hueco: así aterriza corto y ya girando hacia ti.",
      "Da uno o dos pasos laterales HACIA ATRÁS, alejándote del plano de los saltos: ese espacio libre es lo que lo trae por el hueco.",
      "Cuando su cabeza cruce el plano de los saltos viniendo hacia ti, gira hombros y pies de regreso hacia el salto 2 y empuja con el mismo brazo.",
      "Retoma tu carrera y confirma el 2 con tu verbal normal de salto.",
    ],
    cuandoUsar: "Cuando la numeración marca dos saltos consecutivos tomados del mismo lado y el hueco entre ellos es el único camino legal. Típico de pistas técnicas de grados medios y altos.",
    claves: [
      "El verbal va antes del despegue del salto 1: un perro avisado a tiempo aterriza corto y girando; uno avisado en el aire aterriza largo y ya fijó el salto 2.",
      "El paso atrás es el corazón del threadle: sin ese espacio, el perro lee 'sigue derecho' y toma el 2 de frente (eliminado).",
      "Verbal exclusivo, distinto de tu 'aquí' normal: con el 'aquí' de siempre el perro te rodea en vez de pasar por el hueco.",
      "Variante: algunos sistemas cruzan el brazo contrario sobre el pecho ('threadle arm'); elige una versión, entrénala y no la mezcles.",
    ],
    errores: [
      "Avisar tarde: si el perro ya fijó la mirada en el salto 2 antes de tu verbal, el threadle ya se perdió.",
      "Girarte de más y quedar de espaldas al salto 2: el perro se te pega y pierdes segundos re-enviándolo.",
      "Adelantarte y tapar el hueco con tu cuerpo: el perro rodea el salto por fuera.",
    ],
  },
  {
    en: "Lead-Out Pivot",
    es: "Pivote de salida",
    desc: "Te adelantas más allá del salto 1 con el perro quieto y giras en tu lugar para marcar el cambio hacia el 2.",
    entrenable: "lead-out-pivot",
    queEs: "Combina el quieto en la salida con un giro en tu lugar: te adelantas más allá del salto 1, liberas al perro y, mientras él toma el 1, pivotas sobre tus pies —como un cruce frontal sin carrera— para mandarlo al 2 con cambio de dirección. Tú das información temprana; el perro pone la velocidad.",
    comoSeHace: [
      "Deja al perro en su quieto frente al salto 1 y camina a tu punto de pivote: entre el salto 1 y el 2, más o menos un metro fuera de la línea del perro, del lado hacia donde va a girar (él gira hacia ti, como en un cruce frontal).",
      "Postura inicial: pecho y brazo del lado del perro apuntando al salto 1, peso en las puntas de los pies, mirada al perro.",
      "Libera solo con tu palabra de salida, con el cuerpo inmóvil: si te mueves al liberar, le enseñas a salir con tu cuerpo y no con tu voz.",
      "Timing del pivote: cuando el perro se COMPROMETE al salto 1 (a más tardar en el despegue), gira sobre las puntas de los pies hacia el salto 2, cambiando de brazo a la mitad del giro.",
      "Termina con pies, hombros y brazo nuevo apuntando al 2 justo cuando el perro aterriza, y arranca a correr en la nueva dirección.",
    ],
    cuandoUsar: "En aperturas donde el salto 2 exige cambio de dirección y quieres resolverlo parada, con el perro fresco y a tope. Es el primer 'cruce' que muchos instructores enseñan, porque no hay carrera de por medio.",
    claves: [
      "El pivote empieza con el compromiso o el despegue, nunca con el aterrizaje: si giras tarde, el perro aterriza largo y el giro sale abierto y lento.",
      "Gira EN tu lugar, sobre las puntas de los pies; no camines hacia atrás durante el giro o bloqueas la línea al 2.",
      "Depende cien por ciento de un quieto sólido: si Kenna rompe la salida, arregla primero el quieto y luego regresa al pivote.",
    ],
    errores: [
      "Pre-girar el cuerpo antes de liberar 'para ganar tiempo': el perro sale chueco o se lanza al salto equivocado.",
      "Quedarte con la mirada y el brazo viejos apuntando al salto 1 después del giro: el perro recibe dos señales y duda.",
      "Pararte demasiado cerca de la línea del perro: al girar lo tapas y le cierras el paso al 2.",
    ],
  },
  {
    en: "Backside / Push",
    es: "Backside (por atrás del salto)",
    desc: "Enviar al perro a rodear el ala y saltar por la cara trasera del salto, en vez de tomarlo de frente.",
    entrenable: null,
    queEs: "En vez de tomar el salto de frente, el perro rodea el ala, pasa por detrás del plano de la vara y salta de regreso hacia el frente. Tú lo empujas hacia el ala con tu carrera, tu brazo y un verbal exclusivo, y no lo sueltas hasta que su cabeza pase atrás de la vara. Lo verás cada vez más conforme subas de grado.",
    comoSeHace: [
      "Identifica el ala de entrada (la que el perro debe rodear); tu línea de carrera apunta al ala, no al centro del salto.",
      "Corre hacia el ala con el perro a tu lado; brazo interior extendido y bajo, señalando el ala y el espacio detrás de ella; da tu verbal ('back'/'atrás') desde 2-3 zancadas antes.",
      "Pies, cadera y hombros siguen empujando más allá del ala; mirada al ala. Acompáñalo hasta que su cabeza cruce el plano de la vara por detrás.",
      "Punto de compromiso: cuando sus hombros ya pasaron atrás de la vara, ahí sí gira tus hombros hacia la línea de aterrizaje y muestra la salida con el nuevo brazo.",
      "Si la salida es un giro cerrado (wrap), avísalo temprano: el verbal de giro va antes del despegue, idealmente desde que rodea el ala; muchos guías usan verbales distintos para backside de paso y backside con wrap.",
    ],
    cuandoUsar: "Cuando la numeración marca el salto por su cara trasera, o cuando quieres moldear la línea para que el giro de salida apunte directo al siguiente obstáculo.",
    claves: [
      "Regla de oro: no rotes ni te alejes antes del compromiso; casi todos los backsides fallados son un guía que 'se fue' temprano y un perro que saltó la cara frontal.",
      "Presión con el cuerpo completo: pies, cadera y brazo al mismo punto del ala; señales mezcladas producen un perro que frena a preguntar.",
      "Hay dos sabores: 'push' (lo acompañas hasta el ala) y 'send' (lo mandas y tú ya te vas); los nombres varían entre sistemas, pero empieza con el push, es el más confiable.",
    ],
    errores: [
      "Señalar la vara en vez del ala: el perro lee 'salta de frente' y es eliminación.",
      "Girarte hacia el aterrizaje cuando el perro apenas va llegando al ala.",
      "Hacerlo en silencio: sin verbal exclusivo, un salto de frente y un backside se ven idénticos para el perro hasta que es demasiado tarde.",
    ],
  },
  {
    en: "Layering",
    es: "Layering (capas)",
    desc: "Manejar a distancia dejando un obstáculo entre tú y la línea del perro, sin que él lo tome.",
    entrenable: null,
    queEs: "Es manejar con un obstáculo 'de por medio': el perro corre su línea exterior y tú recortas por dentro, dejando entre los dos un obstáculo que él NO debe tomar. Te ahorra metros y te deja llegar a tiempo a la siguiente maniobra, pero exige que el perro se comprometa solo con sus obstáculos.",
    comoSeHace: [
      "Decide en el reconocimiento de pista exactamente qué obstáculo vas a dejar en capa (de por medio) y traza tu línea interior; el layering se planea caminando, no se improvisa corriendo.",
      "ANTES de separarte, manda al perro a su línea: brazo exterior extendido y tu verbal de avanzar ('go'/'sigue'); primero la información, luego la distancia.",
      "Corre tu línea interior con pies y hombros PARALELOS a la línea del perro; el brazo exterior se queda arriba y afuera, como riel.",
      "Mirada al perro, pecho a tu línea: si tu esternón gira hacia él, lo jalas hacia adentro y a veces sobre el obstáculo de en medio (eliminado).",
      "Sostén el verbal mientras dure la separación; el silencio a distancia funciona como imán de regreso.",
    ],
    cuandoUsar: "Cuando la línea del perro es larga y fluida (túnel, línea de saltos) y tú necesitas recortar por dentro para llegar a un cruce o threadle más adelante.",
    claves: [
      "El pecho manda: puedes mirar al perro todo lo que quieras, pero tu esternón debe seguir apuntando a TU línea.",
      "No desaceleres a media capa: para casi cualquier perro, que frenes significa 'gira hacia mí'.",
      "Con una Border Collie rápida como Kenna, el layering es oro: ella cubre su línea larga mientras tú ahorras piernas para el final de la pista.",
    ],
    errores: [
      "Improvisar la capa porque no llegas: sin el verbal previo, el perro abandona su línea y se viene contigo.",
      "Derivar hacia el obstáculo de en medio mientras corres: esa presión accidental hace que el perro lo tome.",
      "Dejar de hablar a media separación y perder al perro de la línea.",
    ],
  },
  {
    en: "Send",
    es: "Envío a distancia",
    desc: "Mandar al perro solo a un obstáculo mientras tú te quedas atrás o te desvías a tu siguiente posición.",
    entrenable: null,
    queEs: "Le das al perro la información completa para que tome un obstáculo sin acompañarlo hasta ahí: él avanza solo y tú te frenas o te vas cerrando hacia tu siguiente posición. Es el bloque básico del manejo a distancia: de aquí nacen el layering y los backsides lejanos.",
    comoSeHace: [
      "Alinea al perro con el obstáculo antes de enviar: su nariz y el obstáculo en la misma línea; un envío chueco no funciona.",
      "Corre 2-3 zancadas HACIA el obstáculo junto al perro: pies, hombros y brazo del lado del perro apuntando directo a él, mientras das tu verbal ('go' o el nombre del obstáculo).",
      "Sostén el empuje hasta el punto de compromiso: cabeza del perro fija en el obstáculo y orejas al frente, normalmente 2-3 zancadas suyas antes del despegue o la entrada.",
      "Solo entonces desacelera o abre tu curva hacia tu siguiente posición, dejando el brazo un instante más como última señal.",
      "En entrenamiento, premia lejos de ti (pelota o premio lanzado adelante) para que irse adelante siempre pague.",
    ],
    cuandoUsar: "Siempre que la pista te pida estar en otro lugar antes de que el perro termine su obstáculo: para ganar posición de cruce o para arrancar una capa de layering.",
    claves: [
      "El compromiso se ve en la cabeza del perro, no en tus ganas: si te vas antes de que fije el obstáculo, el envío muere.",
      "Tu movimiento vale más que tu brazo: dos zancadas honestas hacia el obstáculo envían más que un brazo estirado desde parada.",
      "Construye la distancia en escalera: suéltalo a 1 metro, luego 3, luego 5; brincarte etapas rompe la confianza del perro.",
    ],
    errores: [
      "Voltear a ver tu siguiente posición a medio envío: tus hombros se van y el perro se va contigo.",
      "Enviar solo con el brazo, sin verbal: a distancia el brazo se pierde, la voz no.",
      "Frenar en seco en vez de desacelerar en curva: el frenazo jala al perro fuera del obstáculo.",
    ],
  },
  {
    en: "Start-line Stay",
    es: "Quieto en la salida",
    desc: "El perro espera quieto antes del salto 1 mientras tú te colocas en la pista y lo liberas con tu voz.",
    entrenable: null,
    queEs: "El perro espera inmóvil frente al salto 1 mientras tú caminas a tu posición ideal dentro de la pista, y solo arranca con tu palabra de liberación. Es la única ventaja garantizada de todo el recorrido: bien usada, te deja resolver una apertura técnica antes de dar un solo paso corriendo.",
    comoSeHace: [
      "Entra con un ritual fijo, siempre igual: quita la correa, coloca al perro sentado o parado, derecho hacia el salto 1, a la distancia que entrenaste.",
      "Da tu señal de quieto UNA sola vez, con voz neutra; repetirla le enseña que la primera no cuenta.",
      "Aléjate caminando con decisión a tu posición (de frente al perro o de espaldas, como lo hayas entrenado); nada de dudar ni regresarte a medias.",
      "Ya en posición, planta pies y hombros mostrando la línea del recorrido (o la postura inicial de tu maniobra de apertura, como un pivote) y sostén una pausa de 1-2 segundos.",
      "Libera SOLO con tu palabra, con el cuerpo inmóvil en ese instante; medio segundo después arrancas tú. Si palabra y arrancón salen juntos, el perro aprenderá a salir con tu cuerpo.",
    ],
    cuandoUsar: "En cada salida donde la posición te dé ventaja, sobre todo en aperturas técnicas (como un pivote de salida) o con perros que te comen la delantera en tres zancadas.",
    claves: [
      "La palabra de liberación es sagrada: nunca la mezcles con tu arranque; voz primero, cuerpo después.",
      "Decide ANTES de entrar qué harás si rompe el quieto en competencia (seguir o abortar), para no improvisar con adrenalina.",
      "Haz proofing en entrenamiento: quietos mientras corres, aplaudes o tiras premios; el ambiente de una competencia de la FCM es ruidoso y el quieto tiene que aguantarlo.",
    ],
    errores: [
      "Repetir 'quieto, quieto, quieto' mientras te alejas: diluyes la señal.",
      "Liberar sin querer con micro-señales (bajar el brazo, girar la cabeza) hasta que el perro aprende a adivinar y rompe.",
      "Aguantarlo eternamente en la línea para presumir el quieto: 1-2 segundos de pausa bastan; más solo cocina frustración.",
    ],
  },
  {
    en: "2-on-2-off",
    es: "Dos abajo",
    desc: "Criterio de contacto: frena con las traseras en la rampa y las delanteras en el piso hasta tu liberación.",
    entrenable: null,
    queEs: "Es un criterio de zona, no una maniobra tuya: el perro baja la rampa y se planta con las dos patas traseras sobre la zona y las delanteras en el piso, congelado hasta tu palabra de liberación. Le garantiza al juez ver el contacto pisado, y a ti te regala un segundo para reposicionarte.",
    comoSeHace: [
      "En el piso, sin obstáculo, enseña un toque de nariz a un target (una tapa): marca y premia el toque, entregando siempre el premio abajo, entre las patas delanteras.",
      "Pasa el target al pie de una tabla baja o un escalón y moldea la posición: traseras sobre la tabla, delanteras en el piso, nariz al target. Premia EN la posición, varias veces por repetición.",
      "Agrega nombre a la posición ('spot'/'toca') y tu palabra de liberación: la posición termina cuando TÚ lo dices, jamás cuando el perro decide.",
      "Sube en escalera: tabla más alta, pasarela baja, pasarela completa, rampa A; entrena siempre desde la bajada (backchaining) para que el final sea la parte más conocida.",
      "Haz proofing de movimiento: tú corriendo de largo, quedándote atrás, adelantándote; el criterio solo vale si sobrevive a tu carrera.",
      "Desvanece el target: tapa más chica, luego ninguna; el premio sigue apareciendo abajo, entre sus patas.",
    ],
    cuandoUsar: "Es la opción estándar para tu primer perro de competencia: fácil de juzgar, fácil de mantener, y te da un punto de control en pasarela y rampa A cuando la pista se pone técnica.",
    claves: [
      "El criterio es binario: o está en posición o no está; cada 'se pasó tantito' que dejas pasar le enseña que el criterio es negociable.",
      "Premia siempre abajo, entre sus patas delanteras: la cabeza baja mantiene la postura de bajada y evita que levante la vista a buscarte y despegue las delanteras.",
      "La liberación es parte del criterio: varía la espera (1 a 5 segundos) para que no anticipe la salida.",
    ],
    errores: [
      "Liberarlo cuando ya se movió 'porque igual iba a salir': erosiona el quieto en cuestión de semanas.",
      "Entrenar la posición solo contigo parada al lado: en pista irás corriendo y el criterio se cae.",
      "Subir de la tabla a la rampa A en una semana: la comprensión y el físico del perro no avanzan a la misma velocidad.",
    ],
  },
  {
    en: "Running Contact",
    es: "Contacto corrido",
    desc: "Criterio de contacto: el perro pisa la zona amarilla corriendo a toda velocidad, sin frenar ni brincar.",
    entrenable: null,
    queEs: "El perro baja la rampa corriendo y pisa la zona amarilla con su galope natural, sin detenerse. Es el criterio más rápido y el más difícil de entrenar y mantener: miles de repeticiones con criterio claro, una por una. Para una Border Collie voladora como Kenna es tentador, pero es un proyecto de meses.",
    comoSeHace: [
      "Empieza con una tabla (o alfombra) plana en el piso: lanza el premio ADELANTE antes de que el perro arranque, para que cruce la tabla a toda velocidad persiguiéndolo, sin mirarte.",
      "Define el criterio por repetición: pisadas separadas y bajas en el último tercio de la tabla (galope real, no brinco). Esas se premian; las repeticiones con salto no se premian, se repiten.",
      "Graba cada repetición o pide ojos externos: a velocidad real es imposible juzgar las pisadas a simple vista; la decisión de premiar se toma viendo la repetición, no adivinando.",
      "Sube la inclinación en incrementos pequeños (unos centímetros tras cada sesión buena) hasta llegar a la pasarela o rampa A completa; si aparecen brincos, baja un nivel.",
      "Con el criterio sólido en recto, entrena las salidas con giro a izquierda y derecha como habilidad aparte, con verbal direccional dicho antes de que empiece la bajada.",
      "Mantenimiento de por vida: una sesión corta de refresco cada semana; el contacto corrido se degrada en silencio si solo lo usas en pista.",
    ],
    cuandoUsar: "Cuando buscas los segundos que deciden un podio y puedes sostener un proyecto largo con video. Muchos guías debutan con dos abajo y migran a contacto corrido después, con más experiencia.",
    claves: [
      "Decide el criterio ANTES de la sesión (qué pisada cuenta) y sé binaria: premio o repetición, sin 'más o menos'.",
      "El premio siempre sale adelante y lejos: si sale de tu mano, el perro levanta la cabeza para buscarte y brinca la zona.",
      "Si no puedes grabar y revisar cada sesión, elige dos abajo: un contacto corrido sin video honesto se convierte en contacto brincado.",
    ],
    errores: [
      "Subir la altura por calendario y no por porcentaje de aciertos: busca 80-90% de repeticiones buenas antes de subir.",
      "Premiar repeticiones 'casi buenas' por flojera de repetir: el casi se vuelve el nuevo criterio.",
      "Entrenarlo cansada o con prisa: cada repetición mal premiada te cuesta diez buenas para repararla.",
    ],
  },
]
