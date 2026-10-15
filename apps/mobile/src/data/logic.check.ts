// Chequeo ejecutable sin framework: `node src/data/logic.check.ts`
import { initialScreen } from './logic.ts';

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

console.log('data logic ok');
