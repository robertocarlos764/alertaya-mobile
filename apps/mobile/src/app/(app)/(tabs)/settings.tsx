import { Alert, Platform, StyleSheet, Switch, View } from 'react-native';
import Reanimated from 'react-native-reanimated';

import { AppText, Button, Card, Chip, entrada, Header, Screen, toast } from '@/components/ui';
import { COUNTDOWN_OPTIONS } from '@/demo/logic';
import { useDemo } from '@/demo/store';
import { colors, space } from '@/theme';

export default function Ajustes() {
  const { session, settings, updateSettings, logout, resetDemo } = useDemo();

  const reiniciar = () => {
    resetDemo();
    toast('Demo reiniciado. Todo quedó como nuevo.');
  };

  const confirmarReinicio = () => {
    const mensaje =
      'Se borrarán la cuenta, los contactos, el historial y los ajustes de este demo, y volverás a la bienvenida.';
    // Alert.alert de react-native-web no hace nada: en web se usa el confirm del navegador.
    if (Platform.OS === 'web') {
      if (window.confirm(`¿Reiniciar el demo? ${mensaje}`)) reiniciar();
      return;
    }
    Alert.alert('Reiniciar demo', mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Reiniciar', style: 'destructive', onPress: reiniciar },
    ]);
  };

  return (
    <Screen scroll edges={[]}>
      <Reanimated.View entering={entrada(0)}>
        <Header />
        <AppText variant="heading">Ajustes</AppText>
      </Reanimated.View>

      <Reanimated.View entering={entrada(1)}>
        <AppText variant="label" color={colors.textMuted} style={styles.seccion}>
          ALERTA
        </AppText>
        <Card style={styles.bloque}>
          <AppText style={styles.negrita}>Ventana de confirmación</AppText>
          <View style={styles.chips}>
            {COUNTDOWN_OPTIONS.map((n) => (
              <Chip
                key={n}
                label={`${n} s`}
                selected={settings.countdownSeconds === n}
                onPress={() => updateSettings({ countdownSeconds: n })}
              />
            ))}
          </View>
          <AppText variant="meta" color={colors.textMuted}>
            Tiempo para cancelar antes de enviar la alerta.
          </AppText>
        </Card>

        <Card style={[styles.bloque, styles.espacio]}>
          <View style={styles.fila}>
            <AppText style={[styles.negrita, styles.flex]}>Modo silencioso</AppText>
            <Switch
              accessibilityLabel="Modo silencioso"
              value={settings.silencioso}
              onValueChange={(v) => updateSettings({ silencioso: v })}
              trackColor={{ false: colors.border, true: colors.violet }}
              thumbColor={colors.text}
            />
          </View>
          <AppText variant="meta" color={colors.textMuted}>
            La cuenta regresiva no vibra y se muestra en una pantalla oscura y discreta.
          </AppText>
        </Card>
      </Reanimated.View>

      <Reanimated.View entering={entrada(2)}>
        <AppText variant="label" color={colors.textMuted} style={styles.seccion}>
          CUENTA
        </AppText>
        <Card style={styles.bloque}>
          <AppText style={styles.negrita}>{session?.nombre}</AppText>
          <AppText variant="meta" color={colors.textMuted}>
            {session?.correo}
          </AppText>
        </Card>
        <View style={styles.espacio}>
          <Button title="Cerrar sesión" variant="outline" icon="logout" onPress={logout} />
        </View>
      </Reanimated.View>

      <Reanimated.View entering={entrada(3)}>
        <AppText variant="label" color={colors.textMuted} style={styles.seccion}>
          DEMO
        </AppText>
        <Button title="Reiniciar demo" variant="danger" icon="restart-alt" onPress={confirmarReinicio} />
        <AppText variant="meta" color={colors.textMuted} style={styles.ayuda}>
          Borra todo y vuelve a empezar desde la bienvenida.
        </AppText>
      </Reanimated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  seccion: { marginTop: space.lg, marginBottom: space.sm },
  bloque: { gap: space.sm },
  espacio: { marginTop: space.sm },
  negrita: { fontWeight: '600' },
  chips: { flexDirection: 'row', gap: space.sm },
  fila: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  ayuda: { textAlign: 'center', marginTop: space.sm },
});
