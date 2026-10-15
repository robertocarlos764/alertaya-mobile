import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Reanimated from 'react-native-reanimated';

import { AppText, Button, entrada, ErrorBanner, Logo, Screen, TextField } from '@/components/ui';
import { isEmail, normalizePhone } from '@/demo/logic';
import { useAuth } from '@/data';
import { colors, space } from '@/theme';

export default function Register() {
  const { register } = useAuth();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [clave, setClave] = useState('');
  const [tocados, setTocados] = useState({ nombre: false, correo: false, telefono: false, clave: false });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revisaCorreo, setRevisaCorreo] = useState(false);

  const tel = normalizePhone(telefono);
  const errores = {
    nombre: nombre.trim() ? undefined : 'Ingresa tu nombre.',
    correo: isEmail(correo) ? undefined : 'Ingresa un correo válido.',
    telefono: tel ? undefined : 'Ingresa un celular colombiano de 10 dígitos (ej. 300 123 4567).',
    clave: clave.length >= 6 ? undefined : 'Mínimo 6 caracteres.',
  };
  const hayErrores = Object.values(errores).some(Boolean);
  const tocar = (campo: keyof typeof tocados) => () => setTocados((t) => ({ ...t, [campo]: true }));
  const ver = (campo: keyof typeof tocados) => (tocados[campo] ? errores[campo] : undefined);

  const enviar = () => {
    if (hayErrores || !tel) {
      setTocados({ nombre: true, correo: true, telefono: true, clave: true });
      return;
    }
    if (enviando) return; // sin doble envío
    setEnviando(true);
    setError(null);
    // Con sesión inmediata la guardia lleva a Inicio; sin sesión ("Confirm email") se pide revisar el correo.
    register({ nombre: nombre.trim(), correo: correo.trim(), telefono: tel, password: clave }).then(
      ({ needsEmailConfirmation }) => {
        if (needsEmailConfirmation) setRevisaCorreo(true);
        setEnviando(false);
      },
      (e: Error) => {
        setError(e.message);
        setEnviando(false);
      },
    );
  };

  if (revisaCorreo) {
    return (
      <Screen edges={['bottom']}>
        <Reanimated.View entering={entrada(0)} style={styles.revisa}>
          <Logo icon="mark-email-unread" />
          <AppText variant="heading" style={styles.centrado}>
            Revisa tu correo
          </AppText>
          <AppText color={colors.textMuted} style={styles.centrado}>
            Te enviamos un enlace para confirmar tu cuenta. Después vuelve e inicia sesión.
          </AppText>
        </Reanimated.View>
        <Button title="Ir a iniciar sesión" onPress={() => router.replace('/login')} />
      </Screen>
    );
  }

  return (
    <Screen scroll edges={['bottom']}>
      <Pressable
        accessibilityLabel="Volver"
        accessibilityRole="button"
        onPress={() => router.back()}
        style={styles.back}
      >
        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Reanimated.View entering={entrada(0)}>
        <AppText variant="heading">Crear cuenta</AppText>
        <AppText color={colors.textMuted} style={styles.subtitle}>
          Únete a la red de seguridad más avanzada.
        </AppText>
      </Reanimated.View>

      <Reanimated.View entering={entrada(1)}>
      <TextField
        label="NOMBRE COMPLETO"
        placeholder="Ej: María García"
        autoComplete="name"
        value={nombre}
        editable={!enviando}
        onChangeText={setNombre}
        onBlur={tocar('nombre')}
        error={ver('nombre')}
      />
      </Reanimated.View>
      <Reanimated.View entering={entrada(2)}>
      <TextField
        label="CORREO ELECTRÓNICO"
        placeholder="nombre@ejemplo.com"
        keyboardType="email-address"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        value={correo}
        editable={!enviando}
        onChangeText={setCorreo}
        onBlur={tocar('correo')}
        error={ver('correo')}
      />
      </Reanimated.View>
      <Reanimated.View entering={entrada(3)}>
      <TextField
        label="TELÉFONO"
        prefix="+57"
        placeholder="300 123 4567"
        keyboardType="phone-pad"
        maxLength={12}
        value={telefono}
        editable={!enviando}
        onChangeText={setTelefono}
        onBlur={tocar('telefono')}
        error={ver('telefono')}
      />
      </Reanimated.View>
      <Reanimated.View entering={entrada(4)}>
      <TextField
        label="CONTRASEÑA"
        placeholder="••••••••"
        secure
        autoComplete="new-password"
        autoCapitalize="none"
        value={clave}
        editable={!enviando}
        onChangeText={setClave}
        onBlur={tocar('clave')}
        error={ver('clave')}
      />
      </Reanimated.View>

      <Reanimated.View entering={entrada(5)} style={styles.cta}>
        {error ? <ErrorBanner texto={error} /> : null}
        <Button title="Crear cuenta" onPress={enviar} disabled={hayErrores} loading={enviando} />
      </Reanimated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { width: 48, height: 48, justifyContent: 'center', marginLeft: -space.sm },
  subtitle: { marginTop: space.xs, marginBottom: space.lg },
  cta: { marginTop: space.md, marginBottom: space.xl },
  revisa: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  centrado: { textAlign: 'center' },
});
