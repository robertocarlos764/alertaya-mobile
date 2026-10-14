import { Stack } from 'expo-router';

import { useDemo } from '@/demo/store';

export default function AuthLayout() {
  const { onboarded } = useDemo();

  // La bienvenida solo se ve en el primer arranque; al terminar, la guardia cae sola en login.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>
    </Stack>
  );
}
