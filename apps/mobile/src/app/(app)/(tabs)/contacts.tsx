import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Avatar, AppText, Button, Header, Screen } from '@/components/ui';
import { formatPhone } from '@/demo/logic';
import { useDemo } from '@/demo/store';
import { colors, radius, space } from '@/theme';

export default function Contactos() {
  const { contacts, removeContact } = useDemo();

  const confirmarEliminar = (id: string, nombre: string) =>
    Alert.alert(
      'Eliminar contacto',
      `¿Eliminar a ${nombre} de tus contactos de emergencia? Dejará de recibir tus alertas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => removeContact(id) },
      ],
    );

  return (
    <Screen edges={[]}>
      <Header />
      <AppText variant="heading">Contactos</AppText>
      {contacts.length > 0 ? (
        <AppText color={colors.textMuted} style={styles.count}>
          {contacts.length === 1 ? '1 contacto de emergencia' : `${contacts.length} contactos de emergencia`}
        </AppText>
      ) : null}

      {contacts.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="heading">Sin contactos aún</AppText>
          <AppText color={colors.textMuted} style={styles.emptyBody}>
            Agrega a quienes quieres que avisemos en una emergencia. Necesitas al menos uno para usar SOS.
          </AppText>
          <Button title="Agregar contacto" variant="outline" onPress={() => router.push('/contacts/new')} />
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.gap} />}
          renderItem={({ item }) => (
            <Pressable
              accessibilityLabel={`Editar a ${item.nombre}`}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/contacts/[id]', params: { id: item.id } })}
              style={styles.row}
            >
              <Avatar nombre={item.nombre} size={40} />
              <View style={styles.rowText}>
                <AppText numberOfLines={1} style={styles.name}>
                  {item.nombre}
                </AppText>
                <AppText variant="meta" color={colors.textMuted} numberOfLines={1}>
                  {item.relacion ? `${item.relacion} · ` : ''}
                  {formatPhone(item.telefono)}
                </AppText>
              </View>
              <Pressable
                accessibilityLabel={`Eliminar a ${item.nombre}`}
                accessibilityRole="button"
                onPress={() => confirmarEliminar(item.id, item.nombre)}
                style={styles.delete}
              >
                <MaterialIcons name="delete-outline" size={24} color={colors.textMuted} />
              </Pressable>
            </Pressable>
          )}
        />
      )}

      <Pressable
        accessibilityLabel="Agregar contacto"
        accessibilityRole="button"
        onPress={() => router.push('/contacts/new')}
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.95 }] }]}
      >
        <MaterialIcons name="add" size={28} color={colors.text} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  count: { marginTop: space.xs },
  list: { paddingTop: space.md, paddingBottom: 80 },
  gap: { height: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 72,
    padding: space.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.row,
  },
  rowText: { flex: 1 },
  name: { fontWeight: '600' },
  delete: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: -space.sm },
  empty: { flex: 1, justifyContent: 'center', gap: space.md },
  emptyBody: { marginBottom: space.sm },
  fab: {
    position: 'absolute',
    right: space.md,
    bottom: space.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
