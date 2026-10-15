// Componentes base de UI (01-UI-SPEC). Colores/degradados/espacios/tipografía solo desde @/theme.
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import Reanimated, {
  cancelAnimation,
  FadeInDown,
  FadeOutDown,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { useAuth } from '@/data';
import { initials, type DeliveryState } from '@/demo/logic';
import { colors, gradients, radius, space, type } from '@/theme';

type IconName = ComponentProps<typeof MaterialIcons>['name'];
export type Degradado = readonly [string, string, ...string[]];

const APressable = Reanimated.createAnimatedComponent(Pressable);

/** Entradas escalonadas: `entering={entrada(i)}` en un Reanimated.View (L-03). */
export const entrada = (i: number) => FadeInDown.delay(i * 70).duration(420);

export function Screen({
  children,
  scroll,
  edges = ['bottom'],
  style,
  fondo = gradients.bg,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  fondo?: Degradado;
}) {
  // El borde superior lo cubre DemoBanner (montado en el layout raíz).
  return (
    <LinearGradient colors={fondo} style={styles.flex}>
      <SafeAreaView edges={edges} style={[styles.screen, style]}>
        {scroll ? (
          <KeyboardAvoidingView behavior="padding" style={styles.flex}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        ) : (
          <View style={styles.body}>{children}</View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient colors={gradients.card} style={[styles.card, style]}>
      {children}
    </LinearGradient>
  );
}

/** Pressable que se encoge con resorte al presionar (sin animación si está deshabilitado). */
export function PressableScale({
  children,
  style,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const escala = useSharedValue(1);
  const animado = useAnimatedStyle(() => ({ transform: [{ scale: escala.get() }] }));
  return (
    <APressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        if (!disabled) escala.set(withSpring(0.95));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        escala.set(withSpring(1));
        onPressOut?.(e);
      }}
      style={[style, animado]}
    >
      {children}
    </APressable>
  );
}

/** Escala suave de ida y vuelta (glow que respira). Con "reducir movimiento" queda quieto. */
export function Respira({
  children,
  style,
  min = 0.94,
  max = 1.06,
  ms = 1600,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  min?: number;
  max?: number;
  ms?: number;
}) {
  const reducido = useReducedMotion();
  const v = useSharedValue(1);
  useEffect(() => {
    if (reducido) return;
    v.set(min);
    v.set(withRepeat(withTiming(max, { duration: ms }), -1, true));
    return () => cancelAnimation(v);
  }, [reducido, min, max, ms, v]);
  const animado = useAnimatedStyle(() => ({ transform: [{ scale: v.get() }] }));
  return <Reanimated.View style={[style, animado]}>{children}</Reanimated.View>;
}

/** Icono grande en círculo con degradado y glow que respira (login, bienvenida). */
export function Logo({
  size = 96,
  icon = 'shield',
  fondo = gradients.sos,
}: {
  size?: number;
  icon?: IconName;
  fondo?: Degradado;
}) {
  const caja = size * 1.5;
  return (
    <View style={{ width: caja, height: caja, alignItems: 'center', justifyContent: 'center' }}>
      <Respira
        style={{ position: 'absolute', width: caja, height: caja, borderRadius: caja / 2, backgroundColor: colors.accentSoft }}
      />
      <LinearGradient
        colors={fondo}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
      >
        <MaterialIcons name={icon} size={size * 0.5} color={colors.text} />
      </LinearGradient>
    </View>
  );
}

// Punto fijo con un halo que crece y se desvanece (alerta ACTIVA).
export function PuntoActivo() {
  const halo = useSharedValue(0);
  useEffect(() => {
    halo.set(withRepeat(withTiming(1, { duration: 1400 }), -1, false));
    return () => cancelAnimation(halo);
  }, [halo]);
  const estiloHalo = useAnimatedStyle(() => ({
    opacity: interpolate(halo.get(), [0, 1], [0.6, 0]),
    transform: [{ scale: interpolate(halo.get(), [0, 1], [1, 2.2]) }],
  }));
  return (
    <View style={styles.puntoBox}>
      <Reanimated.View style={[styles.punto, styles.halo, estiloHalo]} />
      <View style={styles.punto} />
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, { borderColor: selected ? colors.cyan : colors.border }]}
    >
      {selected ? <LinearGradient colors={gradients.cool} style={StyleSheet.absoluteFill} /> : null}
      <Text style={styles.chipText}>{label}</Text>
    </PressableScale>
  );
}

