// Chequeo ejecutable sin framework: `node src/demo/logic.check.ts`
import {
  ago,
  formatElapsed,
  formatPhone,
  headline,
  initials,
  normalizePhone,
  simulatedStatus,
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

eq(headline(['fallido', 'fallido']).fallo, true, 'headline todos fallidos');
eq(headline(['entregado', 'en_cola']).subtitulo, '1 de 2 contactos recibieron tu aviso.', 'headline entregado');
eq(headline(['enviado', 'en_cola']).subtitulo, 'Mensajes enviados. Esperando confirmación de entrega.', 'headline enviado');
eq(headline(['en_cola']).subtitulo, 'Guardada en tu teléfono. Avisando a tus contactos…', 'headline en cola');

eq(formatElapsed(65000), '01:05', 'formatElapsed min');
eq(formatElapsed(3723000), '1:02:03', 'formatElapsed hora');
eq(ago(12000), 'hace 12 s', 'ago s');
eq(ago(130000), 'hace 2 min', 'ago min');

console.log('logic ok');
