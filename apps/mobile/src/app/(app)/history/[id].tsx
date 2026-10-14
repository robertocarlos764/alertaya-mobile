import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Reanimated from 'react-native-reanimated';

import { TrailMap } from '@/components/TrailMap';
import { Avatar, AppText, Card, entrada, infoEstado, Screen } from '@/components/ui';
import { formatElapsed, formatFecha, formatPhone } from '@/demo/logic';
import { useDemo } from '@/demo/store';
import { colors, space } from '@/theme';

export default function DetalleHistorial() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { history } = useDemo();
  const item = history.find((h) => h.id === id);

  useEffect(() => {
    if (!item) router.back();
  }, [item]);
  if (!item) return null;

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
        <AppText variant="heading">Detalle de la alerta</AppText>
      </Reanimated.View>

      <Reanimated.View entering={entrada(1)}>
        <Card style={styles.resumen}>
          <AppText style={styles.negrita}>{formatFecha(item.createdAt)}</AppText>
          <AppText variant="meta" color={colors.textMuted}>
            Activada con el botón · Duración {formatElapsed(item.endedAt - item.createdAt)}
          </AppText>
          <AppText variant="meta" color={colors.textMuted}>
            Estados simulados (modo demo).
          </AppText>
        </Card>
      </Reanimated.View>

      <Reanimated.View entering={entrada(2)}>
        <AppText variant="label" color={colors.textMuted} style={styles.seccion}>
          RECORRIDO
        </AppText>
        {item.trail.length > 0 ? (
          <TrailMap trail={item.trail} />
        ) : (
          <Card style={styles.sin}>
            <MaterialIcons name="location-off" size={32} color={colors.warning} />
            <AppText style={styles.centrado}>
              Sin ubicación registrada: la alerta salió con ubicación pendiente.
            </AppText>
          </Card>
        )}
      </Reanimated.View>

      {item.trail.length > 0 ? (
        <Reanimated.View entering={entrada(3)}>
          <AppText variant="label" color={colors.textMuted} style={styles.seccion}>
            PUNTOS DE UBICACIÓN
          </AppText>
          {item.trail.map((p) => (
            <View key={p.at} style={styles.punto}>
              <AppText variant="meta" color={colors.textMuted}>
                {new Date(p.at).toLocaleTimeString('es-CO', { timeStyle: 'medium' })}
                {p.accuracy == null ? '' : ` · ±${p.accuracy} m`}
              </AppText>
              <AppText variant="meta">
                {p.lat.toFixed(5)}, {p.lon.toFixed(5)}
              </AppText>
            </View>
          ))}
        </Reanimated.View>
      ) : null}

      <Reanimated.View entering={entrada(4)}>
        <AppText variant="label" color={colors.textMuted} style={styles.seccion}>
          CONTACTOS
        </AppText>
        {item.contactos.map((c) => {
          const e = infoEstado(c.estado);
          return (
            <Card key={c.telefono + c.nombre} style={styles.contacto}>
              <Avatar nombre={c.nombre} size={40} />
              <View style={styles.flex}>
                <AppText numberOfLines={1} style={styles.negrita}>
                  {c.nombre}
                </AppText>
                <AppText variant="meta" color={colors.textMuted}>
                  {formatPhone(c.telefono)}
                </AppText>
              </View>
              <MaterialIcons name={e.icono} size={20} color={e.color} />
              <AppText variant="meta" color={e.color}>
                {e.etiqueta}
              </AppText>
            </Card>
          );
        })}
      </Reanimated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginLeft: -space.sm },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  resumen: { gap: space.xs },
  negrita: { fontWeight: '600' },
  seccion: { marginTop: space.lg, marginBottom: space.sm },
  sin: { alignItems: 'center', gap: space.sm },
  centrado: { textAlign: 'center' },
  punto: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.xs },
  contacto: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
});
