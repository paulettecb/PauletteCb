# KYN Flotante (nombre placeholder — cámbialo cuando quieras)

Suite de utilidades flotantes para Mac: lector, recordatorios/board y
journal, viviendo en la barra de menú. Nace del issue #161.

## Estado: esqueleto (fase 1)
- [x] App Electron con ícono en la barra de menú (tray) + panel principal
  con 3 pestañas (Lector / Recordatorios / Journal), estilos KYN.
- [x] Overlay de prueba: ventana transparente, siempre-encima y
  click-through, togglable desde el tray o el panel — valida el mecanismo
  central antes de meterle contenido real.
- [x] Board Pendientes/Programados: agregar, ver, eliminar. Sin fecha →
  Pendientes; con fecha/hora → Programados (ordenado por fecha).
- [x] Journal: agregar entradas con fecha, exportar todo como texto al
  portapapeles (para pasártelo tú misma en un chat).
- [ ] Enlazar el lector-kyn real (`proyectos/packages/lector-kyn/`) dentro
  del overlay.
- [ ] Pausa-por-click en el overlay (choca con el click-through, se
  resuelve aparte — probablemente con zonas de `setIgnoreMouseEvents` en
  vez de toda la ventana, o un hook global de mouse).
- [ ] Kenna cruzando la pantalla con el recordatorio cuando llega la hora
  de un "programado" (falta decidir el arte: las 8 poses actuales son de
  cursor —`mediapipe-lab/src/styles.css`—, no un ciclo de caminata).
- [ ] Ícono del tray de verdad (hoy usa el favicon del sitio, no un
  ícono "template" blanco/negro que se adapte a modo claro/oscuro).
- [ ] Empaquetar en `.dmg` sin firmar (para instalar en Aplicaciones sin
  correr desde código cada vez).

## Cómo correrlo (necesitas tu Mac — este código se escribió sin poder probarlo)
```
cd proyectos/kyn-flotante
npm install
npm start
```
Debería aparecer un ícono nuevo en la barra de menú de arriba. Click ahí:
abre el panel, o prende/apaga el overlay de prueba (una pastilla azul
arriba a la derecha de la pantalla que no debería estorbarte para hacer
click en nada de abajo).

## Datos
Board y journal se guardan en `localStorage` de la ventana del panel — o
sea, viven en tu Mac, sin sincronizarse a ningún lado (igual que Cuentas
Claras). Si borras datos de la app o reinstalas, se pierden.

## Ojo ⚠️
- No es parte del sitio web: no está en `scripts/build-all.mjs` ni se
  despliega a Netlify/GitHub Pages. Es una app local.
- Se escribió en un entorno Linux sin Mac — puede que la primera corrida
  truene por algo específico de macOS (permisos, tray, tamaño de
  pantalla con varios monitores, etc.). Repórtalo con lo que veas en la
  consola y se ajusta.
