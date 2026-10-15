// Respaldo sin módulo nativo de mapas (Expo Go): proyección simple de los puntos reales, sin calles.
// Mismo contrato que LiveMap; el pulso y el círculo de precisión se dibujan igual.
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Pulse, PULSE_BOX } from '@/components/Pulse';
import { AppText } from '@/components/ui';
import { trailPath } from '@/demo/logic';
import { colors, space } from '@/theme';

import type { LiveMapProps } from './mapTypes';

export function TrailMap({ point, trail = [], live = false, height }: LiveMapProps) {
  const [w, setW] = useState(0);
  const puntos = trail.length > 1 ? trail : [point];
  const { d, xy } = trailPath(puntos, w, height, 32);
  const fin = xy.length ? (trail.length > 1 ? xy[xy.length - 1] : xy[0]) : null;
  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && fin ? (
        <>
          <Svg width={w} height={height}>
            {xy.length > 1 ? (
              <Path d={d} stroke={colors.accent} strokeOpacity={0.6} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            ) : null}
            {xy.length > 1 ? <Circle cx={xy[0].x} cy={xy[0].y} r={5} fill={colors.text} /> : null}
          </Svg>
          <View style={[styles.pin, { left: fin.x - PULSE_BOX / 2, top: fin.y - PULSE_BOX / 2 }]}>
            <Pulse live={live} />
          </View>
        </>
      ) : null}
      <AppText variant="meta" color={colors.textMuted} style={styles.nota}>
        Mapa simplificado (sin calles en Expo Go)
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pin: { position: 'absolute' },
  nota: { position: 'absolute', left: space.sm, bottom: space.xs },
});
