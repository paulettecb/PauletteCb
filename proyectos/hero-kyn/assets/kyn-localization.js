(function setupKynLocalization() {
  const defaultLocale = 'en';
  const localizedCopy = {
    es: {
      'MODULAR CANINE SYSTEMS': 'SISTEMAS CANINOS MODULARES',
      'Quiet strength. Modular control.': 'Fuerza silenciosa. Control modular.',
      'Biothane + solid brass. Adjustable configurations for urban walks and active dogs.':
        'Biothane + latón sólido. Configuraciones ajustables para paseos urbanos y perros activos.',
      'Adjustable length, hands-free compatible': 'Longitud ajustable, compatible manos libres',
      'Solid brass hardware, built to last': 'Herrajes de latón sólido, hechos para durar',
      'Minimal aesthetic, maximum utility': 'Estética minimalista, máxima utilidad',
      'Explore the System': 'Explorar el sistema',
      'How Modularity Works': 'Cómo funciona la modularidad',
      'WHY BIOTHANE?': '¿POR QUÉ BIOTHANE?',
      Specs: 'Especificaciones',
      SYSTEM: 'SISTEMA',
      ENVIRONMENT: 'ENTORNO',
      'BIOTHANE + BRASS': 'BIOTHANE + LATÓN',
      'MODULAR / ADJUSTABLE': 'MODULAR / AJUSTABLE',
      'URBAN + TRAIL': 'URBANO + SENDERO',
      'SYSTEM OVERVIEW': 'VISIÓN GENERAL DEL SISTEMA',
      'Explore the system.': 'Explora el sistema.',
      'A modular framework built around a configurable core.':
        'Una estructura modular construida alrededor de un núcleo configurable.',
      CORE: 'NÚCLEO',
      MODULE: 'MÓDULO',
      EXTENSION: 'EXTENSIÓN',
      'The Core': 'El núcleo',
      'The foundation of the system. It establishes shared geometry, attachment logic, and stable behavior across every compatible element.':
        'La base del sistema. Establece geometría compartida, lógica de conexión y un comportamiento estable en cada elemento compatible.',
      'BASE INTERFACE': 'INTERFAZ BASE',
      Modules: 'Módulos',
      'Interchangeable components that connect through consistent interfaces, allowing parts to be attached or swapped without disrupting the framework.':
        'Componentes intercambiables que se conectan mediante interfaces consistentes, permitiendo acoplar o intercambiar piezas sin alterar la estructura.',
      'ATTACH / SWAP': 'ACOPLAR / CAMBIAR',
      Configurations: 'Configuraciones',
      'Adaptable setups created by combining compatible elements, enabling structural variety while preserving a coherent system language.':
        'Configuraciones adaptables creadas al combinar elementos compatibles, permitiendo variedad estructural sin perder una lógica de sistema coherente.',
      RECONFIGURE: 'RECONFIGURAR',
      'View modular logic': 'Ver lógica modular',
      'Back to home': 'Volver al inicio',
      'LOCK · ALIGN · EXTEND · ADAPT · RECONFIGURE · LOCK':
        'BLOQUEAR · ALINEAR · EXTENDER · ADAPTAR · RECONFIGURAR · BLOQUEAR',
      'SYSTEM LOGIC': 'LÓGICA DEL SISTEMA',
      'How modularity works.': 'Cómo funciona la modularidad.',
      'A system built from a core + interchangeable modules.':
        'Un sistema construido desde un núcleo + módulos intercambiables.',
      HANDLE: 'AGARRE',
      ANCHOR: 'ANCLA',
      '01 Core': '01 Núcleo',
      'The core establishes a stable base for the system. It defines the shared geometry and keeps every connection point predictable.':
        'El núcleo establece una base estable para el sistema. Define la geometría compartida y mantiene predecible cada punto de conexión.',
      INTERFACE: 'INTERFAZ',
      '02 Modules': '02 Módulos',
      'Modules attach to the core through consistent join points. Each piece can be swapped without changing the system language.':
        'Los módulos se unen al núcleo mediante puntos de acople consistentes. Cada pieza puede cambiarse sin alterar la lógica del sistema.',
      SWAP: 'INTERCAMBIO',
      '03 Configurations': '03 Configuraciones',
      'Different arrangements emerge by combining compatible modules. The result is flexible, while the structure remains coherent.':
        'Surgen diferentes configuraciones al combinar módulos compatibles. El resultado es flexible mientras la estructura se mantiene coherente.',
      LOCK: 'BLOQUEO',
      'Compatibility rules': 'Reglas de compatibilidad',
      'Interfaces align by width': 'Las interfaces se alinean por ancho',
      'Modules lock with a single fastener': 'Los módulos se bloquean con un único fijador',
      'Swap points are standardized': 'Los puntos de intercambio están estandarizados',
      'Connection paths remain centered': 'Las rutas de conexión se mantienen centradas',
      'Every module follows shared tolerances': 'Cada módulo sigue tolerancias compartidas',
      'Orientation markers guide assembly': 'Los marcadores de orientación guían el ensamblaje',
      'Explore the system': 'Explorar el sistema',
      Back: 'Volver',
      'SYSTEM STUDY': 'ESTUDIO DEL SISTEMA',
      'MATERIAL INTELLIGENCE': 'INTELIGENCIA DE MATERIALES',
      'Materials aren’t decoration.': 'Los materiales no son decoración.',
      'They are behavior under load.': 'Son comportamiento bajo carga.',
      'KYN is engineered around contact, force, and repeatability. Every interface, edge radius, and material decision is selected for controllable response under real handling conditions.':
        'KYN está diseñado en torno al contacto, la fuerza y la repetibilidad. Cada interfaz, radio de borde y decisión de material se selecciona para una respuesta controlable en condiciones reales de uso.',
      'THE MATERIAL STACK': 'LA ESTRUCTURA DE MATERIALES',
      'Biothane® — Surface Integrity': 'Biothane® — Integridad superficial',
      'Biothane as the adaptive shell': 'Biothane como capa adaptativa',
      'The exterior layer must remain dimensionally stable while flexing through repeated cycles. Biothane provides weather resistance, low absorption, and predictable bend behavior without fiber fray or edge collapse.':
        'La capa exterior debe mantenerse dimensionalmente estable mientras se flexiona en ciclos repetidos. Biothane ofrece resistencia climática, baja absorción y una flexión predecible sin deshilachado ni colapso de bordes.',
      'Solid Brass — Structural Density': 'Latón macizo — Densidad estructural',
      'Brass as the structural anchor': 'Latón como ancla estructural',
      'Dense brass hardware protects the load path against deformation and distributes force through stable connection geometry. It delivers reliable mass, machining accuracy, and long-term wear behavior.':
        'Los herrajes de latón denso protegen la trayectoria de carga frente a deformaciones y distribuyen la fuerza mediante una geometría de conexión estable. Aporta masa confiable, precisión de mecanizado y desgaste estable a largo plazo.',
      'MECHANICAL TRUTH': 'VERDAD MECÁNICA',
      'Controlled load path.': 'Trayectoria de carga controlada.',
      'Mechanical clarity is built by minimizing uncertain behavior at connection points. Components are arranged to keep force vectors centered, constrain unintended torsion, and maintain repeatable handling feedback as conditions change.':
        'La claridad mecánica se construye minimizando el comportamiento incierto en los puntos de conexión. Los componentes se organizan para mantener centrados los vectores de fuerza, limitar torsiones no deseadas y conservar una respuesta repetible al cambiar las condiciones.',
      'INTERFACE RULES': 'REGLAS DE INTERFAZ',
      'Shared Width Standards': 'Estándares de ancho compartido',
      'Unified dimensions maintain compatibility across modules and simplify replacement.':
        'Las dimensiones unificadas mantienen la compatibilidad entre módulos y simplifican el reemplazo.',
      'Single Attachment Logic': 'Lógica de fijación única',
      'Connections lock through one clear path to reduce setup ambiguity and error.':
        'Las conexiones se bloquean mediante una única ruta clara para reducir ambigüedad y errores de montaje.',
      'Orientation Control': 'Control de orientación',
      'Guided orientation keeps hardware aligned and prevents rotational drift under load.':
        'La orientación guiada mantiene los herrajes alineados y evita desvíos rotacionales bajo carga.',
      'Centered Connection Paths': 'Rutas de conexión centradas',
      'Force transfer stays centered for balanced response and clean mechanical behavior.':
        'La transferencia de fuerza permanece centrada para una respuesta equilibrada y un comportamiento mecánico limpio.',
      TOLERANCES: 'TOLERANCIAS',
      'A modular system is only as stable as its dimensional discipline. Tolerances are tuned to preserve fit without seizure, allowing movement where needed while keeping critical interfaces constrained and secure.':
        'Un sistema modular solo es tan estable como su disciplina dimensional. Las tolerancias se ajustan para preservar el encaje sin agarrotamiento, permitiendo movimiento donde se necesita y manteniendo interfaces críticas seguras.',
      'AGING & CARE': 'ENVEJECIMIENTO Y CUIDADO',
      'Material longevity depends on routine inspection, cleaning, and controlled storage. Biothane should be wiped and dried after high debris use; brass should be cleaned gently to maintain function while allowing natural patina over time.':
        'La longevidad del material depende de inspección rutinaria, limpieza y almacenamiento controlado. Biothane debe limpiarse y secarse tras usos con mucha suciedad; el latón debe limpiarse con suavidad para mantener la función mientras desarrolla pátina natural.',
      'READY TO BUILD?': '¿LISTO PARA CONSTRUIR?',
      'BUILD YOUR CONFIGURATION': 'CREA TU CONFIGURACIÓN',
      'VIEW SYSTEM LOGIC': 'VER LÓGICA DEL SISTEMA',
      'LOCK · ALIGN · EXTEND · ADAPT · RECONFIGURE':
        'BLOQUEAR · ALINEAR · EXTENDER · ADAPTAR · RECONFIGURAR'
    }
  };

  function getBrowserLocale() {
    const browserLocales = [
      ...(navigator.languages || []),
      navigator.language,
      Intl.DateTimeFormat().resolvedOptions().locale
    ].filter(Boolean);

    return browserLocales.some((locale) => locale.toLowerCase().startsWith('es')) ? 'es' : defaultLocale;
  }

  function localizeRenderedTemplate({ root } = {}) {
    const app = root || document.getElementById('app');
    if (!app) return;

    const locale = getBrowserLocale();
    const dictionary = localizedCopy[locale] || {};
    document.documentElement.lang = locale;

    const walker = document.createTreeWalker(app, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parentTag = node.parentElement?.tagName;
      if (parentTag === 'SCRIPT' || parentTag === 'STYLE') continue;

      const originalText = node.textContent || '';
      const translatedText = dictionary[originalText.trim()];
      if (!translatedText) continue;

      const leadingSpace = (originalText.match(/^\s*/) || [''])[0];
      const trailingSpace = (originalText.match(/\s*$/) || [''])[0];
      node.textContent = `${leadingSpace}${translatedText}${trailingSpace}`;
    }

    app.querySelectorAll('[aria-label]').forEach((element) => {
      const label = element.getAttribute('aria-label') || '';
      const translatedLabel = dictionary[label.trim()];
      if (translatedLabel) element.setAttribute('aria-label', translatedLabel);
    });
  }

  window.kynLocalizeRenderedTemplate = localizeRenderedTemplate;
})();
