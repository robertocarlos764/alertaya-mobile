import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, Text, Vibration, View } from 'react-native';
import Reanimated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { AppText, PressableScale, Screen, toast } from '@/components/ui';
import { COUNTDOWN_SECONDS, useDemo } from '@/demo/store';
import { useLocation } from '@/lib/useLocation';
import { colors, gradients, radius, space } from '@/theme';

export default function Cuenta() {
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });
  const { startAlert } = useDemo();
  const { fix } = useLocation();
  const fixRef = useRef(fix);
  useEffect(() => {
    fixRef.current = fix;
  }, [fix]);
  const [left, setLeft] = useState(COUNTDOWN_SECONDS);

  // Fondo pulsante y anillo que se reinicia en cada segundo (L-03).
  const latido = useSharedValue(0.1);
  const anillo = useSharedValue(0);
  useEffect(() => {
    latido.set(withRepeat(withTiming(0.35, { duration: 500 }), -1, true));
  }, [latido]);
  const estiloLatido = useAnimatedStyle(() => ({ opacity: latido.get() }));
  const estiloAnillo = useAnimatedStyle(() => ({
    opacity: interpolate(anillo.get(), [0, 1], [0.7, 0]),
    transform: [{ scale: interpolate(anillo.get(), [0, 1], [0.8, 1.8]) }],
  }));

  // D-04: sin pantalla intermedia. Al llegar a 0, startAlert cambia activeAlert y la guardia de
  // (app)/_layout quita esta pantalla y deja solo /alert.
  useEffect(() => {
    if (left <= 0) {
      startAlert(fixRef.current);
      return;
    }
    Vibration.vibrate(200);
    anillo.set(0);
    anillo.set(withTiming(1, { duration: 900 }));
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe reaccionar a `left`
  }, [left]);

  // Solo CANCELAR sale: atrás deshabilitado (evita cancelaciones accidentales en una emergencia).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const cancelar = () => {
    Vibration.vibrate(80);
    router.back();
    toast('Alerta cancelada. No se envió nada.');
  };

  return (
    <Screen edges={['bottom']} fondo={gradients.countdown}>
      <Reanimated.View style={[styles.latido, estiloLatido]} />
      <View style={styles.center}>
        <AppText variant="label" style={styles.soft}>
          ENVIANDO ALERTA EN
        </AppText>
        <View style={styles.numeralBox}>
          <Reanimated.View style={[styles.anillo, estiloAnillo]} />
          <Reanimated.Text key={left} entering={ZoomIn.springify()} style={styles.numeral}>
            {Math.max(left, 1)}
          </Reanimated.Text>
        </View>
        <AppText>segundos</AppText>
        <AppText style={[styles.soft, styles.info]}>Tus contactos recibirán un SMS con tu ubicación.</AppText>
      </View>

      <PressableScale accessibilityRole="button" accessibilityLabel="Cancelar alerta" onPress={cancelar} style={styles.cancel}>
        <Text style={styles.cancelText}>CANCELAR</Text>
      </PressableScale>
    </Screen>
  );
}

const styles = StyleSheet.create({
  latido: { ...StyleSheet.absoluteFill, backgroundColor: colors.accent, pointerEvents: 'none' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  soft: { opacity: 0.8 },
  numeralBox: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
  anillo: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: colors.text,
  },
  numeral: { color: colors.text, fontSize: 160, fontWeight: '600', lineHeight: 190, textAlign: 'center' },
  info: { marginTop: space.lg, textAlign: 'center' },
  cancel: {
    height: 72,
    borderRadius: radius.input,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: colors.deepRed, fontSize: 24, fontWeight: '600' },
});
