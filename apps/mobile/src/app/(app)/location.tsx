// Ubicación actual (desde la tarjeta de Inicio): mapa en la ubicación real, pulso, precisión, antigüedad y
// nombre del lugar. Sin permiso o sin GPS: "Ubicación pendiente" (nunca una ubicación sustituta).
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import Reanimated from 'react-native-reanimated';

import { LiveMap } from '@/components/LiveMap';
import { AppText, Button, Card, entrada, Screen } from '@/components/ui';
import { placeLine } from '@/data/geo';
import { ago, mapsUrl } from '@/demo/logic';
import { useLocation, type EstadoUbicacion } from '@/lib/useLocation';
import { usePlaceName } from '@/lib/usePlaceName';
import { colors, space } from '@/theme';

const DOS_MIN = 2 * 60 * 1000;

const PENDIENTE: Record<Exclude<EstadoUbicacion, 'fijada'>, string> = {
  sin_permiso: 'Permite la ubicación para ver dónde estás.',
  denegado: 'Sin permiso de ubicación.',
  obteniendo: 'Buscando señal GPS…',
  sin_senal: 'Sin señal GPS.',
};

export default function UbicacionActual() {
  const { state, fix, request } = useLocation();
  const lugar = usePlaceName(fix);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const vieja = fix ? now - fix.at > DOS_MIN : false;

  return (
    <Screen scroll edges={['bottom']}>
      <Reanimated.View entering={entrada(0)} style={styles.header}>
        <Pressable accessibilityLabel="Volver" accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="heading">Ubicación actual</AppText>
      </Reanimated.View>

      {fix ? (
        <>
          <Reanimated.View entering={entrada(1)}>
            <LiveMap
              point={{ lat: fix.lat, lon: fix.lon, precisionMetros: fix.accuracy }}
              live
              height={360}
              label="Mapa con tu ubicación actual"
            />
          </Reanimated.View>
          <Reanimated.View entering={entrada(2)}>
            <Card style={styles.datos}>
              <AppText variant="label" color={colors.textMuted}>
                ESTÁS CERCA DE
              </AppText>
              <AppText style={styles.negrita} accessibilityLiveRegion="polite">
                {placeLine(lugar.name, lugar.status, fix)}
              </AppText>
              <AppText variant="meta" color={vieja ? colors.warning : colors.textMuted}>
                {fix.accuracy == null ? '' : `Precisión ±${fix.accuracy} m · `}
                {ago(now - fix.at)}
                {vieja ? ' — sin actualizar' : ''}
              </AppText>
            </Card>
            <View style={styles.accion}>
              <Button
                title="Abrir en Google Maps"
                variant="outline"
                icon="map"
                onPress={() => Linking.openURL(mapsUrl(fix.lat, fix.lon))}
              />
            </View>
          </Reanimated.View>
        </>
      ) : (
        <Reanimated.View entering={entrada(1)}>
          <Card style={styles.pendiente}>
            <MaterialIcons name="location-off" size={32} color={colors.warning} />
            <AppText style={[styles.negrita, styles.centrado]}>Ubicación pendiente</AppText>
            <AppText color={colors.textMuted} style={styles.centrado}>
              {PENDIENTE[state === 'fijada' ? 'obteniendo' : state]}
            </AppText>
          </Card>
          {state === 'sin_permiso' ? (
            <View style={styles.accion}>
              <Button title="Permitir ubicación" onPress={() => request()} />
            </View>
          ) : null}
          {state === 'denegado' && Platform.OS !== 'web' ? (
            <View style={styles.accion}>
              <Button title="Abrir ajustes" variant="outline" onPress={() => Linking.openSettings()} />
            </View>
          ) : null}
        </Reanimated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginLeft: -space.sm, marginBottom: space.md },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  negrita: { fontWeight: '600' },
  centrado: { textAlign: 'center' },
  datos: { marginTop: space.md, gap: space.xs },
  accion: { marginTop: space.md },
  pendiente: { height: 240, alignItems: 'center', justifyContent: 'center', gap: space.sm, borderColor: colors.warning },
});
