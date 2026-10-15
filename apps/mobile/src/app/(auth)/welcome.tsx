import type { MaterialIcons } from '@expo/vector-icons';
import { useState, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import Reanimated, { FadeInRight, FadeOutLeft, LinearTransition } from 'react-native-reanimated';

import { AppText, Button, Logo, Screen } from '@/components/ui';
import { useLocalExtras } from '@/data';
import { colors, gradients, radius, space } from '@/theme';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

const PAGINAS: { icono: IconName; fondo: typeof gradients.sos | typeof gradients.cool; titulo: string; texto: string }[] = [
  {
    icono: 'touch-app',
    fondo: gradients.sos,
    titulo: 'Un toque largo, ayuda en camino',
    texto: 'Mantén presionado SOS 2 segundos. Tienes unos segundos para cancelar si fue sin querer.',
  },
  {
    icono: 'group',
    fondo: gradients.cool,
    titulo: 'Tus contactos de confianza',
    texto: 'Avisamos a las personas que elijas, con tu ubicación real.',
  },
  {
    icono: 'info-outline',
    fondo: gradients.cool,
    titulo: 'Esto es una demo',
    texto:
      'No se envían SMS reales y los estados de entrega son simulados. Tu ubicación sí es real, o aparece como pendiente.',
  },
];

export default function Bienvenida() {
  const { finishOnboarding } = useLocalExtras();
  const [i, setI] = useState(0);
  const ultima = i === PAGINAS.length - 1;
  const p = PAGINAS[i];

  return (
    <Screen edges={['bottom']}>
      <View style={styles.paginas}>
        {/* key = índice: cada pantalla entra por la derecha y sale por la izquierda. */}
        <Reanimated.View key={i} entering={FadeInRight} exiting={FadeOutLeft} style={styles.pagina}>
          <Logo size={120} icon={p.icono} fondo={p.fondo} />
          <AppText variant="heading" style={styles.centrado}>
            {p.titulo}
          </AppText>
          <AppText color={colors.textMuted} style={styles.centrado}>
            {p.texto}
          </AppText>
        </Reanimated.View>
      </View>

      <View style={styles.puntos}>
        {PAGINAS.map((_, n) => (
          <Reanimated.View
            key={n}
            layout={LinearTransition}
            style={[styles.punto, n === i && styles.puntoActivo]}
          />
        ))}
      </View>

      <View style={styles.acciones}>
        <Button
          title={ultima ? 'Comenzar' : 'Siguiente'}
          onPress={() => (ultima ? finishOnboarding() : setI(i + 1))}
        />
        <Button title="Saltar" variant="ghost" onPress={finishOnboarding} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  paginas: { flex: 1 },
  pagina: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: space.md },
  centrado: { textAlign: 'center' },
  puntos: { flexDirection: 'row', justifyContent: 'center', gap: space.sm, marginBottom: space.lg },
  punto: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.border },
  puntoActivo: { width: 24, backgroundColor: colors.accent },
  acciones: { gap: space.sm },
});
