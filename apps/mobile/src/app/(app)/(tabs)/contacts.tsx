import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Reanimated, { FadeInDown, FadeOutLeft, LinearTransition } from 'react-native-reanimated';

import {
  Avatar,
  AppText,
  Button,
  entrada,
  Header,
  PressableScale,
  Screen,
  SkeletonRows,
  toast,
} from '@/components/ui';
import { formatPhone } from '@/demo/logic';
import { useContacts } from '@/data';
import { colors, gradients, radius, space } from '@/theme';

export default function Contactos() {
  const { list, remove, reload } = useContacts();
  const contacts = list.status === 'ready' ? list.items : [];

  const eliminar = (id: string, nombre: string) => {
    remove(id).then(
      () => toast(`${nombre} eliminado.`),
      (e: Error) => toast(e.message),
    );
  };

  const confirmarEliminar = (id: string, nombre: string) => {
    const mensaje = `¿Eliminar a ${nombre} de tus contactos de emergencia? Dejará de recibir tus alertas.`;
    // Alert.alert de react-native-web no hace nada: en web se usa el confirm del navegador.
    if (Platform.OS === 'web') {
      if (window.confirm(mensaje)) eliminar(id, nombre);
      return;
    }
    Alert.alert('Eliminar contacto', mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => eliminar(id, nombre) },
    ]);
  };

  return (
    <Screen edges={[]}>
      <Reanimated.View entering={entrada(0)}>
        <Header />
      </Reanimated.View>
      <Reanimated.View entering={entrada(1)}>
        <AppText variant="heading">Contactos</AppText>
        {contacts.length > 0 ? (
          <AppText color={colors.textMuted} style={styles.count}>
            {contacts.length === 1 ? '1 contacto de emergencia' : `${contacts.length} contactos de emergencia`}
          </AppText>
        ) : null}
      </Reanimated.View>

      {list.status === 'loading' ? (
        <View style={styles.list}>
          <SkeletonRows />
        </View>
      ) : list.status === 'error' ? (
        <Reanimated.View entering={entrada(2)} style={styles.empty}>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="cloud-off" size={40} color={colors.warning} />
          </View>
          <AppText variant="heading" style={styles.centrado}>
            No pudimos cargar tus contactos.
          </AppText>
          <AppText color={colors.textMuted} style={[styles.emptyBody, styles.centrado]}>
            {list.message}
          </AppText>
          <Button title="Reintentar" variant="outline" icon="refresh" onPress={reload} />
        </Reanimated.View>
      ) : contacts.length === 0 ? (
        <Reanimated.View entering={entrada(2)} style={styles.empty}>
          <View style={styles.emptyIcon}>
            <LinearGradient colors={gradients.cool} style={styles.emptyCircle}>
              <MaterialIcons name="group" size={40} color={colors.text} />
            </LinearGradient>
          </View>
          <AppText variant="heading" style={styles.centrado}>
            Sin contactos aún
          </AppText>
          <AppText color={colors.textMuted} style={[styles.emptyBody, styles.centrado]}>
            Agrega a quienes quieres que avisemos en una emergencia. Necesitas al menos uno para usar SOS.
          </AppText>
          <Button title="Agregar contacto" variant="cool" onPress={() => router.push('/contacts/new')} />
        </Reanimated.View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {/* ponytail: ScrollView + map (sin FlatList) para poder animar entradas y salidas; el store
              limita a ~15 contactos por SecureStore. */}
          {contacts.map((item, i) => (
            <Reanimated.View
              key={item.id}
              entering={FadeInDown.delay(i * 60)}
              exiting={FadeOutLeft}
              layout={LinearTransition}
              style={styles.fila}
            >
              <PressableScale
                accessibilityLabel={`Editar a ${item.nombre}`}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/contacts/[id]', params: { id: item.id } })}
                style={styles.row}
              >
                <LinearGradient colors={gradients.card} style={StyleSheet.absoluteFill} />
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
                <PressableScale
                  accessibilityLabel={`Eliminar a ${item.nombre}`}
                  accessibilityRole="button"
                  onPress={() => confirmarEliminar(item.id, item.nombre)}
                  style={styles.delete}
                >
                  <MaterialIcons name="delete-outline" size={24} color={colors.textMuted} />
                </PressableScale>
              </PressableScale>
            </Reanimated.View>
          ))}
        </ScrollView>
      )}

      <PressableScale
        accessibilityLabel="Agregar contacto"
        accessibilityRole="button"
        onPress={() => router.push('/contacts/new')}
        style={styles.fab}
      >
        <LinearGradient colors={gradients.cool} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabFondo}>
          <MaterialIcons name="add" size={28} color={colors.text} />
        </LinearGradient>
      </PressableScale>
    </Screen>
  );
}

const styles = StyleSheet.create({
  count: { marginTop: space.xs },
  list: { paddingTop: space.md, paddingBottom: 80 },
  fila: { marginBottom: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 72,
    padding: space.md,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.row,
    overflow: 'hidden',
  },
  rowText: { flex: 1 },
  name: { fontWeight: '600' },
  delete: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: -space.sm },
  empty: { flex: 1, justifyContent: 'center', gap: space.md },
  emptyIcon: { alignItems: 'center' },
  emptyCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  emptyBody: { marginBottom: space.sm },
  centrado: { textAlign: 'center' },
  fab: { position: 'absolute', right: space.md, bottom: space.md, width: 56, height: 56, borderRadius: 28 },
  fabFondo: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
