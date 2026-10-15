import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Reanimated from 'react-native-reanimated';

import { LiveMap } from '@/components/LiveMap';
import { Avatar, AppText, Card, entrada, infoEstado, Screen } from '@/components/ui';
import { formatElapsed, formatFecha, formatPhone } from '@/demo/logic';
import { useLocalExtras } from '@/data';
import { formatDistance, placeLine, trailSummary } from '@/data/geo';
import { usePlaceName } from '@/lib/usePlaceName';
import { colors, space } from '@/theme';

export default function DetalleHistorial() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { history } = useLocalExtras();
  const item = history.find((h) => h.id === id);
  const inicio = item?.trail[0] ?? null;
  const lugar = usePlaceName(inicio);

  useEffect(() => {
    if (!item) router.back();
  }, [item]);
  if (!item) return null;
  const resumen = trailSummary(item.trail);
  const fin = item.trail[item.trail.length - 1];

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
            Inicio {hora(item.createdAt)} · Fin {hora(item.endedAt)} · Duración {formatElapsed(item.endedAt - item.createdAt)}
          </AppText>
          <AppText variant="meta" color={colors.textMuted}>
            Activada con el botón
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
        {inicio && fin ? (
          <>
            <LiveMap
              point={{ lat: fin.lat, lon: fin.lon, precisionMetros: fin.accuracy }}
              trail={item.trail}
              height={240}
              interactive
              label="Mapa con el recorrido de la alerta"
            />
            <View style={styles.leyenda}>
              <View style={styles.leyendaItem}>
                <View style={[styles.marca, styles.marcaInicio]} />
                <AppText variant="meta" color={colors.textMuted}>
                  Inicio {hora(inicio.at)}
                </AppText>
              </View>
              <View style={styles.leyendaItem}>
                <View style={[styles.marca, styles.marcaFin]} />
                <AppText variant="meta" color={colors.textMuted}>
                  {item.trail.length > 1 ? `Fin ${hora(fin.at)}` : 'Único punto'}
                </AppText>
              </View>
            </View>
            <Card style={styles.datos}>
              <Dato titulo="EMPEZÓ EN" valor={placeLine(lugar.name, lugar.status, inicio)} />
              <View style={styles.fila}>
                <Dato titulo="DISTANCIA" valor={`≈ ${formatDistance(resumen.distanceM)}`} />
                <Dato titulo="EN MOVIMIENTO" valor={formatElapsed(resumen.durationMs)} />
                <Dato titulo="PUNTOS" valor={String(resumen.points)} />
              </View>
            </Card>
          </>
        ) : (
          <Card style={styles.sin}>
            <MaterialIcons name="location-off" size={32} color={colors.warning} />
            <AppText style={styles.centrado}>
              No hay recorrido: esta alerta no registró ninguna ubicación (salió con ubicación pendiente).
            </AppText>
          </Card>
        )}
      </Reanimated.View>


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

const hora = (ms: number) => new Date(ms).toLocaleTimeString('es-CO', { timeStyle: 'short' });

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <View style={styles.flex}>
      <AppText variant="label" color={colors.textMuted}>
        {titulo}
      </AppText>
      <AppText style={styles.negrita}>{valor}</AppText>
    </View>
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
  leyenda: { flexDirection: 'row', gap: space.md, marginTop: space.sm },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  marca: { width: 10, height: 10, borderRadius: 5 },
  marcaInicio: { backgroundColor: colors.text },
  marcaFin: { backgroundColor: colors.accent },
  datos: { marginTop: space.sm, gap: space.md },
  fila: { flexDirection: 'row', gap: space.md },
  contacto: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
});
