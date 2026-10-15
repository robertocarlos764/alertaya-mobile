// Lógica pura del modo demo (sin imports: la ejecuta node directamente en logic.check.ts).
export type DeliveryState = 'en_cola' | 'enviado' | 'entregado' | 'fallido';

/** Devuelve +57XXXXXXXXXX si es un celular colombiano válido; si no, null. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('57')) digits = digits.slice(2);
  return /^3\d{9}$/.test(digits) ? `+57${digits}` : null;
}

/** +573001234567 -> "+57 300 123 4567" */
export function formatPhone(e164: string): string {
  const m = /^\+57(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `+57 ${m[1]} ${m[2]} ${m[3]}` : e164;
}

export function isEmail(s: string): boolean {
  return /^\S+@\S+\.\S+$/.test(s.trim());
}

export function initials(nombre: string): string {
  const letras = nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase());
  return letras.length ? letras.join('') : '?';
}

/**
 * Estado de entrega SIMULADO, derivado solo del tiempo transcurrido (determinista:
 * sobrevive a cerrar/reabrir la app sin timers persistidos). Solo existe en modo demo.
 */
export function simulatedStatus(index: number, telefono: string, elapsedMs: number): DeliveryState {
  const offset = index * 800;
  if (elapsedMs < 2000 + offset) return 'en_cola';
  if (telefono.endsWith('0000')) return elapsedMs < 5000 + offset ? 'en_cola' : 'fallido';
  return elapsedMs < 5000 + offset * 1.25 ? 'enviado' : 'entregado';
}

const dos = (n: number) => String(n).padStart(2, '0');

/** "MM:SS", o "H:MM:SS" desde 1 h. */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${dos(m)}:${dos(s)}` : `${dos(m)}:${dos(s)}`;
}

/** "hace x s" bajo 60 s; si no "hace x min". */
export function ago(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return s < 60 ? `hace ${s} s` : `hace ${Math.floor(s / 60)} min`;
}

/** Ventanas de confirmación permitidas (D-02: 5 s por defecto, configurable). */
export const COUNTDOWN_OPTIONS = [3, 5, 10] as const;

export type Settings = { countdownSeconds: number; silencioso: boolean };
export const DEFAULT_SETTINGS: Settings = { countdownSeconds: 5, silencioso: false };

/** Valida lo leído del almacenamiento (dato no confiable): lo inválido cae al valor por defecto. */
export function sanitizeSettings(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const segundos = COUNTDOWN_OPTIONS.find((n) => n === r.countdownSeconds);
  return {
    countdownSeconds: segundos ?? DEFAULT_SETTINGS.countdownSeconds,
    silencioso: r.silencioso === true,
  };
}

/** Agrega un punto al recorrido: ignora el repetido (mismo `at` que el último) y conserva los últimos `max`. */
export function appendTrail<T extends { at: number }>(trail: T[], punto: T, max = 50): T[] {
  if (trail.length > 0 && trail[trail.length - 1].at === punto.at) return trail;
  return [...trail, punto].slice(-max);
}

/**
 * Proyección simple del recorrido a una caja w x h: escala uniforme (longitud corregida por el coseno de
 * la latitud media), centrada, norte arriba. Un solo punto queda en el centro.
 */
export function trailPath(
  puntos: { lat: number; lon: number }[],
  w: number,
  h: number,
  pad: number,
): { d: string; xy: { x: number; y: number }[] } {
  if (puntos.length === 0) return { d: '', xy: [] };
  const latMedia = puntos.reduce((a, p) => a + p.lat, 0) / puntos.length;
  const k = Math.cos((latMedia * Math.PI) / 180);
  const px = puntos.map((p) => ({ x: p.lon * k, y: -p.lat }));
  const minX = Math.min(...px.map((p) => p.x));
  const maxX = Math.max(...px.map((p) => p.x));
  const minY = Math.min(...px.map((p) => p.y));
  const maxY = Math.max(...px.map((p) => p.y));
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const escala =
    spanX === 0 && spanY === 0
      ? 0
      : Math.min(spanX === 0 ? Infinity : (w - 2 * pad) / spanX, spanY === 0 ? Infinity : (h - 2 * pad) / spanY);
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const xy = px.map((p) => ({
    x: r1(w / 2 + (p.x - (minX + maxX) / 2) * escala),
    y: r1(h / 2 + (p.y - (minY + maxY) / 2) * escala),
  }));
  return { d: xy.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' '), xy };
}

/** URL del mapa embebido de OpenStreetMap. Solo números con toFixed: nada inyectable en el iframe. */
export function osmEmbedUrl(lat: number, lon: number, delta = 0.004): string {
  const f = (n: number) => n.toFixed(5);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${f(lon - delta)},${f(lat - delta)},${f(lon + delta)},${f(lat + delta)}&layer=mapnik&marker=${f(lat)},${f(lon)}`;
}

export function mapsUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

/** Filas de entrega simuladas: las usan la alerta activa y el snapshot del historial (lo que ves es lo que se guarda). */
export function deliveryRows<T extends { telefono: string }>(
  contactos: T[],
  elapsedMs: number,
): (T & { estado: DeliveryState })[] {
  return contactos.map((c, i) => ({ ...c, estado: simulatedStatus(i, c.telefono, elapsedMs) }));
}

/** "14 oct 2026, 3:05 p. m." (fecha y hora locales en es-CO). */
export function formatFecha(ms: number): string {
  return new Date(ms).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}
