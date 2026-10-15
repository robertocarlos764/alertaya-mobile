// Lógica pura de la app, independiente del adaptador (sin imports de runtime: la ejecuta node en
// logic.check.ts). Firmas tomadas de los <behavior> de 01-13/01-14 para moverlas tal cual cuando haya Jest.
import type { AuthStatus } from './auth.ts';
import type { AlertEstado, DeliveryEstado } from './alerts.ts';

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

/**
 * Titular honesto de la alerta activa (tabla de UI-SPEC), derivado del estado real agregado.
 * Mientras el servidor no confirma la alerta (`synced` false) nada se da por enviado.
 */
export function alertHeadline(s: { synced: boolean; estados: DeliveryEstado[] }): {
  titulo: string;
  subtitulo: string;
  fallo: boolean;
} {
  const guardada = { titulo: 'Alerta activa', subtitulo: 'Guardada en tu teléfono. Avisando a tus contactos…', fallo: false };
  const { estados } = s;
  if (!s.synced || estados.length === 0) return guardada;
  if (estados.every((e) => e === 'fallido')) {
    return { titulo: 'No pudimos avisar a tus contactos', subtitulo: 'Llámalos directamente o al 123.', fallo: true };
  }
  const n = estados.filter((e) => e === 'entregado').length;
  const m = estados.length;
  if (n > 0) {
    const sujeto = m === 1 ? 'contacto' : 'contactos';
    const verbo = n === 1 ? 'recibió' : 'recibieron';
    return { titulo: 'Alerta activa', subtitulo: `${n} de ${m} ${sujeto} ${verbo} tu aviso.`, fallo: false };
  }
  if (estados.includes('enviado')) {
    return { titulo: 'Alerta activa', subtitulo: 'Mensajes enviados. Esperando confirmación de entrega.', fallo: false };
  }
  return guardada;
}

export type DeliveryTone = 'muted' | 'warning' | 'info' | 'success' | 'danger';
export type DeliveryView = { label: string; secondary: string; tone: DeliveryTone; icon: string };

/**
 * Estado crudo del servidor -> lo que se pinta (tabla de UI-SPEC). Solo 'enviado' produce "Enviado" y solo
 * 'entregado' produce "Entregado"; un valor desconocido cae en "En cola" (SOS-04).
 */
export function toDeliveryView(estado: string, intentos: number, sincronizada: boolean): DeliveryView {
  switch (estado) {
    case 'enviado':
      return { label: 'Enviado', secondary: 'Esperando confirmación de entrega', tone: 'info', icon: 'check' };
    case 'entregado':
      return { label: 'Entregado', secondary: 'Confirmado por el operador', tone: 'success', icon: 'done-all' };
    case 'fallido':
      return { label: 'Falló', secondary: 'No se pudo enviar el SMS', tone: 'danger', icon: 'error-outline' };
    case 'reintento':
      return {
        label: 'En cola',
        secondary: `Reintentando (${Math.min(Math.max(intentos, 1), 2)} de 2)`,
        tone: 'warning',
        icon: 'schedule',
      };
    case 'cancelado':
      return { label: 'Cancelado', secondary: 'No se envió', tone: 'muted', icon: 'block' };
    default: // en_cola, enviando y cualquier valor desconocido
      return {
        label: 'En cola',
        secondary: sincronizada ? 'Preparando el SMS' : 'Esperando red',
        tone: 'muted',
        icon: 'schedule',
      };
  }
}

/** UUID v4 para clientGeneratedId. ponytail: Math.random basta para una clave de idempotencia por usuario; 01-13 usa expo-crypto. */
export function uuidV4(rand: () => number = Math.random): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(rand() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
