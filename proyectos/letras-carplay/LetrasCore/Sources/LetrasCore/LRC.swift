import Foundation

/// Una línea de letra con el segundo de la canción en el que empieza.
public struct LineaLetra: Equatable, Sendable {
    public let tiempo: TimeInterval
    public let texto: String

    public init(tiempo: TimeInterval, texto: String) {
        self.tiempo = tiempo
        self.texto = texto
    }
}

/// Lee letras en formato LRC (`[mm:ss.xx] texto`), el que entrega LRCLIB en `syncedLyrics`.
///
/// - Ignora etiquetas de metadatos (`[ar:…]`, `[ti:…]`) y líneas sin marca de tiempo.
/// - Una línea con varias marcas (`[00:10.00][01:20.00] coro`) se repite en cada tiempo.
/// - Las líneas vacías se conservan: marcan silencios o instrumentales.
/// - El resultado sale ordenado por tiempo.
public enum LRC {
    public static func parse(_ texto: String) -> [LineaLetra] {
        var lineas: [LineaLetra] = []
        for crudo in texto.split(whereSeparator: \.isNewline) {
            var resto = Substring(crudo)
            var tiempos: [TimeInterval] = []
            while resto.first == "[", let cierre = resto.firstIndex(of: "]") {
                let etiqueta = resto[resto.index(after: resto.startIndex)..<cierre]
                guard let t = segundos(de: etiqueta) else { break }
                tiempos.append(t)
                resto = resto[resto.index(after: cierre)...]
            }
            let letra = resto.trimmingCharacters(in: .whitespaces)
            for t in tiempos { lineas.append(LineaLetra(tiempo: t, texto: letra)) }
        }
        return lineas.sorted { $0.tiempo < $1.tiempo }
    }

    /// `mm:ss`, `mm:ss.x`, `mm:ss.xx` o `mm:ss.xxx` → segundos. Cualquier otra cosa es metadato.
    static func segundos(de etiqueta: Substring) -> TimeInterval? {
        let partes = etiqueta.split(separator: ":", omittingEmptySubsequences: false)
        guard partes.count == 2,
              let minutos = Int(partes[0]), minutos >= 0,
              let seg = Double(partes[1].replacingOccurrences(of: ",", with: ".")),
              seg >= 0, seg < 60,
              partes[1].first?.isNumber == true
        else { return nil }
        return TimeInterval(minutos) * 60 + seg
    }
}
