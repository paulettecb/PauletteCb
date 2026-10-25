import Foundation

/// Respuesta de `https://lrclib.net/api/get` y de cada resultado de `/api/search`.
public struct PistaLRCLIB: Decodable, Equatable, Sendable {
    public let id: Int
    public let trackName: String
    public let artistName: String
    public let albumName: String?
    public let duration: TimeInterval
    public let instrumental: Bool
    public let plainLyrics: String?
    public let syncedLyrics: String?

    /// Letra sincronizada ya parseada (vacía si LRCLIB solo trae letra simple).
    public var letra: [LineaLetra] { syncedLyrics.map(LRC.parse) ?? [] }

    /// Misma regla que usa CarPlay-Lyrics: si la duración difiere más de 3 s, es otra versión
    /// de la canción (en vivo, remaster, radio edit) y los tiempos no van a cuadrar.
    public func coincide(conDuracion duracion: TimeInterval, tolerancia: TimeInterval = 3) -> Bool {
        abs(self.duration - duracion) <= tolerancia
    }
}

public enum LRCLIB {
    /// URL de búsqueda exacta. Con `duracion`, LRCLIB descarta versiones que no cuadran.
    public static func urlGet(cancion: String, artista: String, album: String? = nil,
                              duracion: TimeInterval? = nil) -> URL {
        var c = URLComponents(string: "https://lrclib.net/api/get")!
        c.queryItems = [
            URLQueryItem(name: "track_name", value: cancion),
            URLQueryItem(name: "artist_name", value: artista)
        ]
        if let album { c.queryItems?.append(URLQueryItem(name: "album_name", value: album)) }
        if let duracion { c.queryItems?.append(URLQueryItem(name: "duration", value: String(Int(duracion.rounded())))) }
        return c.url!
    }
}
