// Botón de mantener presionado: SOS (anillo, 2000 ms) y ESTOY A SALVO (relleno, 3000 ms).
// El progreso del hold usa Animated de react-native con driver JS: con Reanimated, "reducir movimiento"
// saltaría la animación al final y dispararía el SOS al instante. Reanimated solo adorna (glow, ondas, temblor).
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing as REasing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { AppText } from '@/components/ui';
import { colors, gradients, radius } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const R = 124;
const CIRCUNFERENCIA = 2 * Math.PI * R;

type Props = {
  variant: 'ring' | 'fill';
  durationMs: number;
  onComplete: () => void;
  disabled?: boolean;
  /** Toque con el botón deshabilitado: el botón tiembla y el padre explica por qué (L-02). */
  onDisabledPress?: () => void;
  onPressingChange?: (pressing: boolean) => void;
  accessibilityLabel: string;
  accessibilityHint: string;
  actionLabel: string;
};

// Onda que se expande desde el disco; `i` las desfasa 800 ms.
function Onda({ i, activa }: { i: number; activa: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (!activa) {
      cancelAnimation(p);
      p.set(0);
      return;
    }
    p.set(
      withDelay(
        i * 800,
        withRepeat(withTiming(1, { duration: 2400, easing: REasing.out(REasing.quad) }), -1, false),
      ),
    );
    return () => cancelAnimation(p);
  }, [activa, i, p]);
  const estilo = useAnimatedStyle(() => ({
    opacity: interpolate(p.get(), [0, 1], [0.55, 0]),
    transform: [{ scale: interpolate(p.get(), [0, 1], [0.7, 1.55]) }],
  }));
  return <Reanimated.View style={[styles.onda, { borderColor: i % 2 ? colors.deepRed : colors.accent }, estilo]} />;
}

