// Lógica pura de la app, independiente del adaptador (sin imports de runtime: la ejecuta node en
// logic.check.ts). Firmas tomadas de los <behavior> de 01-13/01-14 para moverlas tal cual cuando haya Jest.
import type { AuthStatus } from './auth.ts';
import type { AlertEstado } from './alerts.ts';

export type Pantalla = 'splash' | 'welcome' | 'login' | 'alert' | 'home';

/**
 * Pantalla al abrir/reabrir la app. Con sesión y una alerta (activa, o finalizada sin cerrar su pantalla
 * final) la única pantalla posible es /alert (D-12).
 */
export function initialScreen(s: { auth: AuthStatus; onboarded: boolean; alert: AlertEstado | null }): Pantalla {
  if (s.auth === 'loading') return 'splash';
  if (s.auth === 'signedOut') return s.onboarded ? 'login' : 'welcome';
  return s.alert ? 'alert' : 'home';
}
