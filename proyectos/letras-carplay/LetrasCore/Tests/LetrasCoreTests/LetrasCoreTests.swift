import Foundation
import XCTest
@testable import LetrasCore

// Letra inventada para las pruebas (nunca letras reales en el repo).
let letraDePrueba = """
[ar:Artista de prueba]
[ti:Canción de ejemplo]
[00:04.00] Súbele, que esta parte
[00:07.50] nos la sabemos todas
[00:11.20] aunque ninguna la cante bien
[00:15.00] la ventana abajo y el semáforo en rojo
[00:19.40]
[00:24.00] y tú gritando el coro
[00:26.00][01:10.00] como si lo hubieras escrito tú
[00:28.00] otra vez desde el principio
[00:30.00] que todavía no llegamos
"""

final class LRCTests: XCTestCase {
    func testIgnoraMetadatosYOrdena() {
        let lineas = LRC.parse(letraDePrueba)
        XCTAssertEqual(lineas.first, LineaLetra(tiempo: 4, texto: "Súbele, que esta parte"))
        XCTAssertEqual(lineas.map(\.tiempo), lineas.map(\.tiempo).sorted())
        XCTAssertFalse(lineas.contains { $0.texto.contains("Artista") })
    }

    func testVariasMarcasRepitenLaLinea() {
        let coro = LRC.parse(letraDePrueba).filter { $0.texto == "como si lo hubieras escrito tú" }
        XCTAssertEqual(coro.map(\.tiempo), [26, 70])
    }

    func testConservaSilencios() {
        XCTAssertTrue(LRC.parse(letraDePrueba).contains(LineaLetra(tiempo: 19.4, texto: "")))
    }

    func testFormatosDeTiempo() {
        XCTAssertEqual(LRC.segundos(de: "01:02"), 62)
        XCTAssertEqual(LRC.segundos(de: "01:02.5"), 62.5)
        XCTAssertEqual(LRC.segundos(de: "00:00.123")!, 0.123, accuracy: 0.0001)
        XCTAssertNil(LRC.segundos(de: "ti:Canción"))
        XCTAssertNil(LRC.segundos(de: "00:75.00"))
    }
}

final class BloquesTests: XCTestCase {
    let letra = LRC.parse(letraDePrueba)

    func testCadaBloqueCubreElMinimoSiCabe() {
        let bloques = Bloques.dividir(letra, duracionCancion: 90)
        // 4, 7.5, 11.2, 15 → el 4.º llega justo antes de completar 15 s desde las 4.
        XCTAssertEqual(bloques[0].inicio, 4)
        XCTAssertEqual(bloques[0].lineas.count, 4)
        XCTAssertEqual(bloques[0].fin, 24)
        XCTAssertFalse(bloques[0].esDenso(Ajustes()))
    }

    func testSilencioCortaLaLineaAnterior() {
        let bloques = Bloques.dividir(letra, duracionCancion: 90)
        let ultima = bloques[0].lineas.last!
        XCTAssertEqual(ultima.desde, 11, accuracy: 0.001)
        XCTAssertEqual(ultima.duracion, 4.4, accuracy: 0.001) // 15 → 19.4, no hasta 24
    }

    func testBloqueDensoCuandoNoCabeEnCuatroLineas() {
        let bloques = Bloques.dividir(letra, duracionCancion: 90)
        // 24, 26, 28, 30 → cuatro líneas en 6 s, pero la siguiente es 70: no es denso.
        XCTAssertFalse(bloques[1].esDenso(Ajustes()))
        // Con máximo 3 líneas: [4, 7.5, 11.2] y luego [15, 24, 26], que cierra a los 28 (13 s).
        let apretados = Bloques.dividir(letra, duracionCancion: 90, ajustes: Ajustes(maximoLineas: 3))
        XCTAssertEqual(apretados[1].inicio, 15)
        XCTAssertEqual(apretados[1].duracion, 13, accuracy: 0.001)
        XCTAssertTrue(apretados[1].esDenso(Ajustes()))
    }

    func testUltimoBloqueTerminaConLaCancion() {
        let bloques = Bloques.dividir(letra, duracionCancion: 90)
        XCTAssertEqual(bloques.last!.fin, 90)
        XCTAssertEqual(bloques.last!.lineas.last!.duracion, 20, accuracy: 0.001)
    }

    func testBuscaElBloqueQueSuena() {
        let bloques = Bloques.dividir(letra, duracionCancion: 90)
        XCTAssertEqual(Bloques.bloque(en: 0, de: bloques), bloques[0]) // intro
        XCTAssertEqual(Bloques.bloque(en: 25, de: bloques), bloques[1])
        XCTAssertEqual(Bloques.bloque(en: 89, de: bloques), bloques.last)
    }

    func testAncladoConvierteAFechasReales() {
        let bloque = Bloques.dividir(letra, duracionCancion: 90)[0]
        let ahora = Date(timeIntervalSince1970: 1_000)
        // La canción va en el segundo 6: la línea 2 (7.5) empieza en 1.5 s.
        let anclado = bloque.anclado(posicion: 6, ahora: ahora)
        XCTAssertEqual(anclado.lineas[1].inicio.timeIntervalSince(ahora), 1.5, accuracy: 0.001)
        XCTAssertEqual(anclado.lineas[0].inicio.timeIntervalSince(ahora), -2, accuracy: 0.001)
        XCTAssertEqual(anclado.siguienteActualizacion.timeIntervalSince(ahora), 18, accuracy: 0.001)
        XCTAssertFalse(anclado.enPausa)
    }

    func testEnPausaNoAvanza() {
        let bloque = Bloques.dividir(letra, duracionCancion: 90)[0]
        let ahora = Date(timeIntervalSince1970: 1_000)
        let anclado = bloque.anclado(posicion: 6, ahora: ahora, velocidad: 0)
        XCTAssertTrue(anclado.enPausa)
        XCTAssertTrue(anclado.lineas.allSatisfy { $0.inicio == ahora && $0.fin == ahora })
    }

    func testLetraVacia() {
        XCTAssertTrue(Bloques.dividir([], duracionCancion: 90).isEmpty)
        XCTAssertNil(Bloques.bloque(en: 10, de: []))
    }
}

final class LRCLIBTests: XCTestCase {
    func testDecodificaYComparaDuracion() throws {
        let json = """
        {"id":1,"trackName":"Canción de ejemplo","artistName":"Artista de prueba","albumName":null,
         "duration":91.0,"instrumental":false,"plainLyrics":"x","syncedLyrics":"[00:04.00] Súbele"}
        """
        let pista = try JSONDecoder().decode(PistaLRCLIB.self, from: Data(json.utf8))
        XCTAssertEqual(pista.letra, [LineaLetra(tiempo: 4, texto: "Súbele")])
        XCTAssertTrue(pista.coincide(conDuracion: 89))
        XCTAssertFalse(pista.coincide(conDuracion: 95))
    }

    func testURL() {
        let url = LRCLIB.urlGet(cancion: "Canción", artista: "Artista", duracion: 263.4)
        XCTAssertTrue(url.absoluteString.hasPrefix("https://lrclib.net/api/get?"))
        XCTAssertTrue(url.absoluteString.contains("duration=263"))
    }
}
