// Tokens de color, espacio y tipografía. Única fuente: ninguna pantalla escribe hex ni rgba.
// Desviación deliberada de 01-UI-SPEC (L-03, Roberto 2026-10-14): paleta viva con degradados para el
// demo de 2026-10-15 en lugar de la paleta sobria. Se conservan todas las claves originales.
export const colors = {
  bg: '#0A0618',
  bgAlt: '#170B2E',
  surface: '#1A1430',
  surfaceHi: '#241C40',
  border: '#342A57',
  accent: '#FF2E55',
  accentHot: '#FF7A1A',
  magenta: '#E0218A',
  violet: '#8B5CF6',
  cyan: '#22D3EE',
  text: '#FFFFFF',
  textMuted: '#B3ABCF',
  disabled: '#5D5478',
  success: '#2EF08A',
  warning: '#FFB020',
  deepRed: '#B3121B',
  glass: 'rgba(255,255,255,0.06)',
  accentSoft: 'rgba(255,46,85,0.18)',
  violetSoft: 'rgba(139,92,246,0.18)',
  successSoft: 'rgba(46,240,138,0.16)',
  warningSoft: 'rgba(255,176,32,0.16)',
};

// Tuplas readonly: expo-linear-gradient exige al menos 2 colores.
export const gradients = {
  bg: [colors.bg, colors.bgAlt, colors.bg],
  sos: [colors.accent, colors.magenta],
  primary: [colors.accent, colors.magenta],
  cool: [colors.violet, colors.cyan],
  card: ['rgba(139,92,246,0.16)', 'rgba(34,211,238,0.05)'],
  success: [colors.success, '#10B981'],
  countdown: [colors.deepRed, colors.magenta],
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
