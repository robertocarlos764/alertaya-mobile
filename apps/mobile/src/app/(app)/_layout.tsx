import { Stack } from 'expo-router';

import { useAlerts } from '@/data';

export default function AppLayout() {
  const { current } = useAlerts();
  const conAlerta = !!current; // misma regla que initialScreen (D-12)

  // D-12: con alerta (activa, o finalizada hasta cerrar su pantalla final) la única pantalla posible es
  // /alert (al abrir, al reabrir y al terminar la cuenta regresiva). Se declaran TODAS las pantallas: las
  // no declaradas se agregan sin guardia.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!conAlerta}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="contacts/new" />
        <Stack.Screen name="contacts/[id]" />
        <Stack.Screen name="history/[id]" />
        <Stack.Screen name="location" />
        <Stack.Screen
          name="countdown"
          options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={conAlerta}>
        <Stack.Screen name="alert" />
      </Stack.Protected>
    </Stack>
  );
}
