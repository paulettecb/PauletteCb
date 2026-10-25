import Foundation
import LetrasCore

// Uso: swift run letras-analiza <respuesta-lrclib.json> [minimo-segundos] [maximo-lineas]
// Muestra cómo quedaría la canción en bloques y si algún bloque es más corto que el
// mínimo que iOS deja entre actualizaciones de la Live Activity.

let args = CommandLine.arguments
guard args.count >= 2, let datos = FileManager.default.contents(atPath: args[1]) else {
    print("Uso: letras-analiza <respuesta-lrclib.json> [minimo-segundos] [maximo-lineas]")
    exit(1)
}
let ajustes = Ajustes(minimoEntreActualizaciones: args.count > 2 ? Double(args[2]) ?? 15 : 15,
                      maximoLineas: args.count > 3 ? Int(args[3]) ?? 4 : 4)

do {
    let pista = try JSONDecoder().decode(PistaLRCLIB.self, from: datos)
    let bloques = Bloques.dividir(pista.letra, duracionCancion: pista.duration, ajustes: ajustes)
    let f = { (s: TimeInterval) in String(format: "%d:%05.2f", Int(s) / 60, s.truncatingRemainder(dividingBy: 60)) }

    print("\(pista.trackName) · \(pista.artistName) · \(f(pista.duration))")
    print("Mínimo entre actualizaciones: \(Int(ajustes.minimoEntreActualizaciones)) s · máximo \(ajustes.maximoLineas) líneas\n")
    for (n, b) in bloques.enumerated() {
        let marca = b.esDenso(ajustes) ? "  ⚠️ denso" : ""
        print(String(format: "Bloque %02d  %@ → %@  (%.1f s, %d líneas)%@", n + 1, f(b.inicio), f(b.fin), b.duracion, b.lineas.count, marca))
        for l in b.lineas {
            print(String(format: "   +%5.2f s  dura %5.2f s", l.desde, l.duracion))
        }
    }
    let densos = bloques.filter { $0.esDenso(ajustes) }
    let minimo = bloques.map(\.duracion).min() ?? 0
    print("\nBloques: \(bloques.count) · densos: \(densos.count) · bloque más corto: \(String(format: "%.1f", minimo)) s")
} catch {
    print("No pude leer el JSON de LRCLIB: \(error)")
    exit(1)
}
