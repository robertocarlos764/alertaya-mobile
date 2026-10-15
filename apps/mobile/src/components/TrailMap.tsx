// Recorrido en SVG (sin librería de mapas): proyección simple de los puntos reales de ubicación.
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Card } from '@/components/ui';
import { trailPath } from '@/demo/logic';
import { colors } from '@/theme';

const W = 300;
const H = 200;

export function TrailMap({ trail }: { trail: { lat: number; lon: number }[] }) {
  const { d, xy } = trailPath(trail, W, H, 24);
  if (xy.length === 0) return null; // sin puntos no hay mapa: nunca uno por defecto
  const ultimo = xy[xy.length - 1];
  return (
    <Card style={styles.card}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id="trazo" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={W} y2="0">
            <Stop offset="0" stopColor={colors.violet} />
            <Stop offset="1" stopColor={colors.accent} />
          </LinearGradient>
        </Defs>
        {xy.length > 1 ? (
          <Path d={d} stroke="url(#trazo)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        ) : null}
        {xy.length > 1 ? <Circle cx={xy[0].x} cy={xy[0].y} r={4} fill={colors.text} /> : null}
        <Circle cx={ultimo.x} cy={ultimo.y} r={14} fill={colors.accentSoft} />
        <Circle cx={ultimo.x} cy={ultimo.y} r={7} fill={colors.accent} />
      </Svg>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0 },
});
