// Vista del contacto: vista previa (modo demo) de la página pública /t/[token] de 01-UI-SPEC.
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import Reanimated from 'react-native-reanimated';

import { TrailMap } from '@/components/TrailMap';
import { AppText, Button, Card, entrada, PuntoActivo, Screen } from '@/components/ui';
import { ago, formatElapsed, mapsUrl, osmEmbedUrl } from '@/demo/logic';
import { useAlerts, useAuth } from '@/data';
import { colors, radius, space } from '@/theme';

const DOS_MIN = 2 * 60 * 1000;

export default function Seguimiento() {
  const { current: activeAlert } = useAlerts();
  const { session } = useAuth();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!activeAlert) return null; // transición: la guardia ya la está quitando

  const nombre = session?.nombre || 'Tu contacto';
  const telefono = session?.telefono ?? '';
  const location = activeAlert.ultimaUbicacion;
  const vieja = location ? now - location.capturadaEn > DOS_MIN : false;

  return (
    <Screen scroll edges={['bottom']}>
      <Reanimated.View entering={entrada(0)}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.volver}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          <AppText style={styles.negrita}>Volver a mi alerta</AppText>
        </Pressable>
        <AppText variant="meta" color={colors.textMuted}>
          Vista previa (modo demo) de la página que reciben tus contactos.
        </AppText>
      </Reanimated.View>

      <Reanimated.View entering={entrada(1)} style={styles.barra}>
        <View style={styles.marca}>
          <MaterialIcons name="shield" size={24} color={colors.accent} />
          <AppText color={colors.accent} style={styles.negrita}>
            AlertaYA
          </AppText>
        </View>
        {location ? (
          <View style={[styles.pill, { backgroundColor: colors.accentSoft }]}>
            <PuntoActivo />
            <AppText variant="label" color={colors.accent}>
              ACTIVA
            </AppText>
          </View>
        ) : (
          <View style={[styles.pill, { backgroundColor: colors.warningSoft }]}>
            <AppText variant="label" color={colors.warning}>
              UBICACIÓN PENDIENTE
            </AppText>
          </View>
        )}
      </Reanimated.View>

      <Reanimated.View entering={entrada(2)}>
        <View accessibilityLiveRegion="polite" style={[styles.banner, !location && styles.bannerPendiente]}>
          <AppText style={styles.negrita}>
            {location
              ? `${nombre} activó una alerta de emergencia.`
              : `Ubicación pendiente. ${nombre} aún no tiene señal GPS. Seguimos esperando.`}
          </AppText>
        </View>
      </Reanimated.View>

      <Reanimated.View entering={entrada(3)} style={styles.mapa}>
        {location && Platform.OS === 'web' ? (
          <iframe
            src={osmEmbedUrl(location.lat, location.lon)}
            title={`Mapa con la ubicación de ${nombre}`}
            referrerPolicy="no-referrer"
            loading="lazy"
            style={{ border: 0, width: '100%', height: 320, borderRadius: radius.card }}
          />
        ) : location ? (
          <TrailMap trail={activeAlert.trail.length ? activeAlert.trail : [location]} />
        ) : (
          <Card style={styles.sinUbicacion}>
            <MaterialIcons name="location-off" size={40} color={colors.warning} />
            <AppText color={colors.warning} style={styles.centrado}>
              Sin ubicación todavía: no mostramos un mapa hasta tener una señal GPS real.
            </AppText>
          </Card>
        )}
      </Reanimated.View>

      <Reanimated.View entering={entrada(4)}>
        <Card style={styles.hoja}>
          <AppText variant="heading">{nombre}</AppText>
          {location ? (
            <AppText color={vieja ? colors.warning : colors.textMuted}>
              Última ubicación {ago(now - location.capturadaEn)}
              {location.precisionMetros == null ? '' : ` · precisión ±${location.precisionMetros} m`}
              {vieja ? ' — sin actualizar' : ''}
            </AppText>
          ) : null}
          <AppText color={colors.textMuted}>Alerta iniciada hace {formatElapsed(now - activeAlert.creadoEn)}</AppText>
        </Card>
      </Reanimated.View>

      <Reanimated.View entering={entrada(5)} style={styles.acciones}>
        <Button
          title={`Llamar a ${nombre}`}
          icon="phone"
          disabled={!telefono}
          onPress={() => Linking.openURL('tel:' + telefono)}
        />
        <Button title="Llamar al 123" variant="outline" icon="phone" onPress={() => Linking.openURL('tel:123')} />
        <Button
          title="Abrir en Google Maps"
          variant="outline"
          icon="map"
          disabled={!location}
          onPress={() => location && Linking.openURL(mapsUrl(location.lat, location.lon))}
        />
        {!location ? (
          <AppText variant="meta" color={colors.textMuted} style={styles.centrado}>
            Disponible cuando haya ubicación.
          </AppText>
        ) : null}
        <AppText variant="meta" color={colors.textMuted} style={styles.centrado}>
          Este enlace deja de mostrar la ubicación 1 hora después de que termine la alerta.
        </AppText>
      </Reanimated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  negrita: { fontWeight: '600' },
  centrado: { textAlign: 'center' },
  volver: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 48, marginLeft: -space.xs },
  barra: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.md },
  marca: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
  },
  banner: {
    marginTop: space.md,
    padding: space.md,
    borderRadius: radius.row,
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    borderWidth: 1,
  },
  bannerPendiente: { backgroundColor: colors.warningSoft, borderColor: colors.warning },
  mapa: { marginTop: space.md },
  sinUbicacion: { height: 240, alignItems: 'center', justifyContent: 'center', gap: space.sm, borderColor: colors.warning },
  hoja: { marginTop: space.md, gap: space.xs },
  acciones: { marginTop: space.md, gap: space.sm },
});
