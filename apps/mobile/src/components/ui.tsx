// Componentes base de UI (01-UI-SPEC). Colores/espacios/tipografía solo desde @/theme.
import { MaterialIcons } from '@expo/vector-icons';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { initials, type DeliveryState } from '@/demo/logic';
import { useDemo } from '@/demo/store';
import { colors, radius, space, type } from '@/theme';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

export function Screen({
  children,
  scroll,
  edges = ['bottom'],
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}) {
  // El borde superior lo cubre DemoBanner (montado en el layout raíz).
  return (
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
  variant?: 'primary' | 'outline' | 'ghost';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
}) {
  const inactivo = !!disabled || !!loading;
  const colorTexto = disabled ? colors.disabled : variant === 'ghost' ? colors.textMuted : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: !!loading }}
      disabled={inactivo}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && { backgroundColor: colors.accent },
        variant === 'outline' && { borderColor: colors.border, borderWidth: 1.5 },
        disabled && variant !== 'ghost' && { backgroundColor: colors.border, borderWidth: 0 },
        pressed && { transform: [{ scale: 0.95 }] },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <View style={styles.row}>
          {icon ? <MaterialIcons name={icon} size={20} color={colorTexto} /> : null}
          <Text style={[styles.buttonText, { color: colorTexto }]}>{title}</Text>
        </View>
      )}
    </Pressable>
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
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={{ color: colors.text, fontWeight: '600', fontSize: size >= 80 ? 28 : 12 }}>
        {initials(nombre)}
      </Text>
    </View>
  );
}

export function Header({ right }: { right?: ReactNode }) {
  const { session } = useDemo();
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
const ESTADOS: Record<DeliveryState, { etiqueta: string; color: string; icono: IconName; linea: string }> = {
  en_cola: { etiqueta: 'En cola', color: colors.textMuted, icono: 'schedule', linea: 'Esperando red' },
  enviado: { etiqueta: 'Enviado', color: colors.text, icono: 'check', linea: 'Esperando confirmación de entrega' },
  entregado: { etiqueta: 'Entregado', color: colors.success, icono: 'done-all', linea: 'Confirmado por el operador' },
  fallido: { etiqueta: 'Falló', color: colors.accent, icono: 'error-outline', linea: 'No se pudo enviar el SMS' },
};

export const etiquetaEstado = (state: DeliveryState) => ESTADOS[state].etiqueta;

export function DeliveryStatus({ state }: { state: DeliveryState }) {
  const e = ESTADOS[state];
  return (
    <View style={styles.status}>
      <View style={styles.row}>
        <MaterialIcons name={e.icono} size={20} color={e.color} />
        <AppText variant="label" color={e.color} style={styles.statusLabel}>
          {e.etiqueta}
        </AppText>
      </View>
      <AppText variant="meta" color={colors.textMuted} style={styles.statusLine}>
        {e.linea}
      </AppText>
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: space.lg },
  scrollContent: { padding: space.lg, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  button: {
    minHeight: 56,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
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
  avatar: { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  brand: { fontWeight: '600' },
  status: { alignItems: 'flex-end', maxWidth: 160 },
  statusLabel: { textTransform: 'none', fontSize: 12 },
  statusLine: { textAlign: 'right' },
  banner: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.warning },
  bannerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.xs, paddingVertical: 6 },
});
