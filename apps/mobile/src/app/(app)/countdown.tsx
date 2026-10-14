import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Pressable, StyleSheet, Text, ToastAndroid, Vibration, View } from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { COUNTDOWN_SECONDS, useDemo } from '@/demo/store';
import { useLocation } from '@/lib/useLocation';
import { colors, radius, space } from '@/theme';

export default function Cuenta() {
  useKeepAwake();
  const { startAlert } = useDemo();
  const { fix } = useLocation();
  const fixRef = useRef(fix);
  useEffect(() => {
    fixRef.current = fix;
  }, [fix]);
  const [left, setLeft] = useState(COUNTDOWN_SECONDS);
  const [pulso] = useState(() => new Animated.Value(0));

  // D-04: sin pantalla intermedia. Al llegar a 0, startAlert cambia activeAlert y la guardia de
  // (app)/_layout quita esta pantalla y deja solo /alert.
  useEffect(() => {
    if (left <= 0) {
      startAlert(fixRef.current);
      return;
    }
    Vibration.vibrate(200);
    pulso.setValue(0);
    Animated.timing(pulso, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe reaccionar a `left`
  }, [left]);

  // Solo CANCELAR sale: atrás deshabilitado (evita cancelaciones accidentales en una emergencia).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const escala = pulso.interpolate({ inputRange: [0, 1], outputRange: [1.15, 1] });
  const opacidad = pulso.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0.25] });

  const cancelar = () => {
    Vibration.vibrate(80);
    router.back();
    ToastAndroid.show('Alerta cancelada. No se envió nada.', ToastAndroid.SHORT);
  };

  return (
    <Screen edges={['bottom']} style={styles.screen}>
      <View style={styles.center}>
        <AppText variant="label" style={styles.soft}>
          ENVIANDO ALERTA EN
        </AppText>
        <View style={styles.numeralBox}>
          <Animated.View style={[styles.glow, { opacity: opacidad }]} />
          <Animated.Text style={[styles.numeral, { transform: [{ scale: escala }] }]}>
            {Math.max(left, 1)}
          </Animated.Text>
        </View>
        <AppText>segundos</AppText>
        <AppText style={[styles.soft, styles.info]}>Tus contactos recibirán un SMS con tu ubicación.</AppText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cancelar alerta"
        onPress={cancelar}
        style={({ pressed }) => [styles.cancel, pressed && { transform: [{ scale: 0.95 }] }]}
      >
        <Text style={styles.cancelText}>CANCELAR</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.deepRed },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  soft: { opacity: 0.8 },
  numeralBox: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: colors.accent },
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
