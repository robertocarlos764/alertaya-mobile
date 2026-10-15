// Chequeo ejecutable sin framework: `node src/demo/logic.check.ts`
import {
  ago,
  appendTrail,
  DEFAULT_SETTINGS,
  deliveryRows,
  formatElapsed,
  formatPhone,
  initials,
  mapsUrl,
  normalizePhone,
  osmEmbedUrl,
  sanitizeSettings,
  simulatedStatus,
  trailPath,
} from './logic.ts';

function eq(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: esperado ${String(expected)}, obtenido ${String(actual)}`);
  }
}

eq(normalizePhone('300 123 4567'), '+573001234567', 'normalizePhone local');
eq(normalizePhone('+57 300 123 4567'), '+573001234567', 'normalizePhone con prefijo');
eq(normalizePhone('2001234567'), null, 'normalizePhone no empieza por 3');
eq(normalizePhone('30012'), null, 'normalizePhone corto');
eq(formatPhone('+573001234567'), '+57 300 123 4567', 'formatPhone');
eq(initials('María García'), 'MG', 'initials');
eq(initials(''), '?', 'initials vacío');

const ok = '+573001234567';
eq(simulatedStatus(0, ok, 0), 'en_cola', 'ok 0');
eq(simulatedStatus(0, ok, 3000), 'enviado', 'ok 3000');
eq(simulatedStatus(0, ok, 7000), 'entregado', 'ok 7000');
const falla = '+573000000000';
eq(simulatedStatus(0, falla, 3000), 'en_cola', 'falla 3000');
eq(simulatedStatus(0, falla, 6000), 'fallido', 'falla 6000');

// Orden de estados: con el tiempo un contacto nunca retrocede (en_cola -> enviado -> entregado | fallido).
const RANGO = { en_cola: 0, enviado: 1, entregado: 2, fallido: 2 };
for (const tel of [ok, falla]) {
  for (let i = 0; i < 3; i++) {
    let previo = 0;
    for (let ms = 0; ms <= 15000; ms += 250) {
      const r = RANGO[simulatedStatus(i, tel, ms)];
      eq(r >= previo, true, `simulatedStatus no retrocede (${tel}, ${i}, ${ms})`);
      previo = r;
    }
  }
}
eq(simulatedStatus(0, falla, 60000) === 'fallido' && simulatedStatus(0, ok, 60000) === 'entregado', true, 'estados finales');

eq(formatElapsed(65000), '01:05', 'formatElapsed min');
eq(formatElapsed(3723000), '1:02:03', 'formatElapsed hora');
eq(formatElapsed(3725000), '1:02:05', 'formatElapsed 01-14 Test 5');
eq(ago(12000), 'hace 12 s', 'ago s');
eq(ago(130000), 'hace 2 min', 'ago min');

// appendTrail
const p = (at: number) => ({ at, lat: 0, lon: 0 });
eq(appendTrail([p(1), p(2)], p(2)).length, 2, 'appendTrail mismo at');
let t: { at: number }[] = [];
for (let i = 1; i <= 60; i++) t = appendTrail(t, p(i), 50);
eq(t.length, 50, 'appendTrail max 50');
eq(t[t.length - 1].at, 60, 'appendTrail último es el más nuevo');

// trailPath (lat 4.65 / lon -74.05: Bogotá, solo para el chequeo)
eq(trailPath([], 300, 200, 20).d, '', 'trailPath vacío');
const uno = trailPath([{ lat: 4.65, lon: -74.05 }], 300, 200, 20);
eq(uno.xy[0].x, 150, 'trailPath un punto x');
eq(uno.xy[0].y, 100, 'trailPath un punto y');
const dos = trailPath([{ lat: 4.65, lon: -74.05 }, { lat: 4.66, lon: -74.04 }], 300, 200, 20);
eq(dos.d.startsWith('M'), true, 'trailPath empieza con M');
eq(dos.d.includes(' L'), true, 'trailPath contiene L');
eq(dos.xy[1].y < dos.xy[0].y, true, 'trailPath norte arriba');

// URLs
const osm = osmEmbedUrl(4.65, -74.05);
eq(osm.includes('bbox='), true, 'osm bbox');
eq(osm.includes('marker=4.65000,-74.05000'), true, 'osm marker 5 decimales');
eq(mapsUrl(4.65, -74.05), 'https://www.google.com/maps/search/?api=1&query=4.65,-74.05', 'mapsUrl');

// deliveryRows
const cs = [{ nombre: 'A', telefono: '+573001234567' }, { nombre: 'B', telefono: '+573000000000' }];
const filas = deliveryRows(cs, 6000);
eq(filas[1].estado, simulatedStatus(1, '+573000000000', 6000), 'deliveryRows fila 1');
eq(filas[0].estado, simulatedStatus(0, '+573001234567', 6000), 'deliveryRows fila 0');
eq(filas[0].nombre, 'A', 'deliveryRows conserva campos');

// sanitizeSettings
eq(sanitizeSettings(null).countdownSeconds, DEFAULT_SETTINGS.countdownSeconds, 'settings null');
eq(DEFAULT_SETTINGS.countdownSeconds, 5, 'settings por defecto 5 s');
eq(DEFAULT_SETTINGS.silencioso, false, 'settings por defecto no silencioso');
eq(sanitizeSettings({ countdownSeconds: 7, silencioso: true }).countdownSeconds, 5, 'settings 7 -> 5');
eq(sanitizeSettings({ countdownSeconds: 5, silencioso: 'si' }).silencioso, false, 'settings silencioso no booleano');
const ok10 = sanitizeSettings({ countdownSeconds: 10, silencioso: true });
eq(ok10.countdownSeconds === 10 && ok10.silencioso === true, true, 'settings 10/true se conserva');

console.log('logic ok');
