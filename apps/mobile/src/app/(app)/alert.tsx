import { MaterialIcons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useState } from 'react';
import { Animated, Linking, Share, StyleSheet, ToastAndroid, View } from 'react-native';

import { HoldButton } from '@/components/HoldButton';
import { Avatar, AppText, Button, DeliveryStatus, etiquetaEstado, Header, Screen } from '@/components/ui';
import { ago, formatElapsed, formatPhone, headline, simulatedStatus } from '@/demo/logic';
import { useDemo } from '@/demo/store';
import { useLocation } from '@/lib/useLocation';
import { colors, radius, space } from '@/theme';

const DOS_MIN = 2 * 60 * 1000;

function PuntoActivo() {
  const [opacidad] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidad, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(opacidad, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacidad]);
  return <Animated.View style={[styles.punto, { opacity: opacidad }]} />;
}

export default function Alerta() {
  useKeepAwake();
  const { activeAlert, contacts, setAlertLocation, finishAlert } = useDemo();
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

  const elapsed = now - activeAlert.createdAt;
  const destinatarios = activeAlert.contactIds
    .map((id) => contacts.find((c) => c.id === id))
    .filter((c) => c !== undefined);
  const filas = destinatarios.map((c, i) => ({ c, estado: simulatedStatus(i, c.telefono, elapsed) }));
  const titular = headline(filas.map((f) => f.estado));
  const location = activeAlert.location;
  const vieja = location ? now - location.at > DOS_MIN : false;

  const compartir = () => {
    if (!location) return;
    const precision = location.accuracy == null ? '' : ` (±${location.accuracy} m)`;
    Share.share({
      message: `Esta es mi ubicación${precision}: https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lon}`,
    });
  };

  return (
    <Screen scroll edges={['bottom']}>
      <Header
        right={
          <View style={styles.activa}>
            <PuntoActivo />
            <AppText variant="label" color={colors.accent}>
              ACTIVA
            </AppText>
            <AppText
              accessibilityLabel={`Tiempo transcurrido ${formatElapsed(elapsed)}`}
              style={styles.reloj}
            >
              {formatElapsed(elapsed)}
            </AppText>
          </View>
        }
      />

      <AppText variant="heading" color={titular.fallo ? colors.accent : colors.text}>
        {titular.titulo}
      </AppText>
      <AppText color={colors.textMuted} style={styles.subtitulo}>
        {titular.subtitulo}
      </AppText>

      <AppText variant="label" color={colors.textMuted} style={styles.seccion}>
        UBICACIÓN QUE VEN TUS CONTACTOS
      </AppText>
      {location ? (
        <View style={styles.card}>
          <MaterialIcons name="place" size={32} color={colors.accent} />
          <AppText color={vieja ? colors.warning : colors.text} style={styles.flex}>
            {location.accuracy == null ? '' : `±${location.accuracy} m · `}
            {ago(now - location.at)}
          </AppText>
        </View>
      ) : (
        <View style={styles.pendiente}>
          <MaterialIcons name="location-off" size={32} color={colors.warning} />
          <AppText style={styles.centrado}>
            Ubicación pendiente. Esperando señal GPS; tus contactos ven este mismo aviso.
          </AppText>
        </View>
      )}

      <AppText variant="label" color={colors.textMuted} style={styles.seccion}>
        CONTACTOS
      </AppText>
      {filas.map(({ c, estado }) => (
        <View key={c.id} style={styles.contacto}>
          <View
            accessible
            accessibilityLabel={`${c.nombre}, ${etiquetaEstado(estado)}`}
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
            <DeliveryStatus state={estado} />
          </View>
          {estado === 'fallido' ? (
            <View style={styles.llamar}>
              <Button
                title={`Llamar a ${c.nombre}`}
                variant="outline"
                icon="phone"
                onPress={() => Linking.openURL('tel:' + c.telefono)}
              />
            </View>
          ) : null}
        </View>
      ))}

      <View style={styles.bloque}>
        <Button title="Compartir ubicación" variant="outline" icon="share" disabled={!location} onPress={compartir} />
      </View>

      <View style={styles.bloque}>
        <HoldButton
          variant="fill"
          durationMs={3000}
          onComplete={() => {
            finishAlert();
            ToastAndroid.show(
              'Demo: alerta finalizada. Estamos avisando a tus contactos que estás a salvo.',
              ToastAndroid.LONG,
            );
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  activa: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  reloj: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
  subtitulo: { marginTop: space.xs },
  seccion: { marginTop: space.lg, marginBottom: space.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
  },
  pendiente: {
    height: 192,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.md,
  },
  centrado: { textAlign: 'center' },
  contacto: {
    marginBottom: space.sm,
    padding: space.md,
    minHeight: 72,
    borderRadius: radius.row,
    backgroundColor: colors.surface,
  },
  contactoFila: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  nombre: { fontWeight: '600' },
  llamar: { marginTop: space.sm },
  bloque: { marginTop: space.md },
  ayuda: { textAlign: 'center', marginTop: space.sm },
});
