// Microlecciones de teoría de agility basadas en el reglamento FCI vigente,
// que la Federación Canófila Mexicana (FCM) aplica en México.
// Bloques de contenido: p (párrafo), lista (viñetas), dato (destacado).

export const LESSONS = [
  {
    id: 'intro',
    icono: '🐾',
    titulo: '¿Qué es el agility?',
    resumen: 'La disciplina, quién la regula y cómo funciona una prueba.',
    contenido: [
      { tipo: 'p', texto: 'El agility es una disciplina deportiva donde el perro supera una secuencia de obstáculos guiado únicamente por la voz y el lenguaje corporal de su guía. Se califica precisión y tiempo: gana el binomio con menos penalizaciones y, en empate, el más rápido.' },
      { tipo: 'p', texto: 'A nivel internacional lo regula la FCI (Fédération Cynologique Internationale). En México, la Federación Canófila Mexicana (FCM) es el miembro de la FCI y organiza las competencias oficiales bajo ese reglamento.' },
      { tipo: 'lista', items: [
        'El guía no puede tocar al perro ni los obstáculos intencionalmente.',
        'El perro corre sin correa y sin collar (por seguridad).',
        'El juez diseña el recorrido y define el tiempo estándar.',
        'Antes de competir, los guías caminan la pista sin perro para planear su manejo.',
      ] },
      { tipo: 'dato', texto: 'El reconocimiento de pista (caminarla sin perro) es el momento clave para decidir cruces, lados de manejo y señales. Un buen plan vale más que un perro veloz.' },
    ],
    quiz: [
      {
        pregunta: '¿Quién regula el agility oficial en México?',
        opciones: ['La AKC', 'La FCM bajo reglamento FCI', 'Cada club define sus reglas'],
        correcta: 1,
        explicacion: 'La FCM es el miembro mexicano de la FCI y aplica su reglamento de agility.',
      },
      {
        pregunta: '¿Qué puede usar el guía para dirigir al perro?',
        opciones: ['Voz y lenguaje corporal', 'Correa corta', 'Premios en la mano durante el recorrido'],
        correcta: 0,
        explicacion: 'Solo voz y cuerpo: tocar al perro o llevar comida/juguetes en pista se penaliza.',
      },
      {
        pregunta: '¿Para qué sirve el reconocimiento de pista?',
        opciones: ['Para que el perro memorice el recorrido', 'Para que el guía planee su manejo sin perro', 'Para medir al perro'],
        correcta: 1,
        explicacion: 'Los guías caminan la pista sin perro para decidir líneas, cruces y señales.',
      },
    ],
  },
  {
    id: 'categorias',
    icono: '📐',
    titulo: 'Categorías de talla',
    resumen: 'S, M, Intermediate y Large: dónde compite cada perro.',
    contenido: [
      { tipo: 'p', texto: 'Los perros se dividen en cuatro categorías según su altura a la cruz, para que los obstáculos sean proporcionales y seguros.' },
      { tipo: 'lista', items: [
        'S (Small): menos de 35 cm — vallas a 25–30 cm',
        'M (Medium): de 35 a menos de 43 cm — vallas a 35–40 cm',
        'I (Intermediate): de 43 a menos de 48 cm — vallas a 45–50 cm',
        'L (Large): 48 cm o más — vallas a 55–60 cm',
      ] },
      { tipo: 'dato', texto: 'Un Border Collie mide típicamente 48–56 cm a la cruz, así que compite en categoría L con vallas de 55–60 cm.' },
      { tipo: 'p', texto: 'La categoría se determina midiendo al perro oficialmente; queda registrada en su libreta de trabajo y no cambia entre competencias.' },
    ],
    quiz: [
      {
        pregunta: '¿En qué categoría compite un Border Collie de 52 cm a la cruz?',
        opciones: ['M', 'I', 'L'],
        correcta: 2,
        explicacion: 'Desde 48 cm a la cruz corresponde Large (L).',
      },
      {
        pregunta: '¿A qué altura salta la categoría L?',
        opciones: ['45–50 cm', '55–60 cm', '65–70 cm'],
        correcta: 1,
        explicacion: 'Las vallas para Large se colocan entre 55 y 60 cm.',
      },
      {
        pregunta: '¿Qué medida define la categoría?',
        opciones: ['El peso', 'La altura a la cruz', 'El largo del cuerpo'],
        correcta: 1,
        explicacion: 'Se mide la altura a la cruz (el punto más alto de la espalda sobre las patas delanteras).',
      },
    ],
  },
  {
    id: 'grados',
    icono: '🎯',
    titulo: 'Grados y modalidades',
    resumen: 'Grado 1, 2 y 3 · pruebas de Agility y de Jumping.',
    contenido: [
      { tipo: 'p', texto: 'La progresión deportiva se organiza en tres grados. Se asciende acumulando recorridos excelentes sin falta (cero penalizaciones).' },
      { tipo: 'lista', items: [
        'Grado 1: nivel inicial, recorridos fluidos de 15 a 20 obstáculos.',
        'Grado 2: nivel intermedio, hasta 22 obstáculos y líneas más técnicas.',
        'Grado 3: nivel de campeonato, máxima dificultad y velocidad.',
      ] },
      { tipo: 'p', texto: 'Además del grado hay dos modalidades de prueba: Agility (incluye obstáculos de contacto y mesa) y Jumping (solo saltos, túneles y slalom, sin contactos). Los recorridos miden entre 100 y 220 m.' },
      { tipo: 'dato', texto: 'Para subir de grado necesitas constancia: tres recorridos con Excelente y cero faltas, con al menos dos jueces distintos, es la referencia habitual.' },
    ],
    quiz: [
      {
        pregunta: '¿Qué distingue a un recorrido de Jumping?',
        opciones: ['No tiene túneles', 'No tiene obstáculos de contacto', 'Es más corto que 100 m'],
        correcta: 1,
        explicacion: 'El Jumping excluye empalizada, pasarela, balancín (y mesa): pura velocidad y giros.',
      },
      {
        pregunta: '¿Cuántos obstáculos tiene aproximadamente una pista?',
        opciones: ['De 15 a 22', 'De 8 a 12', 'De 25 a 30'],
        correcta: 0,
        explicacion: 'El reglamento marca entre 15 y 22 obstáculos según el grado.',
      },
      {
        pregunta: '¿Cómo se asciende de grado?',
        opciones: ['Por edad del perro', 'Acumulando recorridos excelentes sin falta', 'Pagando la inscripción del siguiente grado'],
        correcta: 1,
        explicacion: 'Se requieren varios recorridos con calificación Excelente y cero penalizaciones.',
      },
    ],
  },
  {
    id: 'saltos',
    icono: '🚧',
    titulo: 'Obstáculos de salto',
    resumen: 'Valla, muro, neumático y ría: medidas y cómo se penalizan.',
    contenido: [
      { tipo: 'p', texto: 'Los saltos son la base de cualquier pista: al menos 7 de los obstáculos deben ser de salto, y el primero y el último del recorrido suelen ser vallas simples.' },
      { tipo: 'lista', items: [
        'Valla: 1.20–1.30 m de ancho, barra desplazable. Derribar la barra = 5 faltas.',
        'Muro/viaducto: mismo alto que la valla, con elementos superiores que caen si se tocan.',
        'Neumático: aro de 45–60 cm de diámetro interior, tipo separable (breakaway) por seguridad. Requiere aproximación recta.',
        'Ría (salto de longitud): 2 a 4 elementos según categoría; para L mide 1.20–1.50 m de largo. Pisar un elemento = falta.',
      ] },
      { tipo: 'dato', texto: 'El neumático y la ría siempre se colocan con llegada recta: saltar en ángulo es riesgoso para hombros y columna del perro.' },
    ],
    quiz: [
      {
        pregunta: '¿Cuántas faltas cuesta derribar la barra de una valla?',
        opciones: ['1', '5', 'Eliminación'],
        correcta: 1,
        explicacion: 'Cada barra derribada suma 5 faltas al recorrido.',
      },
      {
        pregunta: '¿Por qué el neumático debe ser "breakaway"?',
        opciones: ['Para que sea más ligero', 'Para abrirse si el perro lo golpea y evitar lesiones', 'Para ajustarse a cada categoría'],
        correcta: 1,
        explicacion: 'El aro se separa ante un impacto fuerte, evitando que el perro quede atrapado.',
      },
      {
        pregunta: '¿Cuántos obstáculos de salto exige mínimo una pista?',
        opciones: ['3', '7', '12'],
        correcta: 1,
        explicacion: 'El reglamento exige al menos 7 obstáculos de salto.',
      },
    ],
  },
  {
    id: 'contactos',
    icono: '⛰️',
    titulo: 'Obstáculos de contacto',
    resumen: 'Empalizada, pasarela y balancín: las zonas que se deben pisar.',
    contenido: [
      { tipo: 'p', texto: 'Los obstáculos de contacto tienen zonas pintadas en los extremos que el perro debe tocar con al menos una pata. Existen por seguridad: obligan al perro a subir y bajar controlado en lugar de saltar desde lo alto.' },
      { tipo: 'lista', items: [
        'Empalizada (A-frame): dos rampas de ~2.70 m unidas en un vértice a 1.70 m. Zonas de contacto de 1.06 m.',
        'Pasarela (dog walk): tres tablones de 3.60–3.80 m a 1.20–1.30 m de altura. Zonas de 90 cm.',
        'Balancín (see-saw): tablón que bascula sobre un eje; el perro debe esperar a que toque el suelo antes de bajar. Zonas de 90 cm.',
      ] },
      { tipo: 'p', texto: 'No pisar la zona de bajada cuesta 5 faltas. En el balancín, saltar antes de que el tablón toque el suelo también es falta.' },
      { tipo: 'dato', texto: 'En entrenamiento, el criterio "2 on 2 off" (dos patas en el suelo, dos en la rampa) enseña una bajada consistente. La alternativa avanzada son los contactos corridos (running contacts).' },
    ],
    quiz: [
      {
        pregunta: '¿Para qué existen las zonas de contacto?',
        opciones: ['Para decorar el obstáculo', 'Para que el perro suba y baje de forma segura', 'Para hacer más lenta la pista'],
        correcta: 1,
        explicacion: 'Evitan que el perro salte desde lo alto y se lesione.',
      },
      {
        pregunta: 'En el balancín, ¿qué debe pasar antes de que el perro baje?',
        opciones: ['El guía debe tocarlo', 'El tablón debe tocar el suelo', 'El juez debe dar la señal'],
        correcta: 1,
        explicacion: 'Bajarse antes de que el tablón toque el suelo se penaliza con 5 faltas.',
      },
      {
        pregunta: '¿Qué es el criterio "2 on 2 off"?',
        opciones: ['Dos patas en el suelo y dos en la rampa al final del contacto', 'Dos saltos seguidos', 'Dos segundos de pausa en la mesa'],
        correcta: 0,
        explicacion: 'Es una posición de fin de obstáculo que garantiza pisar la zona de contacto.',
      },
    ],
  },
  {
    id: 'slalom',
    icono: '〰️',
    titulo: 'El slalom y su entrada',
    resumen: '12 postes, una sola regla de oro: el primer poste al hombro izquierdo.',
    contenido: [
      { tipo: 'p', texto: 'El slalom son 12 postes separados 60 cm que el perro zigzaguea a máxima velocidad. Es el obstáculo que más entrenamiento requiere y solo aparece una vez por recorrido.' },
      { tipo: 'dato', texto: 'LA REGLA DE ORO: el perro siempre entra dejando el primer poste a su hombro IZQUIERDO (pasa entre el poste 1 y el 2 desde la derecha). No importa desde qué lado llegue ni dónde esté el guía: la entrada es siempre la misma.' },
      { tipo: 'lista', items: [
        'Entrada incorrecta = rehúse (5 puntos y hay que reintentar).',
        'Saltarse un poste a medio slalom = falta; se corrige retomando donde ocurrió el error (en Grado 3, se repite completo).',
        'El slalom debe completarse correctamente antes de seguir al siguiente obstáculo; si no, es eliminación.',
      ] },
      { tipo: 'p', texto: 'Por eso se entrena la entrada desde todos los ángulos posibles: el perro debe encontrarla solo, con el guía a la izquierda, a la derecha, adelante o atrás.' },
    ],
    quiz: [
      {
        pregunta: '¿Cómo entra el perro correctamente al slalom?',
        opciones: ['Con el primer poste a su hombro derecho', 'Con el primer poste a su hombro izquierdo', 'Por el lado donde esté el guía'],
        correcta: 1,
        explicacion: 'Siempre con el primer poste al hombro izquierdo, llegue por donde llegue.',
      },
      {
        pregunta: '¿Qué pasa si el perro entra mal al slalom?',
        opciones: ['Falta de 5 puntos y continúa', 'Rehúse: 5 puntos y debe reintentar la entrada', 'Eliminación inmediata'],
        correcta: 1,
        explicacion: 'La entrada incorrecta es rehúse; tres rehúses en el recorrido son eliminación.',
      },
      {
        pregunta: '¿Cuántos postes tiene el slalom de competencia?',
        opciones: ['10', '12', '14'],
        correcta: 1,
        explicacion: 'Son 12 postes separados 60 cm entre sí.',
      },
    ],
  },
  {
    id: 'penalizaciones',
    icono: '🚩',
    titulo: 'Faltas, rehúses y eliminación',
    resumen: 'Cómo se penaliza y qué te saca del recorrido.',
    contenido: [
      { tipo: 'p', texto: 'La penalización total es la suma de penalizaciones de recorrido (faltas y rehúses) más las de tiempo (segundos por encima del TRS).' },
      { tipo: 'lista', items: [
        'FALTA (5 puntos): derribar una barra, no pisar una zona de contacto, pisar la ría, bajar del balancín antes de tiempo.',
        'REHÚSE (5 puntos): el perro se detiene frente al obstáculo, lo esquiva o entra mal al slalom. Debe reintentarse.',
        'ELIMINACIÓN: tres rehúses, tomar un obstáculo en orden incorrecto, saltarse uno, que el guía toque al perro o al obstáculo deliberadamente, o superar el TRM.',
      ] },
      { tipo: 'p', texto: 'Las calificaciones según penalización total: Excelente (menos de 6), Muy Bueno (de 6 a menos de 16), Bueno (de 16 a menos de 26). Con 26 o más no hay calificación.' },
      { tipo: 'dato', texto: 'Un recorrido con 0 penalizaciones se llama "clear round" (recorrido limpio) y es el requisito para ascender de grado.' },
    ],
    quiz: [
      {
        pregunta: '¿Cuántos rehúses causan eliminación?',
        opciones: ['2', '3', '5'],
        correcta: 1,
        explicacion: 'Al tercer rehúse el binomio queda eliminado.',
      },
      {
        pregunta: 'El perro esquiva la valla sin saltarla. ¿Qué es?',
        opciones: ['Falta', 'Rehúse', 'Nada, puede continuar'],
        correcta: 1,
        explicacion: 'Esquivar o frenarse ante el obstáculo es rehúse: 5 puntos y a reintentar.',
      },
      {
        pregunta: '¿Qué es un "clear round"?',
        opciones: ['Un recorrido sin penalizaciones', 'Un recorrido dentro del TRM', 'Ganar la prueba'],
        correcta: 0,
        explicacion: 'Cero faltas, cero rehúses y dentro del tiempo estándar.',
      },
    ],
  },
  {
    id: 'tiempos',
    icono: '⏱️',
    titulo: 'TRS y TRM: los tiempos',
    resumen: 'Cómo se calcula el tiempo estándar y el tiempo máximo.',
    contenido: [
      { tipo: 'p', texto: 'El juez determina el Tiempo de Recorrido Estándar (TRS) dividiendo la longitud de la pista entre la velocidad elegida en metros por segundo. Cada segundo (o fracción) por encima del TRS suma penalización de tiempo.' },
      { tipo: 'lista', items: [
        'Ejemplo: pista de 160 m a 4 m/s → TRS = 40 segundos.',
        'El Tiempo de Recorrido Máximo (TRM) suele ser 1.5 veces el TRS; superarlo es eliminación.',
        'A mayor grado, mayor velocidad exigida: un Grado 3 de Jumping puede juzgarse a 4 m/s o más.',
      ] },
      { tipo: 'dato', texto: 'La velocidad la fija el juez según el grado, la modalidad, el tamaño del ring y la dificultad del trazado — por eso dos pistas del mismo largo pueden tener TRS distintos.' },
    ],
    quiz: [
      {
        pregunta: 'Pista de 150 m juzgada a 3 m/s. ¿TRS?',
        opciones: ['45 s', '50 s', '60 s'],
        correcta: 1,
        explicacion: '150 ÷ 3 = 50 segundos.',
      },
      {
        pregunta: '¿Qué pasa si superas el TRM?',
        opciones: ['Penalización de 10 puntos', 'Eliminación', 'Solo pierdes la calificación Excelente'],
        correcta: 1,
        explicacion: 'El TRM es el límite absoluto: superarlo elimina al binomio.',
      },
      {
        pregunta: '¿Quién decide la velocidad para calcular el TRS?',
        opciones: ['El guía', 'El juez', 'La FCI la fija igual para todas las pruebas'],
        correcta: 1,
        explicacion: 'El juez la elige según grado, modalidad y dificultad del trazado.',
      },
    ],
  },
  {
    id: 'manejo',
    icono: '🧭',
    titulo: 'El lenguaje del guía',
    resumen: 'Tu cuerpo dirige: hombros, brazos y los tres cruces.',
    contenido: [
      { tipo: 'p', texto: 'El perro lee tu cuerpo mucho más que tu voz: la orientación de tus hombros y tu dirección de carrera le dicen a dónde ir. El brazo del lado del perro es tu señal principal: apunta la línea que quieres que tome.' },
      { tipo: 'lista', items: [
        'Cruce frontal (front cross): giras de frente al perro cambiándolo de lado. Requiere llegar antes que él al punto de cruce.',
        'Cruce trasero (rear cross): cambias de lado por detrás del perro mientras él va adelante. Útil cuando el perro es más rápido que tú.',
        'Cruce ciego (blind cross): cambias de lado dándole la espalda un instante. Muy rápido, pero pierdes al perro de vista.',
        'Deceleración: frenar y flexionar las rodillas le indica al perro que viene un giro cerrado o colección antes de un salto.',
      ] },
      { tipo: 'dato', texto: 'Regla práctica: brazo y hombros SIEMPRE coherentes con la línea. Señalar con el brazo contrario o girar los hombros tarde produce rehúses y barras derribadas.' },
      { tipo: 'p', texto: 'El módulo Coach de Manejo de este lab usa la cámara para verificar estas señales: brazo extendido del lado correcto, rotación completa en el cruce frontal y flexión en la deceleración.' },
    ],
    quiz: [
      {
        pregunta: '¿Qué lee el perro principalmente para saber a dónde ir?',
        opciones: ['Solo la voz', 'Los hombros y la dirección de carrera del guía', 'El silbato'],
        correcta: 1,
        explicacion: 'El lenguaje corporal (hombros, brazo, carrera) es la señal dominante.',
      },
      {
        pregunta: '¿Cuándo conviene un cruce trasero?',
        opciones: ['Cuando el guía llega antes que el perro', 'Cuando el perro va adelante y no alcanzas a cruzar de frente', 'Nunca, es falta'],
        correcta: 1,
        explicacion: 'El rear cross cambia de lado por detrás cuando el perro te gana la posición.',
      },
      {
        pregunta: '¿Qué comunica flexionar rodillas y frenar?',
        opciones: ['Que viene un giro cerrado / colección', 'Que el recorrido terminó', 'Que el perro debe acelerar'],
        correcta: 0,
        explicacion: 'La deceleración pide al perro acortar zancada y prepararse para girar.',
      },
    ],
  },
]

export const STORAGE_KEY = 'motionlab-agility-lessons'

export const readProgress = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export const saveProgress = (progress) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}
