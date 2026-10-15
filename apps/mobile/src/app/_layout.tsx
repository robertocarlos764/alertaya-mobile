import { MaterialIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DemoBanner, SnackbarHost } from '@/components/ui';
import { DataProvider, IS_DEMO, useAlerts, useAuth, useLocalExtras } from '@/data';
import { initialScreen } from '@/data/logic';
import { colors } from '@/theme';

function Raiz() {
  const auth = useAuth();
  const { current } = useAlerts();
  const { onboarded } = useLocalExtras();
  const pantalla = initialScreen({ auth: auth.status, onboarded, alert: current?.estado ?? null });
  const dentro = pantalla === 'home' || pantalla === 'alert';

  // Splash mientras se resuelve la sesión guardada: evita el parpadeo de login (AUTH-02).
  if (pantalla === 'splash') {
    return (
      <View style={styles.splash}>
        <MaterialIcons name="shield" size={48} color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {IS_DEMO ? <DemoBanner /> : null}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={dentro}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!dentro}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
      {/* Una sola vez en la raíz: el toast sobrevive a que la pantalla que lo pidió se desmonte. */}
      <SnackbarHost />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DataProvider>
        {/* En web la app se ve como una columna de teléfono centrada. */}
        <View style={styles.outer}>
          <View style={styles.phone}>
            <Raiz />
          </View>
        </View>
      </DataProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: colors.bg },
  phone: {
    flex: 1,
    ...(Platform.OS === 'web' ? { width: '100%', maxWidth: 480, alignSelf: 'center' } : null),
  },
  root: { flex: 1, backgroundColor: colors.bg },
  splash: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
