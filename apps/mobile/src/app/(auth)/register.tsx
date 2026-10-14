import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Screen, TextField } from '@/components/ui';
import { isEmail, normalizePhone } from '@/demo/logic';
import { useDemo } from '@/demo/store';
import { colors, space } from '@/theme';

export default function Register() {
  const { register } = useDemo();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [clave, setClave] = useState('');
  const [tocados, setTocados] = useState({ nombre: false, correo: false, telefono: false, clave: false });

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
    // La contraseña solo se valida, nunca se guarda. La guardia de sesión lleva a Inicio.
    register({ nombre: nombre.trim(), correo: correo.trim(), telefono: tel });
  };

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
      <AppText variant="heading">Crear cuenta</AppText>
      <AppText color={colors.textMuted} style={styles.subtitle}>
        Únete a la red de seguridad más avanzada.
      </AppText>

      <TextField
        label="NOMBRE COMPLETO"
        placeholder="Ej: María García"
        autoComplete="name"
        value={nombre}
        onChangeText={setNombre}
        onBlur={tocar('nombre')}
        error={ver('nombre')}
      />
      <TextField
        label="CORREO ELECTRÓNICO"
        placeholder="nombre@ejemplo.com"
        keyboardType="email-address"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        value={correo}
        onChangeText={setCorreo}
        onBlur={tocar('correo')}
        error={ver('correo')}
      />
      <TextField
        label="TELÉFONO"
        prefix="+57"
        placeholder="300 123 4567"
        keyboardType="phone-pad"
        maxLength={12}
        value={telefono}
        onChangeText={setTelefono}
        onBlur={tocar('telefono')}
        error={ver('telefono')}
      />
      <TextField
        label="CONTRASEÑA"
        placeholder="••••••••"
        secure
        autoComplete="new-password"
        autoCapitalize="none"
        value={clave}
        onChangeText={setClave}
        onBlur={tocar('clave')}
        error={ver('clave')}
      />

      <View style={styles.cta}>
        <Button title="Crear cuenta" onPress={enviar} disabled={hayErrores} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { width: 48, height: 48, justifyContent: 'center', marginLeft: -space.sm },
  subtitle: { marginTop: space.xs, marginBottom: space.lg },
  cta: { marginTop: space.md, marginBottom: space.xl },
});