export function HoldButton({
  variant,
  durationMs,
  onComplete,
  disabled,
  onDisabledPress,
  onPressingChange,
  accessibilityLabel,
  accessibilityHint,
  actionLabel,
}: Props) {
  // Valores separados: el progreso usa driver JS (props SVG / ancho); la escala, driver nativo (salvo web).
  const [progress] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(1));
  const completado = useRef(false);
  const [presionando, setPresionando] = useState(false);
  const reducido = useReducedMotion();

  const respiro = useSharedValue(0.94);
  const temblor = useSharedValue(0);
  const animarReposo = !disabled && !reducido;

  useEffect(() => {
    if (!animarReposo) {
      cancelAnimation(respiro);
      respiro.set(1);
      return;
    }
    respiro.set(0.94);
    respiro.set(withRepeat(withTiming(1.06, { duration: 1600 }), -1, true));
    return () => cancelAnimation(respiro);
  }, [animarReposo, respiro]);

  const estiloGlow = useAnimatedStyle(() => ({ transform: [{ scale: respiro.get() }] }));
  const estiloTemblor = useAnimatedStyle(() => ({ transform: [{ translateX: temblor.get() }] }));

  const escalar = (to: number, duration: number) =>
    Animated.timing(scale, { toValue: to, duration, useNativeDriver: Platform.OS !== 'web' }).start();

  const alPresionar = () => {
    if (disabled) return;
    completado.current = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressingChange?.(true);
    setPresionando(true);
    if (variant === 'ring') escalar(0.92, 130);
    Animated.timing(progress, {
      toValue: 1,
      duration: durationMs,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return;
      completado.current = true;
      Haptics.notificationAsync(
        variant === 'ring' ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success,
      );
      onPressingChange?.(false);
      setPresionando(false);
      progress.setValue(0);
      scale.setValue(1);
      onComplete();
    });
  };

  const alSoltar = () => {
    if (disabled || completado.current) return;
    progress.stopAnimation();
    Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: false }).start();
    if (variant === 'ring') escalar(1, 130);
    onPressingChange?.(false);
    setPresionando(false);
  };

  // Deshabilitado: no se pasa `disabled` al Pressable para que el toque llegue aquí y el disco avise.
  const alTocar = () => {
    if (!disabled) return;
    temblor.set(
      withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 60 }),
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(0, { duration: 50 }),
      ),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    onDisabledPress?.();
  };

  const comun = {
    accessibilityRole: 'button' as const,
    accessibilityLabel,
    accessibilityHint,
    accessibilityState: { disabled: !!disabled },
    // TalkBack no puede mantener presionado: acción alternativa que completa directamente.
    accessibilityActions: [{ name: 'activate', label: actionLabel }],
    onAccessibilityAction: () => {
      if (!disabled) onComplete();
    },
    onPressIn: alPresionar,
    onPressOut: alSoltar,
    onPress: alTocar,
  };

  if (variant === 'fill') {
    const ancho = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
    return (
      <Pressable {...comun} style={styles.fill}>
        <Animated.View style={[styles.fillBar, { width: ancho }]}>
          <LinearGradient
            colors={gradients.success}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <MaterialIcons name="verified-user" size={20} color={colors.success} />
        <Text style={styles.fillText}>{presionando ? 'SIGUE PRESIONANDO…' : 'ESTOY A SALVO'}</Text>
      </Pressable>
    );
  }

  const offset = progress.interpolate({ inputRange: [0, 1], outputRange: [CIRCUNFERENCIA, 0] });
  return (
    <View style={styles.ringBox}>
      {/* L-02: toda la decoración va DEBAJO del Pressable y en un View con pointerEvents 'none' en su style.
          En Android react-native-svg no respeta pointerEvents en <Svg>: el anillo encima se tragaba los toques. */}
      {!disabled ? (
        <View style={styles.decor}>
          <Reanimated.View style={[styles.layer, estiloGlow]}>
            <Svg width={340} height={340}>
              <Defs>
                <RadialGradient id="brillo" cx="50%" cy="50%" r="50%">
                  <Stop offset="0.5" stopColor={colors.accent} stopOpacity={0.45} />
                  <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={170} cy={170} r={170} fill="url(#brillo)" />
            </Svg>
          </Reanimated.View>
          {[0, 1, 2].map((i) => (
            <Onda key={i} i={i} activa={animarReposo && !presionando} />
          ))}
          <Svg width={256} height={256} style={[styles.layer, styles.rotado]}>
            <Circle cx={128} cy={128} r={R} stroke={colors.border} strokeWidth={8} fill="none" />
            <AnimatedCircle
              cx={128}
              cy={128}
              r={R}
              stroke={colors.text}
              strokeWidth={8}
              fill="none"
              strokeDasharray={CIRCUNFERENCIA}
              strokeDashoffset={offset}
            />
          </Svg>
        </View>
      ) : null}
      <Pressable {...comun}>
        <Reanimated.View style={estiloTemblor}>
          <Animated.View style={[styles.sos, { transform: [{ scale }] }]}>
            <LinearGradient
              colors={disabled ? gradients.disabled : gradients.sos}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <AppText variant="display" color={disabled ? colors.disabled : colors.text} style={styles.sinSeleccion}>
              SOS
            </AppText>
            <MaterialIcons
              name={disabled ? 'lock' : 'touch-app'}
              size={32}
              color={disabled ? colors.disabled : colors.text}
            />
            {disabled ? (
              <AppText variant="label" color={colors.disabled} style={styles.sinSeleccion}>
                SIN CONTACTOS
              </AppText>
            ) : null}
          </Animated.View>
        </Reanimated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ringBox: { width: 340, height: 340, alignItems: 'center', justifyContent: 'center' },
  decor: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
  layer: { position: 'absolute' },
  rotado: { transform: [{ rotate: '-90deg' }] },
  onda: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 2 },
  sos: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sinSeleccion: { userSelect: 'none' },
  fill: {
    height: 56,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.success,
    overflow: 'hidden',
  },
  fillBar: { position: 'absolute', left: 0, top: 0, bottom: 0, opacity: 0.35 },
  fillText: { color: colors.success, fontSize: 16, fontWeight: '600', letterSpacing: 1, userSelect: 'none' },
});
