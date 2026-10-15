import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, StyleSheet, Text, Vibration, View } from 'react-native';
import Reanimated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { AppText, PressableScale, Screen, toast } from '@/components/ui';
import { useAlerts, useLocalExtras } from '@/data';
import { secondsLeft } from '@/data/logic';
import { useLocation } from '@/lib/useLocation';
import { colors, gradients, radius, space } from '@/theme';

export default function Cuenta() {
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });
  const { start: startAlert } = useAlerts();
  const { settings } = useLocalExtras();
  // Modo silencioso: sin vibración, pantalla oscura y discreta, sin capa pulsante ni anillo.
  const { silencioso } = settings;
  const { fix } = useLocation();
  const fixRef = useRef(fix);
  useEffect(() => {
    fixRef.current = fix;
  }, [fix]);
  // Deadline absoluto (01-13): si la app pasa a segundo plano, al volver se recalcula con la hora real y,
  // si ya venció, la alerta se dispara.
  const [deadline] = useState(() => Date.now() + settings.countdownSeconds * 1000);
  const [now, setNow] = useState(() => Date.now());
  const left = secondsLeft(deadline, now);
  const disparada = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setNow(Date.now());
    });
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, []);

  // Fondo pulsante y anillo que se reinicia en cada segundo (L-03).
  const latido = useSharedValue(0.1);
  const anillo = useSharedValue(0);
  useEffect(() => {
    if (!silencioso) latido.set(withRepeat(withTiming(0.35, { duration: 500 }), -1, true));
  }, [latido, silencioso]);
  const estiloLatido = useAnimatedStyle(() => ({ opacity: latido.get() }));
  const estiloAnillo = useAnimatedStyle(() => ({
    opacity: interpolate(anillo.get(), [0, 1], [0.7, 0]),
    transform: [{ scale: interpolate(anillo.get(), [0, 1], [0.8, 1.8]) }],
  }));

  // D-04: sin pantalla intermedia. Al llegar a 0, startAlert cambia activeAlert y la guardia de
  // (app)/_layout quita esta pantalla y deja solo /alert.
  useEffect(() => {
    if (left <= 0) {
      // La alerta se guarda en el teléfono antes de cualquier red (SOS-03); una sola vez.
      if (!disparada.current) {
        disparada.current = true;
        startAlert(fixRef.current);
      }
      return;
    }
    if (!silencioso) {
      Vibration.vibrate(200);
      anillo.set(0);
      anillo.set(withTiming(1, { duration: 900 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe reaccionar a `left`
  }, [left]);

  // Solo CANCELAR sale: atrás deshabilitado (evita cancelaciones accidentales en una emergencia).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const cancelar = () => {
    if (!silencioso) Vibration.vibrate(80);
    router.back();
    toast('Alerta cancelada. No se envió nada.');
  };

  return (
    <Screen edges={['bottom']} fondo={silencioso ? gradients.quiet : gradients.countdown}>
      {silencioso ? null : <Reanimated.View style={[styles.latido, estiloLatido]} />}
      <View style={styles.center}>
        <AppText variant="label" style={styles.soft}>
          {silencioso ? 'ALERTA SILENCIOSA EN' : 'ENVIANDO ALERTA EN'}
        </AppText>
        <View style={styles.numeralBox}>
          {silencioso ? null : <Reanimated.View style={[styles.anillo, estiloAnillo]} />}
          <Reanimated.Text
            key={left}
            entering={ZoomIn.springify()}
            style={[styles.numeral, silencioso && styles.numeralSilencioso]}
          >
            {Math.max(left, 1)}
          </Reanimated.Text>
        </View>
        <AppText>segundos</AppText>
        <AppText style={[styles.soft, styles.info]}>Tus contactos recibirán un SMS con tu ubicación.</AppText>
      </View>

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Cancelar alerta"
        onPress={cancelar}
        style={[styles.cancel, silencioso && styles.cancelSilencioso]}
      >
        <Text style={[styles.cancelText, silencioso && styles.cancelTextSilencioso]}>CANCELAR</Text>
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
  numeralSilencioso: { color: colors.textMuted, fontSize: 96, lineHeight: 114 },
  info: { marginTop: space.lg, textAlign: 'center' },
  cancel: {
    height: 72,
    borderRadius: radius.input,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelSilencioso: { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1.5 },
  cancelText: { color: colors.deepRed, fontSize: 24, fontWeight: '600' },
  cancelTextSilencioso: { color: colors.textMuted },
});
