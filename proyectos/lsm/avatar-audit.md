# Auditoría técnica de `avatar.glb`

Fecha de ejecución: 2026-07-01.

## Archivo objetivo

- Ruta: `proyectos/lsm/lsm-app-main/src/assets/avatar.glb`
- Estado en el checkout: puntero de Git LFS, no binario GLB real.
- OID LFS esperado: `sha256:716b3b9004db841d3e8275b8d8665c3291e37e692eda78b846912737f987b78a`
- Tamaño esperado del objeto real: `54000644` bytes.

## Descarga con Git LFS

Se verificó que Git LFS está disponible en el entorno:

```bash
git lfs version
# git-lfs/3.4.1 (GitHub; linux amd64; go 1.22.2)
```

Se intentó descargar únicamente el asset solicitado:

```bash
git lfs pull --include='proyectos/lsm/lsm-app-main/src/assets/avatar.glb'
```

Resultado:

```text
batch request: missing protocol: ""
Failed to fetch some objects from ''
```

El repositorio local no tiene un remoto Git configurado ni una URL LFS asociada, por lo que `git lfs pull` no puede resolver desde dónde descargar el objeto. También se buscó el objeto en la caché local de `.git/lfs/objects`, sin encontrarlo.

## Inspección GLB

Se ejecutó un script local de inspección GLB que:

1. Lee el archivo `avatar.glb`.
2. Detecta si el contenido es un puntero de Git LFS.
3. Si es un GLB real, abre el chunk JSON del contenedor GLB.
4. Extrae las secciones `skins`, `nodes`, `animations`, `meshes` y `materials` para auditar huesos, jerarquía, skeleton, meshes asociados, materiales y posibles morph targets.

Resultado actual:

```text
LFS_POINTER
version https://git-lfs.github.com/spec/v1
oid sha256:716b3b9004db841d3e8275b8d8665c3291e37e692eda78b846912737f987b78a
size 54000644
```

Debido a que el archivo presente sigue siendo un puntero LFS de 133 bytes y no el binario GLB real de 54,000,644 bytes, no fue posible inspeccionar contenido GLB estructural.

## Reporte solicitado

### `skins`

No disponible. El GLB real no está presente en este checkout.

### `nodes`

No disponible. El GLB real no está presente en este checkout.

### `animations`

No disponible. El GLB real no está presente en este checkout.

### Nombres de huesos

No disponible. Los nombres de huesos normalmente se derivan de los `nodes` referenciados por `skins[*].joints`, pero el JSON interno del GLB no está disponible porque falta el objeto LFS real.

### Jerarquía del skeleton

No disponible. La jerarquía normalmente se reconstruye desde `nodes[*].children` y las raíces indicadas por `skins[*].skeleton`, pero el JSON interno del GLB no está disponible.

### Meshes asociados

No disponible. Los meshes asociados normalmente se identifican desde `nodes[*].mesh` y `meshes[*]`, pero el JSON interno del GLB no está disponible.

### Materiales

No disponible. Los materiales normalmente se extraen de `materials[*]` y de `meshes[*].primitives[*].material`, pero el JSON interno del GLB no está disponible.

### Posibles morph targets

No disponible. Los morph targets normalmente se revisan en `meshes[*].primitives[*].targets` y, si existen, sus nombres pueden aparecer en `meshes[*].extras.targetNames`, pero el JSON interno del GLB no está disponible.

## Conclusión

No se debe intentar crear ni sustituir el avatar todavía. Primero es necesario recuperar el objeto LFS real correspondiente al OID `716b3b9004db841d3e8275b8d8665c3291e37e692eda78b846912737f987b78a` desde un remoto Git/LFS válido o mediante un artefacto equivalente del repositorio. Una vez presente el GLB real, debe repetirse la inspección estructural antes de cualquier reemplazo.
