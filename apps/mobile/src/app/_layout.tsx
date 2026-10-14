import { MaterialIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DemoBanner, SnackbarHost } from '@/components/ui';
import { DemoProvider, useDemo } from '@/demo/store';
import { colors } from '@/theme';

function Raiz() {
  const { hydrated, session } = useDemo();

  // Splash mientras se lee el almacenamiento: evita el parpadeo de login (AUTH-02).
  if (!hydrated) {
    return (
      <View style={styles.splash}>
        <MaterialIcons name="shield" size={48} color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <DemoBanner />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
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
      <DemoProvider>
        {/* En web la app se ve como una columna de teléfono centrada. */}
        <View style={styles.outer}>
          <View style={styles.phone}>
            <Raiz />
          </View>
        </View>
      </DemoProvider>
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