export function AppText({
  variant = 'body',
  color = colors.text,
  style,
  ...rest
}: TextProps & { variant?: keyof typeof type; color?: string }) {
  return <Text {...rest} style={[type[variant], { color }, style]} />;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost' | 'cool' | 'danger';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
}) {
  const inactivo = !!disabled || !!loading;
  const degradado = variant === 'primary' ? gradients.primary : variant === 'cool' ? gradients.cool : null;
  const colorTexto = disabled
    ? colors.disabled
    : variant === 'ghost'
      ? colors.textMuted
      : variant === 'danger'
        ? colors.accent
        : colors.text;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: !!loading }}
      disabled={inactivo}
      onPress={onPress}
      style={[
        styles.button,
        variant === 'outline' && { borderColor: colors.border, borderWidth: 1.5, backgroundColor: colors.glass },
        variant === 'danger' && { borderColor: colors.accent, borderWidth: 1.5, backgroundColor: colors.accentSoft },
        disabled && variant !== 'ghost' && { backgroundColor: colors.border, borderWidth: 0 },
      ]}
    >
      {degradado && !disabled ? (
        <LinearGradient
          colors={degradado}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <View style={styles.row}>
          {icon ? <MaterialIcons name={icon} size={20} color={colorTexto} /> : null}
          <Text style={[styles.buttonText, { color: colorTexto }]}>{title}</Text>
        </View>
      )}
    </PressableScale>
  );
}

export function TextField({
  label,
  error,
  prefix,
  secure,
  ...rest
}: TextInputProps & { label: string; error?: string; prefix?: string; secure?: boolean }) {
  const [foco, setFoco] = useState(false);
  const [oculto, setOculto] = useState(true);
  const borde = error
    ? { borderColor: colors.accent, borderWidth: 1 }
    : foco
      ? { borderColor: colors.accent, borderWidth: 1.5 }
      : { borderColor: colors.border, borderWidth: 1 };
  return (
    <View style={styles.field}>
      <AppText variant="label" color={colors.textMuted} style={styles.fieldLabel}>
        {label}
      </AppText>
      <View style={[styles.input, borde]}>
        {prefix ? (
          <AppText color={colors.textMuted} style={styles.prefix}>
            {prefix}
          </AppText>
        ) : null}
        <TextInput
          {...rest}
          accessibilityLabel={label}
          onBlur={(e) => {
            setFoco(false);
            rest.onBlur?.(e);
          }}
          onFocus={(e) => {
            setFoco(true);
            rest.onFocus?.(e);
          }}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secure ? oculto : rest.secureTextEntry}
          selectionColor={colors.accent}
          style={styles.inputText}
        />
        {secure ? (
          <Pressable
            accessibilityLabel={oculto ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            accessibilityRole="button"
            hitSlop={4}
            onPress={() => setOculto((v) => !v)}
            style={styles.eye}
          >
            <MaterialIcons name={oculto ? 'visibility' : 'visibility-off'} size={22} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <MaterialIcons name="error-outline" size={14} color={colors.accent} />
          <AppText variant="meta" color={colors.accent}>
            {error}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

export function Avatar({ nombre, size = 40 }: { nombre: string; size?: number }) {
  return (
    <LinearGradient
      colors={gradients.cool}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={{ color: colors.text, fontWeight: '600', fontSize: size >= 80 ? 28 : 12 }}>
        {initials(nombre)}
      </Text>
    </LinearGradient>
  );
}

export function Header({ right }: { right?: ReactNode }) {
  const { session } = useAuth();
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <MaterialIcons name="shield" size={28} color={colors.accent} />
        <AppText color={colors.accent} style={styles.brand}>
          AlertaYA
        </AppText>
      </View>
      {right ?? <Avatar nombre={session?.nombre ?? ''} />}
    </View>
  );
}

// Única ruta para pintar un estado de entrega (tabla de 01-UI-SPEC).
type InfoEstado = { etiqueta: string; color: string; fondo: string; icono: IconName; linea: string };
const ESTADOS: Record<DeliveryState, InfoEstado> = {
  en_cola: {
    etiqueta: 'En cola',
    color: colors.textMuted,
    fondo: colors.glass,
    icono: 'schedule',
    linea: 'Esperando red',
  },
  enviado: {
    etiqueta: 'Enviado',
    color: colors.cyan,
    fondo: colors.violetSoft,
    icono: 'check',
    linea: 'Esperando confirmación de entrega',
  },
  entregado: {
    etiqueta: 'Entregado',
    color: colors.success,
    fondo: colors.successSoft,
    icono: 'done-all',
    linea: 'Confirmado por el operador',
  },
  fallido: {
    etiqueta: 'Falló',
    color: colors.accent,
    fondo: colors.accentSoft,
    icono: 'error-outline',
    linea: 'No se pudo enviar el SMS',
  },
};

export const etiquetaEstado = (state: DeliveryState) => ESTADOS[state].etiqueta;
export const infoEstado = (state: DeliveryState) => ESTADOS[state];

export function DeliveryStatus({ state }: { state: DeliveryState }) {
  const e = ESTADOS[state];
  return (
    <View style={[styles.status, { backgroundColor: e.fondo }]}>
      {/* key = estado: cada cambio de estado vuelve a montar el contenido y "salta". */}
      <Reanimated.View key={state} entering={ZoomIn.springify()} style={styles.statusInner}>
        <View style={styles.row}>
          <MaterialIcons name={e.icono} size={20} color={e.color} />
          <AppText variant="label" color={e.color} style={styles.statusLabel}>
            {e.etiqueta}
          </AppText>
        </View>
        <AppText variant="meta" color={colors.textMuted} style={styles.statusLine}>
          {e.linea}
        </AppText>
      </Reanimated.View>
    </View>
  );
}

export function DemoBanner() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.banner, { paddingTop: insets.top }]}>
      <View style={styles.bannerRow}>
        <MaterialIcons name="info-outline" size={14} color={colors.warning} />
        <AppText variant="label" color={colors.warning}>
          MODO DEMO · no se envían SMS reales
        </AppText>
      </View>
    </View>
  );
}

