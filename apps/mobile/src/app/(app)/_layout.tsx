import { Stack } from 'expo-router';

import { useDemo } from '@/demo/store';

export default function AppLayout() {
  const { activeAlert } = useDemo();

  // D-12: con alerta activa la única pantalla posible es /alert (al abrir, al reabrir y al terminar la
  // cuenta regresiva). Se declaran TODAS las pantallas: las no declaradas se agregan sin guardia.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!activeAlert}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="contacts/new" />
        <Stack.Screen name="contacts/[id]" />
        <Stack.Screen
          name="countdown"
          options={{ presentation: 'fullScreenModal', gestureEnabled: false, animation: 'fade' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!!activeAlert}>
        <Stack.Screen name="alert" />
      </Stack.Protected>
    </Stack>
  );
}
