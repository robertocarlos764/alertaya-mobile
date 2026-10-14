import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { HoldButton } from '@/components/HoldButton';
import { AppText, Button, Card, Header, Screen, toast } from '@/components/ui';
import { useDemo } from '@/demo/store';
import { useLocation, type EstadoUbicacion } from '@/lib/useLocation';
import { colors, radius, space } from '@/theme';

export default function Inicio() {
  const { contacts, logout } = useDemo();
  const { state, fix, request } = useLocation();
  const [presionando, setPresionando] = useState(false);
  const sinContactos = contacts.length === 0;

  return (
    <Screen edges={[]}>
      <Header />
      <View style={styles.flex} />

      <View style={styles.center}>
        <HoldButton
          variant="ring"
          durationMs={2000}
          disabled={sinContactos}
          onDisabledPress={() =>
            toast('Agrega al menos un contacto para usar SOS.', {
              label: 'AGREGAR',
              onPress: () => router.push('/contacts/new'),
            })
          }
          onPressingChange={setPresionando}
          onComplete={() => router.push('/countdown')}
          accessibilityLabel="Botón SOS"
          accessibilityHint="Mantén presionado dos segundos para iniciar la cuenta regresiva"
          actionLabel="Iniciar cuenta regresiva SOS"
        />
        <View style={styles.help}>
          {sinContactos ? (
            <>
              <AppText color={colors.textMuted} style={styles.centerText}>
                Agrega al menos un contacto para poder usar SOS.
              </AppText>
              <Button title="Agregar contacto" variant="cool" onPress={() => router.push('/contacts/new')} />
            </>
          ) : (
            <AppText color={presionando ? colors.text : colors.textMuted} style={styles.centerText}>
              {presionando ? 'Sigue presionando…' : 'Mantén presionado 2 segundos para activar.'}
            </AppText>
          )}
        </View>
      </View>

      <View style={styles.flex} />

      <Card style={styles.card}>
        <View style={styles.mapIcon}>
          <MaterialIcons name="map" size={24} color={colors.textMuted} />
        </View>
        <View style={styles.cardText}>
          <AppText variant="label" color={colors.textMuted}>
            UBICACIÓN ACTUAL
          </AppText>
          <LineaUbicacion state={state} accuracy={fix?.accuracy ?? null} request={request} />
        </View>
        <MaterialIcons name="my-location" size={24} color={colors.textMuted} />
      </Card>

      <Button title="Cerrar sesión" variant="ghost" onPress={logout} />
    </Screen>
  );
}

const PUNTO: Record<EstadoUbicacion, string> = {
  sin_permiso: colors.warning,
  denegado: colors.warning,
  obteniendo: colors.textMuted,
  fijada: colors.success,
  sin_senal: colors.warning,
};

function LineaUbicacion({
  state,
  accuracy,
  request,
}: {
  state: EstadoUbicacion;
  accuracy: number | null;
  request: () => Promise<unknown>;
}) {
  const texto: Record<EstadoUbicacion, string> = {
    sin_permiso: 'Permite la ubicación para que tus contactos te vean en el mapa.',
    denegado: 'Sin permiso de ubicación. Tu alerta saldrá con ubicación pendiente.',
    obteniendo: 'Obteniendo ubicación…',
    fijada: accuracy == null ? 'Ubicación lista' : `Ubicación lista · ±${accuracy} m`,
    sin_senal: 'Sin señal GPS. Tu alerta saldrá con ubicación pendiente.',
  };
  return (
    <View>
      <View style={styles.dotRow}>
        <View style={[styles.dot, { backgroundColor: PUNTO[state] }]} />
        <AppText variant="meta" color={colors.text} style={styles.flex}>
          {texto[state]}
        </AppText>
      </View>
      {state === 'sin_permiso' ? (
        <View style={styles.action}>
          <Button title="Permitir ubicación" onPress={() => request()} />
        </View>
      ) : null}
      {state === 'denegado' && Platform.OS === 'web' ? (
        <AppText variant="meta" color={colors.textMuted} style={styles.action}>
          Permite la ubicación desde el candado de la barra de direcciones.
        </AppText>
      ) : null}
      {state === 'denegado' && Platform.OS !== 'web' ? (
        <Pressable accessibilityRole="link" onPress={() => Linking.openSettings()} style={styles.link}>
          <AppText color={colors.warning} style={styles.linkText}>
            Abrir ajustes
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center' },
  centerText: { textAlign: 'center' },
  help: { marginTop: space.xl, alignSelf: 'stretch', gap: space.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.sm,
  },
  mapIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.row,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: space.xs },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  action: { marginTop: space.sm },
  link: { minHeight: 48, justifyContent: 'center' },
  linkText: { fontWeight: '600' },
});
