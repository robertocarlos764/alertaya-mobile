// Chequeo ejecutable sin framework: `node src/data/geo.check.ts`
import {
  boundsOf,
  expoParts,
  formatDistance,
  haversineM,
  nominatimParts,
  placeLabel,
  placeLine,
  precisionCircle,
  shouldRegeocode,
  trailSummary,
} from './geo.ts';

// Sin @types/node: un assert mínimo (igual que logic.check.ts).
const assert = {
  ok(c: boolean, m = 'falló') {
    if (!c) throw new Error(m);
  },
  equal(a: unknown, b: unknown, m = '') {
    if (a !== b) throw new Error(`${m}: esperado ${String(b)}, obtenido ${String(a)}`);
  },
  deepEqual(a: unknown, b: unknown, m = '') {
    if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
  },
};

const near = (a: number, b: number, tol: number, label: string) => assert.ok(Math.abs(a - b) <= tol, `${label}: ${a} vs ${b}`);

// haversine: 0,001° de latitud ≈ 111,2 m; Bogotá -> Medellín ≈ 240 km.
near(haversineM({ lat: 4.6, lon: -74.08 }, { lat: 4.601, lon: -74.08 }), 111.2, 0.5, '0,001° lat');
near(haversineM({ lat: 4.711, lon: -74.072 }, { lat: 6.244, lon: -75.581 }), 240_000, 3_000, 'Bogotá-Medellín');
assert.equal(haversineM({ lat: 1, lon: 2 }, { lat: 1, lon: 2 }), 0, 'mismo punto');

// trailSummary: distancia = suma de tramos, duración = último - primero.
const t0 = 1_000_000;
const s = trailSummary([
  { lat: 4.6, lon: -74.08, at: t0 },
  { lat: 4.601, lon: -74.08, at: t0 + 60_000 },
  { lat: 4.602, lon: -74.08, at: t0 + 150_000 },
]);
assert.equal(s.points, 3);
near(s.distanceM, 222.4, 1, 'distancia del trayecto');
assert.equal(s.durationMs, 150_000, 'duración');
assert.deepEqual(trailSummary([]), { points: 0, distanceM: 0, durationMs: 0 }, 'sin puntos');
assert.deepEqual(trailSummary([{ lat: 1, lon: 1, at: 5 }]), { points: 1, distanceM: 0, durationMs: 0 }, 'un punto');

assert.equal(formatDistance(347), '350 m');
assert.equal(formatDistance(1234), '1,2 km');

// precisionCircle (01-15 Test 4): 49 puntos, cerrado, a 50 m ± 1 m.
const ring = precisionCircle(4.6, -74.08, 50);
assert.equal(ring.length, 49);
assert.deepEqual(ring[0], ring[48]);
for (const [lon, lat] of ring) near(haversineM({ lat: 4.6, lon: -74.08 }, { lat, lon }), 50, 1, 'radio');

assert.deepEqual(boundsOf([{ lat: 2, lon: -3 }, { lat: 1, lon: -1 }]), [-3, 1, -1, 2], 'bounds oeste,sur,este,norte');

// shouldRegeocode: primera vez, > 100 m o > 2 min; nada de consultas por moverse 30 m en 10 s.
const p = { lat: 4.6, lon: -74.08, at: t0 };
assert.equal(shouldRegeocode(null, p), true, 'primera vez');
assert.equal(shouldRegeocode(p, { lat: 4.6003, lon: -74.08, at: t0 + 10_000 }), false, '33 m y 10 s');
assert.equal(shouldRegeocode(p, { lat: 4.6015, lon: -74.08, at: t0 + 10_000 }), true, '167 m');
assert.equal(shouldRegeocode(p, { ...p, at: t0 + 121_000 }), true, 'más de 2 min');
assert.equal(shouldRegeocode(p, { ...p, at: t0 + 119_000 }), false, 'menos de 2 min quieto');

// placeLabel: calle + número, barrio, ciudad; sin repetidos; vacío -> null (nunca inventado).
assert.equal(
  placeLabel({ street: 'Calle 72', number: '10-34', neighbourhood: 'Chapinero', city: 'Bogotá' }),
  'Calle 72 10-34, Chapinero, Bogotá',
);
assert.equal(placeLabel({ neighbourhood: 'Bogotá', city: 'bogotá' }), 'Bogotá', 'sin repetir');
assert.equal(placeLabel({ street: '  ', city: null }), null, 'sin datos');
assert.equal(placeLabel(null), null);
assert.equal(
  placeLabel(nominatimParts({ address: { road: 'Carrera 7', suburb: 'La Candelaria', city: 'Bogotá' } })),
  'Carrera 7, La Candelaria, Bogotá',
);
assert.equal(placeLabel(nominatimParts({ error: 'Unable to geocode' })), null, 'Nominatim sin dirección');
assert.equal(placeLabel(expoParts({ street: null, district: 'El Poblado', city: null, region: 'Antioquia' })), 'El Poblado, Antioquia');

// placeLine: nombre, "Buscando dirección…" o coordenadas reales con precisión.
const fix = { lat: 4.6123456, lon: -74.0812345, accuracy: 12 };
assert.equal(placeLine('Chapinero, Bogotá', 'listo', fix), 'Chapinero, Bogotá');
assert.equal(placeLine(null, 'buscando', fix), 'Buscando dirección…');
assert.equal(placeLine(null, 'sin-nombre', fix), '4.61235, -74.08123 · ±12 m');
assert.equal(placeLine(null, 'sin-nombre', { ...fix, accuracy: null }), '4.61235, -74.08123');

console.log('geo ok');
