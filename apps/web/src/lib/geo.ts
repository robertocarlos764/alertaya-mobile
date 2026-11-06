const EARTH_RADIUS_M = 6371008.8;

/** Anillo cerrado [lon, lat] de `steps + 1` puntos a `radiusM` del centro (aproximacion equirectangular). */
export function precisionCircle(lat: number, lon: number, radiusM: number, steps = 48): [number, number][] {
  const dLat = (radiusM / EARTH_RADIUS_M) * (180 / Math.PI);
  const dLon = dLat / Math.cos((lat * Math.PI) / 180);
  const ring: [number, number][] = [];
  for (let i = 0; i < steps; i++) {
    const a = (2 * Math.PI * i) / steps;
    ring.push([lon + dLon * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  ring.push(ring[0]);
  return ring;
}

export function googleMapsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}
