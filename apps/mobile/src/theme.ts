// Tokens de color, espacio y tipografía. Única fuente: ninguna pantalla escribe hex ni rgba.
// Paleta del legacy / 01-UI-SPEC (Roberto 2026-10-15: volver al rojo del proyecto original). Los degradados
// de 261014-j0a se conservan solo en rojo, para el glow; el acento de botones, pestaña, enlaces y foco es #E8212B.
export const colors = {
  bg: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceHi: '#222222',
  border: '#2A2A2A',
  accent: '#E8212B',
  deepRed: '#B3121B',
  text: '#FFFFFF',
  textMuted: '#9A9A9A',
  disabled: '#5A5A5A',
  success: '#4ADE80',
  warning: '#F5A524',
  glass: 'rgba(255,255,255,0.04)',
  accentSoft: 'rgba(232,33,43,0.18)',
  successSoft: 'rgba(74,222,128,0.16)',
  warningSoft: 'rgba(245,165,36,0.16)',
};

// Tuplas readonly: expo-linear-gradient exige al menos 2 colores.
export const gradients = {
  // Fondo casi plano con un leve brillo rojo arriba (el "glow" de la marca).
  bg: ['#1A0A0B', colors.bg, colors.bg],
  sos: [colors.accent, colors.deepRed],
  primary: [colors.accent, colors.deepRed],
  card: [colors.surface, colors.surface],
  success: [colors.success, '#16A34A'],
  countdown: [colors.deepRed, '#7A0B11'],
  quiet: [colors.bg, colors.bg],
  disabled: [colors.border, colors.surfaceHi],
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64 };

export const radius = { input: 10, row: 12, card: 16, pill: 999 };

export const type = {
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  label: { fontSize: 12, fontWeight: '600', lineHeight: 14, letterSpacing: 1, textTransform: 'uppercase' },
  meta: { fontSize: 12, fontWeight: '400', lineHeight: 18 },
  heading: { fontSize: 24, fontWeight: '600', lineHeight: 29 },
  display: { fontSize: 56, fontWeight: '600', lineHeight: 67, letterSpacing: 2 },
} as const;