// Snackbar (01-UI-SPEC: un solo mensaje, 4000 ms). Vive en la raíz: sobrevive a la pantalla que lo pidió.
type ToastData = { id: number; texto: string; accion?: { label: string; onPress: () => void } };
let mostrarToast: ((t: ToastData) => void) | null = null;
let toastSeq = 0;

/** Sin <SnackbarHost /> montado no hace nada. Un mensaje nuevo reemplaza al anterior. */
export function toast(texto: string, accion?: ToastData['accion']) {
  mostrarToast?.({ id: ++toastSeq, texto, accion });
}

export function SnackbarHost() {
  const insets = useSafeAreaInsets();
  const [actual, setActual] = useState<ToastData | null>(null);

  useEffect(() => {
    mostrarToast = setActual;
    return () => {
      mostrarToast = null;
    };
  }, []);

  useEffect(() => {
    if (!actual) return;
    AccessibilityInfo.announceForAccessibility(actual.texto);
    const t = setTimeout(() => setActual((v) => (v?.id === actual.id ? null : v)), 4000);
    return () => clearTimeout(t);
  }, [actual]);

  return (
    <View style={[styles.snackHost, { bottom: insets.bottom + 88 }]}>
      {actual ? (
        <Reanimated.View
          key={actual.id}
          entering={FadeInDown}
          exiting={FadeOutDown}
          accessibilityLiveRegion="polite"
          style={styles.snack}
        >
          <AppText style={styles.snackText}>{actual.texto}</AppText>
          {actual.accion ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                actual.accion?.onPress();
                setActual(null);
              }}
              style={styles.snackAction}
            >
              <AppText color={colors.cyan} style={styles.snackActionText}>
                {actual.accion.label.toUpperCase()}
              </AppText>
            </Pressable>
          ) : null}
        </Reanimated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: 'transparent' },
  body: { flex: 1, padding: space.lg },
  scrollContent: { padding: space.lg, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  button: {
    minHeight: 56,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
    overflow: 'hidden',
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  card: {
    padding: space.md,
    borderRadius: radius.card,
    borderColor: colors.border,
    borderWidth: 1,
    overflow: 'hidden',
  },
  puntoBox: { width: 8, height: 8, alignItems: 'center', justifyContent: 'center' },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  halo: { position: 'absolute' },
  chip: {
    height: 40,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chipText: { color: colors.text, fontSize: 16 },
  field: { marginBottom: space.md },
  fieldLabel: { marginBottom: space.sm },
  input: {
    height: 56,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.md,
  },
  prefix: { marginRight: space.sm },
  inputText: { flex: 1, color: colors.text, fontSize: 16, height: '100%' },
  eye: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: -space.md },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: space.xs },
  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  brand: { fontWeight: '600' },
  status: { maxWidth: 160, borderRadius: radius.row, paddingHorizontal: space.sm, paddingVertical: space.xs },
  statusInner: { alignItems: 'flex-end' },
  statusLabel: { textTransform: 'none', fontSize: 12 },
  statusLine: { textAlign: 'right' },
  banner: { backgroundColor: colors.warningSoft, borderBottomWidth: 1, borderBottomColor: colors.warning },
  bannerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs, paddingVertical: 6 },
  snackHost: { position: 'absolute', left: space.md, right: space.md, pointerEvents: 'box-none' },
  snack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.row,
    backgroundColor: colors.surfaceHi,
    borderColor: colors.border,
    borderWidth: 1,
  },
  snackText: { flex: 1 },
  snackAction: { minHeight: 48, justifyContent: 'center' },
  snackActionText: { fontWeight: '600' },
});
