import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Reanimated from 'react-native-reanimated';

import { AppText, Card, entrada, Header, infoEstado, PressableScale, Screen } from '@/components/ui';
import { formatElapsed, formatFecha } from '@/demo/logic';
import { useLocalExtras } from '@/data';
import { colors, radius, space } from '@/theme';

export default function Historial() {
  const { history } = useLocalExtras();

  return (
    <Screen edges={[]}>
      <Reanimated.View entering={entrada(0)}>
        <Header />
        <AppText variant="heading">Historial</AppText>
      </Reanimated.View>

      {history.length === 0 ? (
        <Reanimated.View entering={entrada(1)} style={styles.empty}>
          <MaterialIcons name="history" size={48} color={colors.textMuted} />
          <AppText variant="heading" style={styles.centrado}>
            Aún no tienes alertas
          </AppText>
          <AppText color={colors.textMuted} style={styles.centrado}>
            Cuando finalices una alerta aparecerá aquí con su recorrido y lo que pasó con cada contacto.
          </AppText>
        </Reanimated.View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <AppText variant="meta" color={colors.textMuted} style={styles.nota}>
            Estados simulados (modo demo).
          </AppText>
          {history.map((h, i) => (
            <Reanimated.View key={h.id} entering={entrada(i + 1)} style={styles.fila}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Alerta del ${formatFecha(h.createdAt)}`}
                onPress={() => router.push({ pathname: '/history/[id]', params: { id: h.id } })}
              >
                <Card style={styles.card}>
                  <View style={styles.cabecera}>
                    <AppText style={styles.fecha}>{formatFecha(h.createdAt)}</AppText>
                    <View style={styles.chip}>
                      <AppText variant="label" color={colors.cyan}>
                        Botón
                      </AppText>
                    </View>
                  </View>
                  <AppText variant="meta" color={colors.textMuted}>
                    Duración {formatElapsed(h.endedAt - h.createdAt)}
                  </AppText>
                  {h.contactos.map((c) => {
                    const e = infoEstado(c.estado);
                    return (
                      <View key={c.telefono + c.nombre} style={styles.contacto}>
                        <AppText numberOfLines={1} style={styles.nombre}>
                          {c.nombre}
                        </AppText>
                        <MaterialIcons name={e.icono} size={16} color={e.color} />
                        <AppText variant="meta" color={e.color}>
                          {e.etiqueta}
                        </AppText>
                      </View>
                    );
                  })}
                </Card>
              </PressableScale>
            </Reanimated.View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: space.md, paddingBottom: space.lg },
  nota: { marginBottom: space.sm },
  fila: { marginBottom: space.sm },
  card: { gap: space.xs },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  fecha: { fontWeight: '600', flex: 1 },
  chip: {
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.violetSoft,
  },
  contacto: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs },
  nombre: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: space.md },
  centrado: { textAlign: 'center' },
});
