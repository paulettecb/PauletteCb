// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "LetrasCore",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "LetrasCore", targets: ["LetrasCore"]),
        .executable(name: "letras-analiza", targets: ["letras-analiza"])
    ],
    targets: [
        .target(name: "LetrasCore"),
        .executableTarget(name: "letras-analiza", dependencies: ["LetrasCore"]),
        .testTarget(name: "LetrasCoreTests", dependencies: ["LetrasCore"])
    ]
)
