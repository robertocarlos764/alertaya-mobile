---
phase: quick-261015-map
plan: 01
subsystem: apps/mobile (prototipo demo)
tags: [expo, maplibre, mapa, geocodificacion, tema, foco, accesibilidad]
requires:
  - phase: quick-261015-pda
    provides: puertos src/data/* con adaptador demo e IS_DEMO
provides:
  - "LiveMap: punto de entrada único del mapa (maplibre-gl en web, @maplibre/maplibre-react-native en development build, SVG en Expo Go)"
  - "Pulse: pin rojo con pulso tipo radar (CSS en web, Reanimated en nativo)"
  - "src/data/geo.ts: haversine, trailSummary, precisionCircle, boundsOf, shouldRegeocode, placeLabel, placeLine (con geo.check.ts)"
  - "usePlaceName: geocodificación inversa con caché (expo-location / Nominatim)"
  - "Pantalla /location y tarjeta Ubicación actual pulsable"
affects: [apps/mobile, 01-15]
tech-stack:
  added: ["maplibre-gl 6.13.0", "@maplibre/maplibre-react-native 11.5.0 (+ config plugin)"]
  patterns:
    - "Archivo por plataforma: LiveMap.web.tsx / LiveMap.tsx; el nativo carga LiveMapNative con require protegido tras descartar Expo Go (Constants.executionEnvironment)"
    - "global.css importado en la raíz: solo web (foco, pin del mapa, atribución)"
    - "Ajuste de estado durante el render para decidir cuándo re-geocodificar (sin setState síncrono en efectos)"
decisions:
  - "Se elimina la ruta demo /tracking: el mini mapa ya muestra lo que ven los contactos y la página del contacto real existe en apps/web (/t/[token], 261015-pub)"
  - "El worker de maplibre-gl se sirve desde public/ (copiado por postinstall, en .gitignore): Metro reescribe import.meta.url"
  - "Caché de nombres por punto (~11 m): con la caché, el criterio de 2 min no genera consultas nuevas si no te moviste"
  - "Mapas no interactivos salvo el del historial (necesita zoom para ver el trayecto); los en vivo siguen cada punto real"
metrics:
  completed: 2026-10-15
  tasks: 3
  commits: 4
status: complete
---

# Quick 261015-map: Rojo, foco propio, mapas reales y ubicación — Summary

Roberto revisó el prototipo en el navegador y pidió volver al rojo del proyecto original, quitar el recuadro blanco de foco, mapas reales con un pulso tipo radar, una pantalla de ubicación actual con el nombre del lugar, el mini mapa directo en la alerta activa y un historial cuyo recorrido diga algo.

## Commits (en `dev`, base `9449ef6`)

| Bloque | Commit | Resumen |
|--------|--------|---------|
| 1-2 | `0d33fcf` | Rojo #E8212B como acento y foco propio en web |
| 3-4 + geo | `a896d6a` | LiveMap (web / development build / Expo Go), pulso, `geo.ts` + checks, `usePlaceName`, paquetes |
| 5-7 | `672214d` | `/location`, tarjeta pulsable, mini mapa en la alerta, historial con recorrido, fuera `/tracking` |
| docs | (este) | PLAN, SUMMARY y fila en STATE.md |

Nota: el borrado de `tracking.tsx` quedó en `a896d6a` y la línea `Stack.Screen name="tracking"` se quitó en `672214d`; en el commit intermedio el layout nombra una pantalla que no existe (solo un aviso de Expo Router, no rompe tsc ni el bundle).

## Qué se hizo, por punto

1. **Rojo principal.** `theme.ts` con los tokens del legacy/UI-SPEC: fondo `#0D0D0D`, surface `#1A1A1A`, borde `#2A2A2A`, acento `#E8212B`, hint `#5A5A5A`, texto secundario `#9A9A9A`, éxito `#4ADE80`, advertencia `#F5A524`. Fuera violeta, cian y magenta (y el degradado `cool`). Los degradados quedan solo en rojo (SOS, botones primarios, cuenta regresiva) y el fondo tiene un leve brillo rojo arriba: el glow se conserva. Avatar `#2A2A2A` (UI-SPEC), chip seleccionado con borde rojo, FAB rojo, Switch rojo, acción del snackbar roja, "Enviado" en blanco (tabla de estados). `app.json` `backgroundColor` a `#0D0D0D`.
2. **Foco.** `src/global.css` (solo web, importado en `_layout.tsx`): `input, textarea { outline: none }` y para `[role=button|link|switch]` y `[tabindex]` sin outline del navegador y anillo rojo 2 px con `:focus-visible` (solo con teclado; el toque no deja recuadro). El `TextField` ya pintaba borde rojo 1.5 al enfocar. Se usó CSS en vez de `outlineStyle: 'none'` porque los tipos de RN 0.86 no aceptan `'none'`; el efecto es el mismo y cubre también los Pressable. Verificado en Chrome: input `outline: none` y borde `rgb(232,33,43)`; botón y enlace con Tab: `outline: solid rgb(232,33,43) 2px`.
3. **Mapas reales.** `src/components/LiveMap` es el único punto de entrada (contrato en `mapTypes.ts`):
   - Web (`LiveMap.web.tsx`): `maplibre-gl@6.13.0`, OpenFreeMap `dark`, círculo de precisión, trayecto, marcador de inicio, atribución visible (oscura, 10 px). Worker: `setWorkerUrl('/maplibre-gl-worker.mjs')`; el script `postinstall` lo copia de `node_modules` a `public/` (ignorado en git), y `expo export` lo publica en la raíz.
   - Android development build (`LiveMapNative.tsx`): `@maplibre/maplibre-react-native@11.5.0` (`Map`, `Camera` controlada, `GeoJSONSource` + `Layer`, `Marker`), sin brújula ni logo, con atribución. `npx expo install` agregó su config plugin a `app.json`.
   - Expo Go: `LiveMap.tsx` descarta Expo Go con `Constants.executionEnvironment === StoreClient` y, si no, hace `require('./LiveMapNative')` en try/catch; si falla usa `TrailMap` (el SVG), que ahora tiene el mismo contrato, la misma línea roja, el pulso y la nota "Mapa simplificado (sin calles en Expo Go)".
   - Sin paquetes extra. npm resolvió solo el peer opcional `@types/geojson` dentro del lockfile.
4. **Pulso tipo radar.** Tres anillos rojos que crecen 7× y se desvanecen (2,4 s, desfasados 0,8 s). Web: marcador HTML con `@keyframes` (`.ay-pin`/`.ay-ring` en `global.css`); nativo: `Pulse.tsx` con Reanimated 4 dentro del `Marker`. Con reducir movimiento quedan quietos. Círculo de precisión real (relleno 15 %, borde 40 %). Se usa en la alerta activa y en `/location`; en el historial el pin final va sin pulso. Los mapas `live` siguen cada punto nuevo (`easeTo` en web, cámara controlada en nativo) y solo reciben fixes reales: `ultimaUbicacion` de la alerta o el fix de `useLocation`.
5. **Ubicación actual.** La tarjeta de Inicio es pulsable (toda la tarjeta, chevron a la derecha) y abre `src/app/(app)/location.tsx`: mapa de 360 px con pulso y precisión, "ESTÁS CERCA DE {lugar}", "Precisión ±n m · hace x s" (ámbar y "— sin actualizar" pasados 2 min) y "Abrir en Google Maps" (`Linking`). La tarjeta muestra también el lugar bajo "Ubicación lista · ±n m". `usePlaceName`: nativo `Location.reverseGeocodeAsync`, web Nominatim (`format=jsonv2`, `accept-language=es`); consulta solo si `shouldRegeocode` (primera vez, >100 m o >2 min), caché en memoria por punto (~11 m), consultas simultáneas deduplicadas, ≥1,1 s entre consultas web y los errores no se reintentan hasta el siguiente cambio significativo. Sin nombre: "Buscando dirección…" o las coordenadas con su precisión (`placeLine`). Sin permiso o sin GPS: bloque "Ubicación pendiente" con el motivo y "Permitir ubicación" / "Abrir ajustes".
6. **Alerta activa.** "UBICACIÓN QUE VEN TUS CONTACTOS" muestra ya el mini mapa de UI-SPEC (192 px, radio 16, borde `#2A2A2A`, no interactivo) con pulso, precisión y trayecto, y debajo "±n m · hace x s" (ámbar >2 min). Sin punto, el bloque "Ubicación pendiente" de siempre. **`/tracking` se eliminó**: era una vista previa demo de la página del contacto; el mapa ya está en la alerta y la página real del contacto existe en `apps/web` (`/t/[token]`, 261015-pub), así que mantener una tercera copia solo duplicaba código (iframe de OSM incluido; también se quitó `osmEmbedUrl`).
7. **Historial.** `history/[id].tsx`: resumen con "Inicio h · Fin h · Duración"; mapa del trayecto (interactivo, encuadra todo el recorrido) con marcador blanco de inicio y pin rojo de fin y leyenda con sus horas; tarjeta con "EMPEZÓ EN {lugar}" (mismas reglas del punto 5), "DISTANCIA ≈ x m/km" (haversine), "EN MOVIMIENTO" (primer a último punto) y "PUNTOS". Se quitó la lista de coordenadas crudas. Sin puntos: "No hay recorrido: esta alerta no registró ninguna ubicación (salió con ubicación pendiente)."
8. **Pulido.** Icono del mapa de la tarjeta en rojo sobre `#0D0D0D` (UI-SPEC), atribución oscura que no tapa el encuadre, padding inferior del encuadre para el marcador de inicio, `Button` sin la variante `cool`. Nada fuera de la lista. Los datos de posición siguen saliendo de los puertos (`useAlerts().current.ultimaUbicacion/trail`, historial local); el adaptador real solo tiene que llenarlos.

## Verificación

- `node src/data/geo.check.ts` -> `geo ok` (haversine, trailSummary con 0/1/3 puntos, formatDistance, precisionCircle 49 puntos a 50 m ± 1 m, boundsOf, shouldRegeocode 33 m/167 m/119 s/121 s, placeLabel con Nominatim y expo-location, placeLine). `data logic ok` y `logic ok` siguen en verde.
- `npx tsc --noEmit` y `npx expo lint`: sin errores ni advertencias.
- `npx expo export --platform web` a una carpeta temporal: compila; bundle 3.7 MB (antes 2.6 MB: maplibre-gl va en el bundle principal) + CSS de maplibre; `maplibre-gl-worker.mjs` publicado; ninguna referencia a `maplibre-react-native` en el bundle web.
- `npx expo export --platform android` a una carpeta temporal: el bundle Hermes compila (4.5 MB) con el require protegido.
- `npx expo prebuild --platform android --no-install`: termina bien con el config plugin; se borró `android/` y se revirtió el cambio de scripts que hace prebuild en `package.json` (nada commiteado).
- `npx expo-doctor`: 20/21; el único fallo es previo (parches `expo` 57.0.24 -> 57.0.30 y `expo-router` 57.0.27 -> 57.0.28).
- **Smoke en Chrome headless** (CDP, export servido en el puerto 8099, GPS simulado ±15 m): Inicio muestra "Ubicación lista · ±15 m" y "Calle 62 11-04, Chapinero, Bogotá ciudad" (Nominatim real); `/location` con canvas de MapLibre, pin con pulso y "Precisión ±15 m · hace x s"; historial con trayecto, marcador de inicio y fin, "≈ 810 m", "09:00", "4" puntos y lugar de inicio; historial sin puntos con el texto honesto; alerta activa con mini mapa, pulso y "±15 m · hace x s". Una consulta a Nominatim por carga de la app.

## Pendiente

- **Solo en development build (sin teléfono no se pudo probar):** que `LiveMapNative` pinte las teselas, la cámara siga los puntos, el `Marker` con el pulso de Reanimated se vea centrado y la atribución quede visible. También `reverseGeocodeAsync` en Android (usa el geocoder del sistema; sin servicios de Google devuelve vacío y se ven las coordenadas).
- **Expo Go en Android:** confirmar que cae al SVG sin errores (la lógica es estándar, pero no hubo teléfono).
- Bundle web: maplibre-gl podría cargarse diferido (`import()`) si el tamaño importa; no se hizo (la app es Android y la web es solo para revisar el demo).
- 01-15: mover `geo.ts` a `features/location/` cuando haya Jest y alimentar `LiveMap` con el último punto confirmado por el servidor (`ultimaUbicacion` del adaptador real). `LiveMap` es el `LocationMiniMap` de UI-SPEC.
- Patches de SDK que reporta expo-doctor (`expo`, `expo-router`): no se tocaron (fuera de alcance).
- CodeGraph no tiene indexados los archivos de `apps/mobile`: la consulta solo devolvió el legacy, así que la búsqueda se hizo con grep.

## Threat Flags

- Nuevo tráfico a terceros: teselas de OpenFreeMap (ya aceptado en T-01-69) y, en web, Nominatim de OpenStreetMap con la posición del usuario (redondeada a 6 decimales, sin cookies ni clave). Mitigación: solo con permiso de ubicación, una consulta por cambio significativo y caché en memoria. En nativo la consulta va al geocoder del sistema.

## Self-Check: PASSED

- `0d33fcf`, `a896d6a`, `672214d` en `dev`; sin push. No se tocó `apps/api`, `apps/web`, `.planning/config.json`, `milestone.lock`, `state.json` ni `.gsd/`. Sin carpeta `android/` ni `dist` nuevos en el repo.
