// Punto de entrada único del mapa en nativo (en web Metro elige LiveMap.web.tsx).
// Development build: MapLibre nativo. Expo Go no trae el módulo nativo: se decide en runtime y se usa el SVG.
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';

import { TrailMap } from '@/components/TrailMap';
import { colors, radius } from '@/theme';

import type { LiveMapProps } from './mapTypes';

function cargarNativo(): ComponentType<LiveMapProps> | null {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null; // Expo Go
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('./LiveMapNative') as typeof import('./LiveMapNative')).LiveMapNative;
  } catch {
    return null; // build sin el módulo nativo: mejor el SVG que un crash
  }
}

const Nativo = cargarNativo();

export function LiveMap(props: LiveMapProps) {
  const Impl = Nativo ?? TrailMap;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={props.label}
      style={[styles.caja, { height: props.height }]}
    >
      <Impl {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface, // si las teselas no cargan queda el fondo y el texto sigue visible
    overflow: 'hidden',
  },
});
