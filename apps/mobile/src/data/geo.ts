// Lógica pura de geo (sin imports de runtime: la ejecuta node en geo.check.ts). La usan los mapas, la
// pantalla de ubicación actual y el historial. 01-15 la mueve a features/location/ cuando haya Jest.

export type LatLon = { lat: number; lon: number };
export type TimedPoint = LatLon & { at: number };

const EARTH_RADIUS_M = 6371008.8;
const rad = (g: number) => (g * Math.PI) / 180;

/** Distancia en metros sobre la esfera (haversine). */
export function haversineM(a: LatLon, b: LatLon): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Resumen honesto de un trayecto: puntos, distancia aproximada (suma de tramos) y duración entre el primer y el último fix. */
export function trailSummary(trail: TimedPoint[]): { points: number; distanceM: number; durationMs: number } {
  let distanceM = 0;
  for (let i = 1; i < trail.length; i++) distanceM += haversineM(trail[i - 1], trail[i]);
  const durationMs = trail.length > 1 ? Math.max(0, trail[trail.length - 1].at - trail[0].at) : 0;
  return { points: trail.length, distanceM, durationMs };
}

/** "350 m" (redondeado a 10 m) bajo 1 km; "1,2 km" desde 1 km. */
export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}

/** Anillo cerrado [lon, lat] de `steps + 1` puntos a `radiusM` del centro (mismo algoritmo que apps/web/src/lib/geo.ts). */
export function precisionCircle(lat: number, lon: number, radiusM: number, steps = 48): [number, number][] {
  const dLat = (radiusM / EARTH_RADIUS_M) * (180 / Math.PI);
  const dLon = dLat / Math.cos(rad(lat));
  const ring: [number, number][] = [];
  for (let i = 0; i < steps; i++) {
    const a = (2 * Math.PI * i) / steps;
    ring.push([lon + dLon * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  ring.push(ring[0]);
  return ring;
}

/** Caja [oeste, sur, este, norte] de los puntos (orden de MapLibre). */
export function boundsOf(points: LatLon[]): [number, number, number, number] {
  const lons = points.map((p) => p.lon);
  const lats = points.map((p) => p.lat);
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
}

export const REGEOCODE_DISTANCE_M = 100;
export const REGEOCODE_AGE_MS = 2 * 60 * 1000;

/**
 * ¿Vale la pena una consulta nueva de geocodificación inversa? Solo con un cambio significativo: la primera
 * vez, al moverse más de ~100 m o pasados 2 min desde la última consulta (política de uso de Nominatim).
 */
export function shouldRegeocode(prev: TimedPoint | null, next: TimedPoint): boolean {
  if (!prev) return true;
  return haversineM(prev, next) > REGEOCODE_DISTANCE_M || next.at - prev.at > REGEOCODE_AGE_MS;
}

/** Clave de caché: ~11 m de resolución (4 decimales). */
export function placeKey(p: LatLon): string {
  return `${p.lat.toFixed(4)},${p.lon.toFixed(4)}`;
}

export type PlaceParts = { street?: string | null; number?: string | null; neighbourhood?: string | null; city?: string | null };

/** "Calle 72 10-34, Chapinero, Bogotá". Sin datos útiles devuelve null: nunca un nombre inventado. */
export function placeLabel(parts: PlaceParts | null): string | null {
  if (!parts) return null;
  const limpio = (s?: string | null) => (s ?? '').trim();
  const calle = [limpio(parts.street), limpio(parts.number)].filter(Boolean).join(' ');
  const trozos: string[] = [];
  for (const t of [calle, limpio(parts.neighbourhood), limpio(parts.city)]) {
    if (t && !trozos.some((x) => x.toLowerCase() === t.toLowerCase())) trozos.push(t);
  }
  return trozos.length ? trozos.join(', ') : null;
}

/** Respuesta de Nominatim (reverse, jsonv2) -> partes. */
export function nominatimParts(json: unknown): PlaceParts | null {
  const a = (json as { address?: Record<string, string> } | null)?.address;
  if (!a) return null;
  return {
    street: a.road ?? a.pedestrian ?? a.footway ?? null,
    number: a.house_number ?? null,
    neighbourhood: a.neighbourhood ?? a.suburb ?? a.quarter ?? a.city_district ?? null,
    city: a.city ?? a.town ?? a.village ?? a.municipality ?? a.state ?? null,
  };
}

/** Location.reverseGeocodeAsync (expo-location) -> partes. */
export function expoParts(a: {
  street?: string | null;
  streetNumber?: string | null;
  district?: string | null;
  city?: string | null;
  subregion?: string | null;
  region?: string | null;
} | null | undefined): PlaceParts | null {
  if (!a) return null;
  return { street: a.street, number: a.streetNumber, neighbourhood: a.district, city: a.city ?? a.subregion ?? a.region };
}

export type PlaceStatus = 'buscando' | 'listo' | 'sin-nombre';

/**
 * Línea del lugar: el nombre si existe; mientras se consulta "Buscando dirección…"; si no hay nombre, las
 * coordenadas reales con su precisión. Sin fix no se llama (la pantalla dice "Ubicación pendiente").
 */
export function placeLine(name: string | null, status: PlaceStatus, fix: LatLon & { accuracy: number | null }): string {
  if (name) return name;
  if (status === 'buscando') return 'Buscando dirección…';
  return `${fix.lat.toFixed(5)}, ${fix.lon.toFixed(5)}${fix.accuracy == null ? '' : ` · ±${fix.accuracy} m`}`;
}
