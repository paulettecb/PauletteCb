import Foundation

/// Cómo se reparte la letra en bloques para la Live Activity.
///
/// Desde iOS 18 una Live Activity solo acepta actualizaciones cada ~5–15 s, así que en vez de
/// mandar línea por línea se manda un bloque con varias líneas y sus tiempos. Dentro del bloque
/// nada se recalcula: el widget solo recibe fechas absolutas y el sistema anima las piezas
/// basadas en tiempo (`ProgressView(timerInterval:)`, `Text(timerInterval:)`).
public struct Ajustes: Sendable {
    /// Lo mínimo que debe durar un bloque, o sea, el espacio entre dos actualizaciones.
    public var minimoEntreActualizaciones: TimeInterval
    /// Cuántas líneas caben en la tarjeta.
    public var maximoLineas: Int

    public init(minimoEntreActualizaciones: TimeInterval = 15, maximoLineas: Int = 4) {
        self.minimoEntreActualizaciones = minimoEntreActualizaciones
        self.maximoLineas = max(1, maximoLineas)
    }
}

/// Una línea dentro de su bloque, en números relativos al inicio del bloque.
public struct LineaEnBloque: Equatable, Sendable {
    public let texto: String
    /// Segundos desde que empieza el bloque hasta que empieza esta línea.
    public let desde: TimeInterval
    /// Cuánto dura la línea (hasta la siguiente línea o silencio).
    public let duracion: TimeInterval
}

/// Un bloque en tiempo de canción: no sabe nada del reloj real todavía.
public struct Bloque: Equatable, Sendable {
    /// Segundo de la canción donde empieza la primera línea.
    public let inicio: TimeInterval
    /// Segundo de la canción donde empieza el siguiente bloque: ahí toca la siguiente actualización.
    public let fin: TimeInterval
    public let lineas: [LineaEnBloque]

    public var duracion: TimeInterval { fin - inicio }

    /// `true` si el bloque dura menos que el mínimo entre actualizaciones: la siguiente
    /// actualización llegaría antes de lo que iOS permite y la letra se atrasaría.
    public func esDenso(_ ajustes: Ajustes) -> Bool {
        duracion < ajustes.minimoEntreActualizaciones
    }

    /// Pasa el bloque a fechas reales, sabiendo en qué segundo va la canción `ahora`.
    /// Con `velocidad` 0 (pausa) las fechas no avanzan: se manda el bloque congelado.
    public func anclado(posicion: TimeInterval, ahora: Date, velocidad: Double = 1) -> BloqueAnclado {
        let fecha = { (segundo: TimeInterval) -> Date in
            velocidad > 0 ? ahora.addingTimeInterval((segundo - posicion) / velocidad) : ahora
        }
        let lineas = lineas.map { linea in
            LineaAnclada(texto: linea.texto,
                         inicio: fecha(inicio + linea.desde),
                         fin: fecha(inicio + linea.desde + linea.duracion))
        }
        return BloqueAnclado(lineas: lineas, siguienteActualizacion: fecha(fin), enPausa: velocidad <= 0)
    }
}

public struct LineaAnclada: Equatable, Sendable, Codable {
    public let texto: String
    public let inicio: Date
    public let fin: Date

    /// Rango listo para `ProgressView(timerInterval:)` o `Text(timerInterval:)`.
    public var intervalo: ClosedRange<Date> { inicio...max(inicio, fin) }
}

/// Lo que viaja en el `ContentState` de la Live Activity.
public struct BloqueAnclado: Equatable, Sendable, Codable {
    public let lineas: [LineaAnclada]
    /// Cuándo la app debe mandar el siguiente bloque.
    public let siguienteActualizacion: Date
    public let enPausa: Bool
}

public enum Bloques {
    /// Divide la letra en bloques de al menos `minimoEntreActualizaciones` segundos y máximo
    /// `maximoLineas` líneas. Las líneas vacías no se muestran, pero cortan a la anterior
    /// (así un instrumental no se cuenta como si la última línea siguiera sonando).
    public static func dividir(_ letra: [LineaLetra],
                               duracionCancion: TimeInterval,
                               ajustes: Ajustes = Ajustes()) -> [Bloque] {
        let segmentos = segmentar(letra, duracionCancion: duracionCancion)
        var bloques: [Bloque] = []
        var i = 0
        while i < segmentos.count {
            var j = i + 1
            while j < segmentos.count,
                  j - i < ajustes.maximoLineas,
                  segmentos[j].inicio - segmentos[i].inicio < ajustes.minimoEntreActualizaciones {
                j += 1
            }
            let inicio = segmentos[i].inicio
            let fin = j < segmentos.count ? segmentos[j].inicio : max(duracionCancion, segmentos[j - 1].fin)
            let lineas = segmentos[i..<j].map {
                LineaEnBloque(texto: $0.texto, desde: $0.inicio - inicio, duracion: $0.fin - $0.inicio)
            }
            bloques.append(Bloque(inicio: inicio, fin: fin, lineas: lineas))
            i = j
        }
        return bloques
    }

    /// El bloque que está sonando en `posicion`. Antes de la primera línea (intro) regresa el
    /// primer bloque, que simplemente empieza en el futuro.
    public static func bloque(en posicion: TimeInterval, de bloques: [Bloque]) -> Bloque? {
        bloques.last { $0.inicio <= posicion } ?? bloques.first
    }

    struct Segmento { let texto: String; let inicio: TimeInterval; let fin: TimeInterval }

    static func segmentar(_ letra: [LineaLetra], duracionCancion: TimeInterval) -> [Segmento] {
        var segmentos: [Segmento] = []
        for (k, linea) in letra.enumerated() where !linea.texto.isEmpty {
            let siguiente = k + 1 < letra.count ? letra[k + 1].tiempo : max(duracionCancion, linea.tiempo)
            segmentos.append(Segmento(texto: linea.texto, inicio: linea.tiempo, fin: siguiente))
        }
        return segmentos
    }
}
