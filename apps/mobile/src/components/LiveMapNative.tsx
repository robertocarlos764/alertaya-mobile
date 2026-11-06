// Mapa nativo con @maplibre/maplibre-react-native (solo development build). Nunca se importa directo: LiveMap.tsx
// lo carga con un require protegido para que Expo Go (sin el módulo nativo) use el mapa SVG sin crashear.
import { Camera, GeoJSONSource, Layer, Map, Marker } from '@maplibre/maplibre-react-native';
import { StyleSheet, View } from 'react-native';

import { Pulse } from '@/components/Pulse';
import { colors } from '@/theme';

import { MAP_STYLE_URL, mapFeatures, mapFraming, type LiveMapProps } from './mapTypes';

const PADDING = { top: 40, right: 40, bottom: 64, left: 40 }; // abajo deja sitio a la atribución

export function LiveMapNative({ point, trail = [], live = false, interactive = false }: LiveMapProps) {
  const f = mapFeatures({ point, trail });
  const encuadre = mapFraming({ point, trail, live });
  const inicio = trail.length > 1 ? trail[0] : null;
  return (
    <Map
      style={StyleSheet.absoluteFill}
      mapStyle={MAP_STYLE_URL}
      dragPan={interactive}
      touchZoom={interactive}
      doubleTapZoom={interactive}
      doubleTapHoldZoom={interactive}
      touchRotate={false}
      touchPitch={false}
      compass={false}
      logo={false}
      attribution
    >
      {/* Cámara controlada: solo cambia cuando llega un punto real nuevo (en vivo la sigue). */}
      {encuadre.kind === 'bounds' ? (
        <Camera bounds={encuadre.bounds} padding={PADDING} duration={600} easing="ease" />
      ) : (
        <Camera center={encuadre.center} zoom={encuadre.zoom} duration={600} easing="ease" />
      )}
      <GeoJSONSource id="precision" data={f.precision}>
        <Layer id="precision-fill" type="fill" paint={{ 'fill-color': colors.accent, 'fill-opacity': 0.15 }} />
        <Layer
          id="precision-line"
          type="line"
          paint={{ 'line-color': colors.accent, 'line-opacity': 0.4, 'line-width': 1.5 }}
        />
      </GeoJSONSource>
      <GeoJSONSource id="trail" data={f.trail}>
        <Layer
          id="trail-line"
          type="line"
          layout={{ 'line-join': 'round', 'line-cap': 'round' }}
          paint={{ 'line-color': colors.accent, 'line-opacity': 0.6, 'line-width': 4 }}
        />
      </GeoJSONSource>
      {inicio ? (
        <Marker id="inicio" lngLat={[inicio.lon, inicio.lat]} anchor="center">
          <View style={styles.inicio} />
        </Marker>
      ) : null}
      <Marker id="punto" lngLat={[point.lon, point.lat]} anchor="center">
        <Pulse live={live} />
      </Marker>
    </Map>
  );
}

const styles = StyleSheet.create({
  inicio: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.text,
    borderWidth: 2,
    borderColor: colors.bg,
  },
});
