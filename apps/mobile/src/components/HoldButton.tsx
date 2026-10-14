// Botón de mantener presionado: SOS (anillo, 2000 ms) y ESTOY A SALVO (relleno, 3000 ms).
// Sin Reanimated (Expo Go): RN Animated + react-native-svg.
// ponytail: sin pulso del glow ni stagger de entrada (y por eso sin rama de "reducir animaciones");
// agregar con Reanimated en el development build.
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { AppText } from '@/components/ui';
import { colors, radius } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const R = 124;
const CIRCUNFERENCIA = 2 * Math.PI * R;

type Props = {
  variant: 'ring' | 'fill';
  durationMs: number;
  onComplete: () => void;
  disabled?: boolean;
  onPressingChange?: (pressing: boolean) => void;
  accessibilityLabel: string;
  accessibilityHint: string;
  actionLabel: string;
};

export function HoldButton({
  variant,
  durationMs,
  onComplete,
  disabled,
  onPressingChange,
  accessibilityLabel,
  accessibilityHint,
  actionLabel,
}: Props) {
  // Valores separados: el progreso usa driver JS (props SVG / ancho); la escala, driver nativo.
  const [progress] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(1));
  const completado = useRef(false);

  const escalar = (to: number, duration: number) =>
    Animated.timing(scale, { toValue: to, duration, useNativeDriver: true }).start();

  const alPresionar = () => {
    if (disabled) return;
    completado.current = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressingChange?.(true);
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
  };

  if (variant === 'fill') {
    const ancho = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
    return (
      <Pressable {...comun} style={styles.fill}>
        <Animated.View style={[styles.fillBar, { width: ancho }]} />
        <MaterialIcons name="verified-user" size={20} color={colors.success} />
        <Text style={styles.fillText}>ESTOY A SALVO</Text>
      </Pressable>
    );
  }

  const offset = progress.interpolate({ inputRange: [0, 1], outputRange: [CIRCUNFERENCIA, 0] });
  return (
    <View style={styles.ringBox}>
      {!disabled ? (
        <Svg width={340} height={340} style={styles.layer} pointerEvents="none">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0.5" stopColor={colors.accent} stopOpacity={0.45} />
              <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={170} cy={170} r={170} fill="url(#glow)" />
        </Svg>
      ) : null}
      <Pressable {...comun}>
        <Animated.View
          style={[styles.sos, { backgroundColor: disabled ? colors.border : colors.accent, transform: [{ scale }] }]}
        >
          <AppText variant="display" color={disabled ? colors.disabled : colors.text}>
            SOS
          </AppText>
          <MaterialIcons name="touch-app" size={32} color={disabled ? colors.disabled : colors.text} />
        </Animated.View>
      </Pressable>
      {!disabled ? (
        <Svg width={256} height={256} style={[styles.layer, styles.rotado]} pointerEvents="none">
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ringBox: { width: 340, height: 340, alignItems: 'center', justifyContent: 'center' },
  layer: { position: 'absolute' },
  rotado: { transform: [{ rotate: '-90deg' }] },
  sos: { width: 220, height: 220, borderRadius: 110, alignItems: 'center', justifyContent: 'center' },
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
  fillBar: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.success, opacity: 0.25 },
  fillText: { color: colors.success, fontSize: 16, fontWeight: '600', letterSpacing: 1 },
});
