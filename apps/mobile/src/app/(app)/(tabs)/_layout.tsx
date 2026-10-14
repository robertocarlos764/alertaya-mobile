import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect, type ComponentProps } from 'react';
import { StyleSheet, type ColorValue } from 'react-native';
import Reanimated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius } from '@/theme';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

// Cápsula que aparece con resorte detrás del icono activo; el icono sube 2 px.
function TabIcon({ name, color, size, focused }: { name: IconName; color: ColorValue; size: number; focused: boolean }) {
  const p = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    p.set(withSpring(focused ? 1 : 0));
  }, [focused, p]);
  const capsula = useAnimatedStyle(() => ({
    opacity: p.get(),
    transform: [{ scale: interpolate(p.get(), [0, 1], [0.6, 1]) }],
  }));
  const icono = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(p.get(), [0, 1], [0, -2]) }] }));
  return (
    <Reanimated.View style={styles.icono}>
      <Reanimated.View style={[styles.capsula, capsula]} />
      <Reanimated.View style={icono}>
        <MaterialIcons name={name} size={size} color={color} />
      </Reanimated.View>
    </Reanimated.View>
  );
}

const pestana = (title: string, name: IconName) => ({
  title,
  tabBarIcon: ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <TabIcon name={name} color={color} size={size} focused={focused} />
  ),
});

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: 64 + insets.bottom,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={pestana('Inicio', 'home')} />
      <Tabs.Screen name="history" options={pestana('Historial', 'history')} />
      <Tabs.Screen name="contacts" options={pestana('Contactos', 'group')} />
      <Tabs.Screen name="settings" options={pestana('Ajustes', 'settings')} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icono: { width: 56, height: 32, alignItems: 'center', justifyContent: 'center' },
  capsula: {
    position: 'absolute',
    width: 56,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
  },
});
