---
phase: quick-261015-map
plan: 01
type: execute
wave: 1
depends_on: []
autonomous: true
# Tarea rápida sobre el prototipo demo: no completa 01-15 (sin servidor ni envío de ubicación), pero deja
# el mapa (LocationMiniMap) y la lógica de geo listos para él.
requirements: [QUICK-261015-map]
prepares: [01-15]
files_modified:
  - apps/mobile/package.json
  - apps/mobile/app.json
  - apps/mobile/src/theme.ts
  - apps/mobile/src/components/ui.tsx
  - apps/mobile/src/components/LiveMap.tsx
  - apps/mobile/src/components/LiveMap.web.tsx
  - apps/mobile/src/components/LiveMapNative.tsx
  - apps/mobile/src/components/Pulse.tsx
  - apps/mobile/src/components/TrailMap.tsx
  - apps/mobile/src/data/geo.ts
  - apps/mobile/src/data/geo.check.ts
  - apps/mobile/src/lib/usePlaceName.ts
  - apps/mobile/src/app/(app)/location.tsx
  - apps/mobile/src/app/(app)/alert.tsx
  - apps/mobile/src/app/(app)/history/[id].tsx
  - apps/mobile/src/app/(app)/(tabs)/index.tsx
  - apps/mobile/src/app/**

must_haves:
  truths:
    - "El acento es el rojo #E8212B del legacy (botones primarios, pestaña activa, enlaces, foco) sobre #0D0D0D/#1A1A1A/#2A2A2A; sin violeta ni cian; el glow rojo se conserva"
    - "En web ningún TextInput ni Pressable muestra el outline blanco del navegador; el foco se ve como borde/anillo rojo #E8212B"
    - "Un único componente de mapa (LiveMap): maplibre-gl en web, @maplibre/maplibre-react-native en development build y el SVG en Expo Go, decidido en runtime sin crashear"
    - "Pulso tipo radar rojo y círculo de precisión real en la alerta activa y en Ubicación actual; el mapa solo se mueve con fixes reales"
    - "Ubicación actual: pantalla nueva con mapa, pulso, precisión, antigüedad, nombre del lugar y Abrir en Google Maps; sin permiso o sin GPS dice 'Ubicación pendiente'"
    - "Geocodificación inversa: nativo con expo-location, web con Nominatim; una consulta por cambio > 100 m o > 2 min, caché en memoria, nunca un nombre inventado"
    - "Historial: trayecto en el mapa con inicio y fin, horas, duración, distancia (haversine), número de puntos y lugar de inicio; sin puntos lo dice"
---

<objective>
Pedido de Roberto tras revisar el prototipo en el navegador: volver al rojo del proyecto original, quitar el
recuadro blanco de foco en web, mapas reales (MapLibre) con pulso tipo radar, pantalla "Ubicación actual" con
nombre del lugar, mini mapa directo en la alerta activa y un historial con un recorrido que diga algo.
</objective>

<tasks>

<task type="auto">
  <name>Tarea 1: Rojo como acento y foco propio</name>
  <action>theme.ts con los tokens del legacy/UI-SPEC; fuera violeta, cian y magenta (degradados solo en rojo).
  Avatar #2A2A2A, chip seleccionado con borde rojo, FAB rojo, enlaces rojos. TextField: outlineStyle none en web y
  borde rojo al enfocar. PressableScale/Button: sin outline del navegador y anillo rojo con :focus-visible
  (estado `focused` de Pressable en RNW).</action>
  <verify>tsc, lint; grep de cyan/violet/magenta vacío</verify>
</task>

<task type="auto">
  <name>Tarea 2: Lógica de geo + LiveMap por plataforma + pulso</name>
  <action>`npx expo install @maplibre/maplibre-react-native@11.5.0 maplibre-gl@6.13.0`. `src/data/geo.ts` puro
  (haversine, distancia del trayecto, resumen, precisionCircle, shouldRegeocode, placeLabel, placeLine) con
  `geo.check.ts`. `LiveMap.web.tsx` (maplibre-gl, worker servido desde public/), `LiveMap.tsx` (elige
  `LiveMapNative` o el SVG en Expo Go con Constants.executionEnvironment + require protegido), `Pulse.tsx`
  (Reanimated) para el marcador nativo. Estilo OpenFreeMap dark.</action>
  <verify>node src/data/geo.check.ts; tsc; lint; expo export web</verify>
</task>

<task type="auto">
  <name>Tarea 3: Pantallas</name>
  <action>Inicio: tarjeta Ubicación actual pulsable con nombre del lugar -> `/location`. `/location`: mapa,
  pulso, precisión, antigüedad, lugar, Abrir en Google Maps. Alerta activa: mini mapa 192 directo con pulso,
  trayecto y "±n m · hace x s"; se elimina `/tracking`. Historial: mapa del trayecto con inicio/fin y resumen.</action>
  <verify>tsc; lint; checks; expo export web; smoke en Chrome headless</verify>
</task>

</tasks>
