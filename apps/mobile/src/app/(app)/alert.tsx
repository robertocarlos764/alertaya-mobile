import { MaterialIcons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Share, StyleSheet, View } from 'react-native';
import Reanimated, { FadeIn } from 'react-native-reanimated';

import { HoldButton } from '@/components/HoldButton';
import {
  Avatar,
  AppText,
  Button,
  Card,
  DeliveryStatus,
  entrada,
  etiquetaEstado,
  Header,
  PuntoActivo,
  Screen,
  toast,
} from '@/components/ui';
import { ago, formatElapsed, formatPhone, headline, mapsUrl, type DeliveryState } from '@/demo/logic';
import { useAlerts } from '@/data';
import { useLocation } from '@/lib/useLocation';
import { colors, space } from '@/theme';

const DOS_MIN = 2 * 60 * 1000;

export default function Alerta() {
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });
  const { current: activeAlert, reportLocation: setAlertLocation, finish: finishAlert } = useAlerts();
  const { fix } = useLocation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Cada fix real nuevo actualiza la ubicación de la alerta (nunca una coordenada inventada).
  useEffect(() => {
    if (fix) setAlertLocation(fix);
  }, [fix, setAlertLocation]);

  if (!activeAlert) return null; // transición: la guardia ya la está quitando

  const elapsed = now - activeAlert.creadoEn;
  const filas = activeAlert.contactos.map((c, i) => ({ ...c, id: c.contactId ?? String(i), estado: c.estado as DeliveryState }));
  const titular = headline(filas.map((f) => f.estado));
  const location = activeAlert.ultimaUbicacion;
  const vieja = location ? now - location.capturadaEn > DOS_MIN : false;

  const compartir = () => {
    if (!location) return;
    const precision = location.precisionMetros == null ? '' : ` (±${location.precisionMetros} m)`;
    const enlace = mapsUrl(location.lat, location.lon);
    Share.share({ message: `Esta es mi ubicación${precision}: ${enlace}` }).catch(() => {
      // Navegador sin navigator.share: se abre el enlace de Google Maps.
      Linking.openURL(enlace);
      toast('Tu navegador no permite compartir; abrimos el enlace de Google Maps.');
    });
  };

  return (
    <Screen scroll edges={['bottom']}>
      <Reanimated.View entering={entrada(0)}>
        <Header
          right={
            <View style={styles.activa}>
              <View style={styles.capsula}>
                <PuntoActivo />
                <AppText variant="label" color={colors.accent}>
                  ACTIVA
                </AppText>
              </View>
              <AppText
                accessibilityLabel={`Tiempo transcurrido ${formatElapsed(elapsed)}`}
                style={styles.reloj}
              >
                {formatElapsed(elapsed)}
              </AppText>
            </View>
          }
        />
      </Reanimated.View>

      <Reanimated.View entering={entrada(1)}>
        <AppText variant="heading" color={titular.fallo ? colors.accent : colors.text}>
          {titular.titulo}
        </AppText>
        {/* key = texto: cada cambio de titular se anima. */}
        <Reanimated.View key={titular.subtitulo} entering={FadeIn}>
          <AppText color={colors.textMuted} style={styles.subtitulo}>
            {titular.subtitulo}
          </AppText>
        </Reanimated.View>
      </Reanimated.View>

      <Reanimated.View entering={entrada(2)}>
        <AppText variant="label" color={colors.textMuted} style={styles.seccion}>
          UBICACIÓN QUE VEN TUS CONTACTOS
        </AppText>
        {location ? (
          <Card style={styles.ubicacion}>
            <MaterialIcons name="place" size={32} color={colors.accent} />
            <AppText color={vieja ? colors.warning : colors.text} style={styles.flex}>
              {location.precisionMetros == null ? '' : `±${location.precisionMetros} m · `}
              {ago(now - location.capturadaEn)}
            </AppText>
          </Card>
        ) : (
          <Card style={styles.pendiente}>
            <MaterialIcons name="location-off" size={32} color={colors.warning} />
            <AppText style={styles.centrado}>
              Ubicación pendiente. Esperando señal GPS; tus contactos ven este mismo aviso.
            </AppText>
          </Card>
        )}
      </Reanimated.View>

      <AppText variant="label" color={colors.textMuted} style={styles.seccion}>
        CONTACTOS
      </AppText>
      {filas.map((c, i) => (
        <Reanimated.View key={c.id} entering={entrada(3 + i)} style={styles.contacto}>
          <Card>
            <View
              accessible
              accessibilityLabel={`${c.nombre}, ${etiquetaEstado(c.estado)}`}
              style={styles.contactoFila}
            >
              <Avatar nombre={c.nombre} size={40} />
              <View style={styles.flex}>
                <AppText numberOfLines={2} style={styles.nombre}>
                  {c.nombre}
                </AppText>
                <AppText variant="meta" color={colors.textMuted}>
                  {formatPhone(c.telefono)}
                </AppText>
              </View>
              <DeliveryStatus state={c.estado} />
            </View>
            {c.estado === 'fallido' ? (
              <View style={styles.llamar}>
                <Button
                  title={`Llamar a ${c.nombre}`}
                  variant="outline"
                  icon="phone"
                  onPress={() => Linking.openURL('tel:' + c.telefono)}
                />
              </View>
            ) : null}
          </Card>
        </Reanimated.View>
      ))}

      <Reanimated.View entering={entrada(4 + filas.length)}>
        <View style={styles.bloque}>
          <Button title="Ver lo que ven tus contactos" variant="cool" icon="visibility" onPress={() => router.push('/tracking')} />
        </View>

        <View style={styles.bloque}>
          <Button title="Compartir ubicación" variant="outline" icon="share" disabled={!location} onPress={compartir} />
        </View>

        <View style={styles.bloque}>
          <HoldButton
            variant="fill"
            durationMs={3000}
            onComplete={() => {
              finishAlert();
              toast('Demo: alerta finalizada. Estamos avisando a tus contactos que estás a salvo.');
            }}
            accessibilityLabel="Estoy a salvo"
            accessibilityHint="Mantén presionado tres segundos para finalizar la alerta"
            actionLabel="Finalizar alerta"
          />
          <AppText variant="meta" color={colors.textMuted} style={styles.ayuda}>
            Mantén presionado 3 segundos
          </AppText>
        </View>

        <Button title="Llamar al 123" variant="ghost" icon="phone" onPress={() => Linking.openURL('tel:123')} />
      </Reanimated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  activa: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  capsula: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
  },
  reloj: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
  subtitulo: { marginTop: space.xs },
  seccion: { marginTop: space.lg, marginBottom: space.sm },
  ubicacion: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  pendiente: {
    height: 192,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderColor: colors.warning,
  },
  centrado: { textAlign: 'center' },
  contacto: { marginBottom: space.sm },
  contactoFila: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  nombre: { fontWeight: '600' },
  llamar: { marginTop: space.sm },
  bloque: { marginTop: space.md },
  ayuda: { textAlign: 'center', marginTop: space.sm },
});
