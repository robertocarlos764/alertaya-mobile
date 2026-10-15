// Pin rojo con pulso tipo radar: círculos que se expanden y desvanecen desde el punto ("estás emitiendo señal").
// Nativo (marcador de MapLibre y mapa SVG de Expo Go). En web el mismo efecto es CSS (.ay-pin en global.css).
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme';

const PIN = 16;
export const PULSE_BOX = 112;
const CAJA = PULSE_BOX; // el anillo llega a 7x el pin
const CICLO = 2400;

function Anillo({ i, reducido }: { i: number; reducido: boolean }) {
  const p = useSharedValue(reducido ? 0.4 : 0);
  useEffect(() => {
    if (reducido) return;
    p.set(withDelay(i * (CICLO / 3), withRepeat(withTiming(1, { duration: CICLO, easing: Easing.out(Easing.quad) }), -1, false)));
    return () => cancelAnimation(p);
  }, [i, p, reducido]);
  const estilo = useAnimatedStyle(() => ({
    opacity: interpolate(p.get(), [0, 1], [0.7, 0]),
    transform: [{ scale: interpolate(p.get(), [0, 1], [1, CAJA / PIN]) }],
  }));
  return <Reanimated.View style={[styles.anillo, estilo]} />;
}

/** `live` = alerta o ubicación en vivo: con pulso. Sin `live`, solo el pin (fin de un trayecto). */
export function Pulse({ live }: { live: boolean }) {
  const reducido = useReducedMotion();
  return (
    <View style={styles.caja} pointerEvents="none">
      {live ? [0, 1, 2].map((i) => <Anillo key={i} i={i} reducido={reducido} />) : null}
      <View style={styles.pin} />
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { width: CAJA, height: CAJA, alignItems: 'center', justifyContent: 'center' },
  anillo: {
    position: 'absolute',
    width: PIN,
    height: PIN,
    borderRadius: PIN / 2,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  pin: {
    width: PIN,
    height: PIN,
    borderRadius: PIN / 2,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.text,
  },
});
