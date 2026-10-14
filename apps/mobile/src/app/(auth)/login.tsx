import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Reanimated from 'react-native-reanimated';

import { AppText, Button, entrada, Logo, Screen, TextField } from '@/components/ui';
import { isEmail } from '@/demo/logic';
import { useDemo } from '@/demo/store';
import { colors, space } from '@/theme';

export default function Login() {
  const { login } = useDemo();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [tocados, setTocados] = useState({ correo: false, clave: false });

  const errCorreo = isEmail(correo) ? undefined : 'Ingresa un correo válido.';
  const errClave = clave.length >= 6 ? undefined : 'Mínimo 6 caracteres.';
  const hayErrores = !!errCorreo || !!errClave;

  const enviar = () => {
    if (hayErrores) {
      setTocados({ correo: true, clave: true });
      return;
    }
    // La contraseña solo se valida; nunca llega al store. La guardia de sesión lleva a Inicio.
    login(correo.trim());
  };

  return (
    <Screen scroll edges={['bottom']}>
      <Reanimated.View entering={entrada(0)} style={styles.hero}>
        <Logo />
        <AppText variant="heading" style={styles.title}>
          AlertaYA
        </AppText>
        <AppText color={colors.textMuted} style={styles.center}>
          Protección de alto nivel para lo que más importa.
        </AppText>
      </Reanimated.View>

      <Reanimated.View entering={entrada(1)}>
      <TextField
        label="CORREO ELECTRÓNICO"
        placeholder="nombre@ejemplo.com"
        keyboardType="email-address"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        value={correo}
        onChangeText={setCorreo}
        onBlur={() => setTocados((t) => ({ ...t, correo: true }))}
        error={tocados.correo ? errCorreo : undefined}
      />
      </Reanimated.View>
      <Reanimated.View entering={entrada(2)}>
      <TextField
        label="CONTRASEÑA"
        placeholder="••••••••"
        secure
        autoComplete="password"
        autoCapitalize="none"
        value={clave}
        onChangeText={setClave}
        onBlur={() => setTocados((t) => ({ ...t, clave: true }))}
        error={tocados.clave ? errClave : undefined}
      />
      </Reanimated.View>

      <Reanimated.View entering={entrada(3)} style={styles.cta}>
        <Button title="Iniciar sesión" onPress={enviar} disabled={hayErrores} />
      </Reanimated.View>

      <Reanimated.View entering={entrada(4)}>
        <Pressable accessibilityRole="link" onPress={() => router.push('/register')} style={styles.link}>
          <Text style={styles.linkMuted}>
            ¿No tienes una cuenta? <Text style={styles.linkStrong}>Crear cuenta</Text>
          </Text>
        </Pressable>
      </Reanimated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: space.xl, marginBottom: space.lg, gap: space.sm },
  title: { marginTop: space.sm },
  center: { textAlign: 'center' },
  cta: { marginTop: space.md },
  link: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: space.md },
  linkMuted: { color: colors.textMuted, fontSize: 16 },
  linkStrong: { color: colors.text, fontWeight: '600' },
});
