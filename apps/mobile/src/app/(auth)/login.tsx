import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppText, Button, Screen, TextField } from '@/components/ui';
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
      <View style={styles.hero}>
        <MaterialIcons name="shield" size={48} color={colors.accent} />
        <AppText variant="heading" style={styles.title}>
          AlertaYA
        </AppText>
        <AppText color={colors.textMuted} style={styles.center}>
          Protección de alto nivel para lo que más importa.
        </AppText>
      </View>

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

      <View style={styles.cta}>
        <Button title="Iniciar sesión" onPress={enviar} disabled={hayErrores} />
      </View>

      <Pressable accessibilityRole="link" onPress={() => router.push('/register')} style={styles.link}>
        <Text style={styles.linkMuted}>
          ¿No tienes una cuenta? <Text style={styles.linkStrong}>Crear cuenta</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: space.xxxl, marginBottom: space.xl, gap: space.sm },
  title: { marginTop: space.sm },
  center: { textAlign: 'center' },
  cta: { marginTop: space.md },
  link: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: space.md },
  linkMuted: { color: colors.textMuted, fontSize: 16 },
  linkStrong: { color: colors.text, fontWeight: '600' },
});
