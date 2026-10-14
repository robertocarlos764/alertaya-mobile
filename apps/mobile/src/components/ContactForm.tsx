import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Reanimated from 'react-native-reanimated';

import { Avatar, AppText, Button, Chip, entrada, Screen, TextField, toast } from '@/components/ui';
import { normalizePhone } from '@/demo/logic';
import { useDemo } from '@/demo/store';
import { colors, space } from '@/theme';

const RELACIONES = ['Mamá', 'Papá', 'Pareja', 'Hermano/a', 'Amigo/a', 'Otro'];

// Compartido por "nuevo" y "editar" (CONT-01 en UI).
export function ContactForm({ id }: { id?: string }) {
  const { contacts, addContact, updateContact } = useDemo();
  const existente = id ? contacts.find((c) => c.id === id) : undefined;
  const falta = !!id && !existente;

  const [nombre, setNombre] = useState(existente?.nombre ?? '');
  // Al editar se muestran los 10 dígitos locales.
  const [telefono, setTelefono] = useState(existente ? existente.telefono.replace('+57', '') : '');
  const [relacion, setRelacion] = useState<string | undefined>(existente?.relacion);
  const [tocados, setTocados] = useState({ nombre: false, telefono: false });

  useEffect(() => {
    if (falta) router.back();
  }, [falta]);
  if (falta) return null;

  const tel = normalizePhone(telefono);
  const duplicado = !!tel && contacts.some((c) => c.telefono === tel && c.id !== id);
  const errores = {
    nombre: nombre.trim() ? undefined : 'El nombre es obligatorio.',
    telefono: !tel
      ? 'Ingresa un celular colombiano de 10 dígitos (ej. 300 123 4567).'
      : duplicado
        ? 'Ya tienes un contacto con ese número.'
        : undefined,
  };
  const hayErrores = !!errores.nombre || !!errores.telefono;

  const guardar = () => {
    if (hayErrores || !tel) {
      setTocados({ nombre: true, telefono: true });
      return;
    }
    const datos = { nombre: nombre.trim(), telefono: tel, relacion };
    if (existente) updateContact({ ...datos, id: existente.id });
    else addContact(datos);
    toast(existente ? 'Cambios guardados.' : `${datos.nombre} agregado.`);
    router.back();
  };

  return (
    <Screen scroll edges={['bottom']}>
      <Reanimated.View entering={entrada(0)} style={styles.header}>
        <Pressable
          accessibilityLabel="Volver"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.back}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="heading">{existente ? 'Editar contacto' : 'Nuevo contacto'}</AppText>
      </Reanimated.View>

      <Reanimated.View entering={entrada(1)} style={styles.avatar}>
        <Avatar nombre={nombre} size={80} />
      </Reanimated.View>

      <Reanimated.View entering={entrada(2)}>
      <AppText variant="label" color={colors.textMuted} style={styles.section}>
        INFORMACIÓN
      </AppText>
      <TextField
        label="NOMBRE COMPLETO"
        placeholder="Ej: María García"
        autoComplete="name"
        value={nombre}
        onChangeText={setNombre}
        onBlur={() => setTocados((t) => ({ ...t, nombre: true }))}
        error={tocados.nombre ? errores.nombre : undefined}
      />
      <TextField
        label="TELÉFONO"
        prefix="+57"
        placeholder="300 123 4567"
        keyboardType="phone-pad"
        maxLength={12}
        value={telefono}
        onChangeText={setTelefono}
        onBlur={() => setTocados((t) => ({ ...t, telefono: true }))}
        error={tocados.telefono ? errores.telefono : undefined}
      />
      </Reanimated.View>

      <Reanimated.View entering={entrada(3)}>
      <AppText variant="label" color={colors.textMuted} style={styles.fieldLabel}>
        RELACIÓN (OPCIONAL)
      </AppText>
      <View style={styles.chips}>
        {RELACIONES.map((r) => (
          <Chip key={r} label={r} selected={relacion === r} onPress={() => setRelacion(relacion === r ? undefined : r)} />
        ))}
      </View>
      </Reanimated.View>

      <Reanimated.View entering={entrada(4)} style={styles.cta}>
        <Button title="Guardar contacto" onPress={guardar} disabled={hayErrores} />
      </Reanimated.View>
      {!existente ? (
        <AppText variant="meta" color={colors.textMuted} style={styles.note}>
          Este contacto recibirá un SMS con un enlace cuando actives una alerta.
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginLeft: -space.sm },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  avatar: { alignItems: 'center', marginVertical: space.lg },
  section: { marginBottom: space.md },
  fieldLabel: { marginBottom: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cta: { marginTop: space.lg, marginBottom: space.xl },
  note: { textAlign: 'center', marginTop: -space.sm, marginBottom: space.lg },
});
