// Tokens de 01-UI-SPEC.md. Única fuente de colores, espacios y tipografía.
export const colors = {
  bg: '#0D0D0D',
  surface: '#1A1A1A',
  border: '#2A2A2A',
  accent: '#E8212B',
  text: '#FFFFFF',
  textMuted: '#9A9A9A',
  disabled: '#5A5A5A',
  success: '#4ADE80',
  warning: '#F5A524',
  deepRed: '#B3121B',
};

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64 };

export const radius = { input: 10, row: 12, card: 16, pill: 999 };

export const type = {
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  label: { fontSize: 12, fontWeight: '600', lineHeight: 14, letterSpacing: 1, textTransform: 'uppercase' },
  meta: { fontSize: 12, fontWeight: '400', lineHeight: 18 },
  heading: { fontSize: 24, fontWeight: '600', lineHeight: 29 },
  display: { fontSize: 56, fontWeight: '600', lineHeight: 67, letterSpacing: 2 },
} as const;
