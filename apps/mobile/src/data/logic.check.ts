// Chequeo ejecutable sin framework: `node src/data/logic.check.ts`
import {
  alertHeadline,
  initialScreen,
  secondsLeft,
  sosAvailability,
  toDeliveryView,
  uuidV4,
} from './logic.ts';

function eq(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: esperado ${String(expected)}, obtenido ${String(actual)}`);
  }
}

// initialScreen (D-12)
eq(initialScreen({ auth: 'loading', onboarded: true, alert: 'activa' }), 'splash', 'cargando sesión -> splash');
eq(initialScreen({ auth: 'signedOut', onboarded: false, alert: null }), 'welcome', 'primer arranque');
eq(initialScreen({ auth: 'signedOut', onboarded: true, alert: 'activa' }), 'login', 'sin sesión -> login');
eq(initialScreen({ auth: 'signedIn', onboarded: true, alert: null }), 'home', 'con sesión -> inicio');
eq(initialScreen({ auth: 'signedIn', onboarded: true, alert: 'activa' }), 'alert', 'D-12 alerta activa');
eq(initialScreen({ auth: 'signedIn', onboarded: false, alert: 'finalizada' }), 'alert', 'pantalla final pendiente');

// alertHeadline (tabla de titulares de UI-SPEC, 01-14 Test 1-4)
const sub = (synced: boolean, estados: Parameters<typeof alertHeadline>[0]['estados']) =>
  alertHeadline({ synced, estados }).subtitulo;
eq(sub(false, ['en_cola', 'en_cola']), 'Guardada en tu teléfono. Avisando a tus contactos…', 'sin confirmar');
eq(sub(false, ['enviado', 'entregado']), 'Guardada en tu teléfono. Avisando a tus contactos…', 'sin servidor nada es enviado');
eq(sub(true, ['enviado', 'en_cola']), 'Mensajes enviados. Esperando confirmación de entrega.', 'enviado');
eq(sub(true, ['entregado', 'entregado', 'en_cola']), '2 de 3 contactos recibieron tu aviso.', '2 de 3');
eq(sub(true, ['entregado']), '1 de 1 contacto recibió tu aviso.', 'singular');
eq(sub(true, ['entregado', 'fallido', 'en_cola']), '1 de 3 contactos recibió tu aviso.', '1 de 3');
const todosFallan = alertHeadline({ synced: true, estados: ['fallido', 'fallido'] });
eq(todosFallan.titulo, 'No pudimos avisar a tus contactos', 'todos fallidos titulo');
eq(todosFallan.fallo, true, 'todos fallidos tono');
eq(sub(true, ['fallido', 'en_cola']), 'Guardada en tu teléfono. Avisando a tus contactos…', 'fallo parcial sin entregas');
eq(alertHeadline({ synced: true, estados: [] }).fallo, false, 'sin contactos no es fallo');

// toDeliveryView (01-13 Test 3-4)
eq(toDeliveryView('enviado', 1, true).label, 'Enviado', 'vista enviado');
eq(toDeliveryView('entregado', 1, true).label, 'Entregado', 'vista entregado');
eq(toDeliveryView('en_cola', 0, false).secondary, 'Esperando red', 'en cola sin red');
const reintento = toDeliveryView('reintento', 1, true);
eq(reintento.secondary, 'Reintentando (1 de 2)', 'reintento texto');
eq(reintento.tone, 'warning', 'reintento ambar');
eq(toDeliveryView('reintento', 5, true).secondary, 'Reintentando (2 de 2)', 'reintento tope 2');
eq(toDeliveryView('fallido', 3, true).label, 'Falló', 'vista fallido');
eq(toDeliveryView('desconocido', 0, true).label, 'En cola', 'desconocido -> en cola');
const API = ['en_cola', 'enviando', 'reintento', 'enviado', 'entregado', 'fallido', 'cancelado', 'x'];
for (const e of API) {
  for (const sync of [true, false]) {
    const v = toDeliveryView(e, 1, sync);
    if (v.label === 'Enviado') eq(e, 'enviado', `solo enviado produce Enviado (${e})`);
    if (v.label === 'Entregado') eq(e, 'entregado', `solo entregado produce Entregado (${e})`);
  }
}

// uuidV4
const id = uuidV4();
eq(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id), true, 'uuid v4 formato');
eq(uuidV4() !== id, true, 'uuid distinto');

// Cuenta regresiva de deadline absoluto (01-13 Test 1; al volver a primer plano se recalcula con la hora real)
eq(secondsLeft(10000, 5000), 5, 'faltan 5 s');
eq(secondsLeft(10000, 9999), 1, 'falta 1 ms -> 1');
eq(secondsLeft(10000, 10000), 0, 'vence');
eq(secondsLeft(10000, 20000), 0, 'nunca negativo');

// sosAvailability (01-13 Test 5)
const c = { id: '1', nombre: 'A', telefono: '+573001234567' };
eq(sosAvailability({ status: 'ready', items: [] }), 'sin-contactos', '0 contactos');
eq(sosAvailability({ status: 'error', message: 'x' }), 'disponible', 'error de carga no bloquea');
eq(sosAvailability({ status: 'loading' }), 'disponible', 'cargando no bloquea');
eq(sosAvailability({ status: 'ready', items: [c, c] }), 'disponible', '2 contactos');

console.log('data logic ok');
