import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
  Header,
  infoEstado,
  Logo,
  PuntoActivo,
  Screen,
  toast,
} from '@/components/ui';
import { IS_DEMO, useAlerts, type Alert } from '@/data';
import { alertHeadline } from '@/data/logic';
import { ago, formatElapsed, formatPhone, mapsUrl } from '@/demo/logic';
import { useLocation } from '@/lib/useLocation';
import { colors, gradients, space } from '@/theme';

const DOS_MIN = 2 * 60 * 1000;

export default function Alerta() {
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });
  const { current, online, reportLocation, finish, dismiss } = useAlerts();
  const { fix } = useLocation();
  const [now, setNow] = useState(() => Date.now());
  const [finalizando, setFinalizando] = useState(false);
  const activa = current?.estado === 'activa';

  // Cronómetro: se recalcula desde creadoEn en cada tick (sobrevive a cerrar y reabrir la app).
  useEffect(() => {
    if (!activa) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activa]);

  // Cada fix real nuevo actualiza la ubicación de la alerta (nunca una coordenada inventada).
  useEffect(() => {
    if (fix && activa) reportLocation(fix);
  }, [fix, activa, reportLocation]);

  // Háptico ligero solo cuando un contacto pasa a "Falló" (UI-SPEC).
  const fallidos = current?.contactos.filter((c) => c.estado === 'fallido').length ?? 0;
  const fallidosPrevios = useRef(fallidos);
  useEffect(() => {
    if (fallidos > fallidosPrevios.current) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fallidosPrevios.current = fallidos;
  }, [fallidos]);

  if (!current) return null; // transición: la guardia ya la está quitando
  if (current.estado === 'finalizada') return <Finalizada alerta={current} onClose={dismiss} />;

  const sincronizada = current.serverId != null;
  const elapsed = now - current.creadoEn;
  const titular = alertHeadline({ synced: sincronizada, estados: current.contactos.map((c) => c.estado) });
  const location = current.ultimaUbicacion;
  const vieja = location ? now - location.capturadaEn > DOS_MIN : false;

  const compartir = () => {
    const url = current.trackingUrl;
    const mensaje = url
      ? `Sigue mi ubicación en vivo: ${url}`
      : location
        ? // Demo sin página pública: un enlace fijo a la ubicación real, sin prometer seguimiento en vivo.
          `Esta es mi ubicación${location.precisionMetros == null ? '' : ` (±${location.precisionMetros} m)`}: ${mapsUrl(location.lat, location.lon)}`
        : null;
    if (!mensaje) return;
    Share.share({ message: mensaje }).catch(() => {
      // Navegador sin navigator.share.
      toast('Tu navegador no permite compartir desde aquí.');
    });
  };
  const compartirTitulo = current.trackingUrl
    ? 'Compartir enlace'
    : !sincronizada
      ? 'Generando enlace…'
      : 'Compartir ubicación';
  const compartirListo = !!current.trackingUrl || (sincronizada && !!location);

  const alCompletarHold = () => {
    setFinalizando(true);
    // Solo el servidor da la alerta por terminada (D-09): si falla, sigue activa.
    finish()
      .catch((e: Error) => toast(e.message))
      .finally(() => setFinalizando(false));
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
              <AppText accessibilityLabel={`Tiempo transcurrido ${formatElapsed(elapsed)}`} style={styles.reloj}>
                {formatElapsed(elapsed)}
              </AppText>
            </View>
          }
        />
      </Reanimated.View>

      {online === false ? (
        <Reanimated.View entering={FadeIn} accessibilityLiveRegion="polite" style={styles.sinRed}>
          <MaterialIcons name="cloud-off" size={20} color={colors.warning} />
          <AppText style={styles.flex}>Sin conexión. Tu alerta está guardada y se enviará en cuanto vuelva la red.</AppText>
        </Reanimated.View>
      ) : null}

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
      {current.contactos.map((c, i) => (
        <Reanimated.View key={c.contactId ?? c.telefono} entering={entrada(3 + i)} style={styles.contacto}>
          <Card>
            <View
              accessible
              accessibilityLabel={`${c.nombre}, ${infoEstado(c.estado, c.intentos, sincronizada).etiqueta}`}
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
              <DeliveryStatus estado={c.estado} intentos={c.intentos} sincronizada={sincronizada} />
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

      <Reanimated.View entering={entrada(4 + current.contactos.length)}>
        {IS_DEMO ? (
          <View style={styles.bloque}>
            <Button
              title="Ver lo que ven tus contactos"
              icon="visibility"
              onPress={() => router.push('/tracking')}
            />
          </View>
        ) : null}

        <View style={styles.bloque}>
          <Button
            title={compartirTitulo}
            variant="outline"
            icon="share"
            disabled={!compartirListo}
            onPress={compartir}
          />
        </View>

        <View style={styles.bloque}>
          {finalizando ? (
            <Button title="Finalizando…" variant="outline" loading onPress={() => {}} />
          ) : (
            <HoldButton
              variant="fill"
              durationMs={3000}
              onComplete={alCompletarHold}
              accessibilityLabel="Estoy a salvo"
              accessibilityHint="Mantén presionado tres segundos para finalizar la alerta"
              actionLabel="Finalizar alerta"
            />
          )}
          <AppText variant="meta" color={colors.textMuted} style={styles.ayuda}>
            {finalizando ? 'Finalizando…' : 'Mantén presionado 3 segundos'}
          </AppText>
        </View>

        <Button title="Llamar al 123" variant="ghost" icon="phone" onPress={() => Linking.openURL('tel:123')} />
      </Reanimated.View>
    </Screen>
  );
}

// Pantalla final (D-09): solo se llega cuando el servidor confirmó el fin.
function Finalizada({ alerta, onClose }: { alerta: Alert; onClose: () => void }) {
  const duracion = (alerta.finalizadaEn ?? alerta.creadoEn) - alerta.creadoEn;
  return (
    <Screen edges={['bottom']}>
      <View style={styles.final}>
        <Reanimated.View entering={entrada(0)}>
          <Logo icon="verified-user" fondo={gradients.success} />
        </Reanimated.View>
        <Reanimated.View entering={entrada(1)} style={styles.finalTexto}>
          <AppText variant="heading" color={colors.success} style={styles.centrado}>
            Alerta finalizada
          </AppText>
          <AppText style={styles.centrado}>Estamos avisando a tus contactos que estás a salvo.</AppText>
          <AppText variant="meta" color={colors.textMuted} style={styles.centrado}>
            Duración {formatElapsed(duracion)}
            {IS_DEMO ? ' · Modo demo: no se envía ningún SMS.' : ''}
          </AppText>
        </Reanimated.View>
      </View>
      <Reanimated.View entering={entrada(2)}>
        <Button title="Volver al inicio" onPress={onClose} />
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
  sinRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    marginBottom: space.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.surface,
  },
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
  final: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  finalTexto: { gap: space.sm, alignItems: 'center' },
});
