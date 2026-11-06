// Mapa en web con maplibre-gl (mismo enfoque que apps/web/src/app/t/[token]/TrackingMap.tsx).
import 'maplibre-gl/dist/maplibre-gl.css';
import { Map as MapLibre, Marker, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

import { MAP_STYLE_URL, mapFeatures, mapFraming, type LiveMapProps } from './mapTypes';

// maplibre-gl 6 deduce su worker de import.meta.url, que Metro reescribe: se sirve desde public/ (lo copia el
// script postinstall desde node_modules, misma versión).
setWorkerUrl('/maplibre-gl-worker.mjs');

const PADDING = 40;

function pinElement(live: boolean) {
  const el = document.createElement('div');
  el.className = live ? 'ay-pin ay-live' : 'ay-pin';
  // Tres anillos tipo radar (CSS en global.css; quietos con prefers-reduced-motion).
  for (let i = 0; i < 3; i++) el.appendChild(document.createElement('span')).className = 'ay-ring';
  return el;
}

export function LiveMap({ point, trail = [], live = false, height, interactive = false, label }: LiveMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapLibre | null>(null);
  const pin = useRef<Marker | null>(null);
  const inicio = useRef<Marker | null>(null);
  const ultimo = useRef({ point, trail, live });

  // Crea el mapa una sola vez.
  useEffect(() => {
    const d = ultimo.current;
    const encuadre = mapFraming(d);
    const map = new MapLibre({
      container: ref.current!,
      style: MAP_STYLE_URL,
      interactive,
      ...(encuadre.kind === 'bounds'
        ? { bounds: encuadre.bounds, fitBoundsOptions: { padding: { top: PADDING, right: PADDING, left: PADDING, bottom: PADDING + 24 }, maxZoom: 17 } }
        : { center: encuadre.center, zoom: encuadre.zoom }),
      attributionControl: { compact: false }, // atribución visible (UI-SPEC), en oscuro y pequeña (global.css)
    });
    mapa.current = map;
    pin.current = new Marker({ element: pinElement(d.live) }).setLngLat([d.point.lon, d.point.lat]).addTo(map);
    map.on('load', () => {
      const f = mapFeatures(ultimo.current);
      map.addSource('precision', { type: 'geojson', data: f.precision });
      map.addSource('trail', { type: 'geojson', data: f.trail });
      map.addLayer({ id: 'precision-fill', type: 'fill', source: 'precision', paint: { 'fill-color': colors.accent, 'fill-opacity': 0.15 } });
      map.addLayer({
        id: 'precision-line',
        type: 'line',
        source: 'precision',
        paint: { 'line-color': colors.accent, 'line-opacity': 0.4, 'line-width': 1.5 },
      });
      map.addLayer({
        id: 'trail',
        type: 'line',
        source: 'trail',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': colors.accent, 'line-opacity': 0.6, 'line-width': 4 },
      });
    });
    return () => {
      map.remove();
      mapa.current = null;
    };
    // interactive se fija al crear: cambiarlo en caliente no es un caso de uso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cada punto real nuevo: mueve pin, capas, marcador de inicio y (en vivo) la cámara.
  useEffect(() => {
    ultimo.current = { point, trail, live };
    const map = mapa.current;
    if (!map) return;
    pin.current?.setLngLat([point.lon, point.lat]);
    pin.current?.getElement().classList.toggle('ay-live', live);
    const f = mapFeatures({ point, trail });
    (map.getSource('precision') as GeoJSONSource | undefined)?.setData(f.precision);
    (map.getSource('trail') as GeoJSONSource | undefined)?.setData(f.trail);

    const primero = trail.length > 1 ? trail[0] : null;
    if (primero && !inicio.current) {
      const el = document.createElement('div');
      el.className = 'ay-start';
      inicio.current = new Marker({ element: el }).setLngLat([primero.lon, primero.lat]).addTo(map);
    } else if (primero) inicio.current?.setLngLat([primero.lon, primero.lat]);

    if (live) map.easeTo({ center: [point.lon, point.lat], duration: 600 });
  }, [point, trail, live]);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[styles.caja, { height }]}
    >
      <div ref={ref} style={{ position: 'absolute', inset: 0 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
});
