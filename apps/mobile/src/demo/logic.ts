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

/** Titular honesto de la alerta activa, derivado del estado agregado de los contactos. */
export function headline(estados: DeliveryState[]): { titulo: string; subtitulo: string; fallo: boolean } {
  const entregados = estados.filter((e) => e === 'entregado').length;
  if (estados.length > 0 && estados.every((e) => e === 'fallido')) {
    return {
      titulo: 'No pudimos avisar a tus contactos',
      subtitulo: 'Llámalos directamente o al 123.',
      fallo: true,
    };
  }
  if (entregados > 0) {
    return {
      titulo: 'Alerta activa',
      subtitulo: `${entregados} de ${estados.length} contactos recibieron tu aviso.`,
      fallo: false,
    };
  }
  if (estados.includes('enviado')) {
    return {
      titulo: 'Alerta activa',
      subtitulo: 'Mensajes enviados. Esperando confirmación de entrega.',
      fallo: false,
    };
  }
  return {
    titulo: 'Alerta activa',
    subtitulo: 'Guardada en tu teléfono. Avisando a tus contactos…',
    fallo: false,
  };
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
