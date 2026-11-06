"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { LngLatBounds, Map as MapLibre, Marker, setWorkerUrl, type GeoJSONSource } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import type { TrailPoint } from "@/lib/api-types";
import { precisionCircle } from "@/lib/geo";
import type { ViewModel } from "@/lib/trackingState";

// maplibre-gl 6 deduce la URL de su worker desde import.meta.url, que el bundler cambia; se la damos explicita.
setWorkerUrl(new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).href);

// OpenFreeMap dark (01-UI-SPEC / 01-10): vectorial, gratuito y sin API key. La atribucion la trae la fuente del estilo.
const STYLE_URL = "https://tiles.openfreemap.org/styles/dark";
const RED = "#E8212B";

type Location = NonNullable<ViewModel["location"]>;
type Props = { name: string; location: Location; trail: TrailPoint[] };

function collections({ location, trail }: Omit<Props, "name">) {
  const line = trail.map((p) => [p.lon, p.lat]);
  const first = trail[0] ?? location;
  return {
    trail: {
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates: line },
    },
    precision: {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "Polygon" as const,
        coordinates: location.accuracyM ? [precisionCircle(location.lat, location.lon, location.accuracyM)] : [],
      },
    },
    start: {
      type: "Feature" as const,
      properties: {},
      geometry: { type: "Point" as const, coordinates: [first.lon, first.lat] },
    },
  };
}

function setData(map: MapLibre, data: Omit<Props, "name">) {
  for (const [id, feature] of Object.entries(collections(data))) {
    (map.getSource(id) as GeoJSONSource | undefined)?.setData(feature);
  }
}

export default function TrackingMap({ name, location, trail }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibre | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const latest = useRef({ location, trail });
  const followRef = useRef(true);
  const [following, setFollowing] = useState(true);

  // Crea el mapa una sola vez.
  useEffect(() => {
    const { location: loc, trail: tr } = latest.current;
    const bounds = new LngLatBounds([loc.lon, loc.lat], [loc.lon, loc.lat]);
    for (const p of tr) bounds.extend([p.lon, p.lat]);

    const map = new MapLibre({
      container: containerRef.current!,
      style: STYLE_URL,
      bounds,
      fitBoundsOptions: { padding: 48, maxZoom: 16 },
      attributionControl: { compact: false },
    });
    mapRef.current = map;

    const pin = document.createElement("div");
    pin.className = loc.live ? "pin pin-live" : "pin";
    markerRef.current = new Marker({ element: pin }).setLngLat([loc.lon, loc.lat]).addTo(map);

    map.on("load", () => {
      const data = collections(latest.current);
      for (const [id, feature] of Object.entries(data)) map.addSource(id, { type: "geojson", data: feature });
      map.addLayer({ id: "precision-fill", type: "fill", source: "precision", paint: { "fill-color": RED, "fill-opacity": 0.15 } });
      map.addLayer({
        id: "precision-line",
        type: "line",
        source: "precision",
        paint: { "line-color": RED, "line-opacity": 0.4, "line-width": 1.5 },
      });
      map.addLayer({
        id: "trail",
        type: "line",
        source: "trail",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": RED, "line-opacity": 0.6, "line-width": 4 },
      });
      map.addLayer({ id: "start", type: "circle", source: "start", paint: { "circle-radius": 4, "circle-color": "#FFFFFF" } });
    });

    // Si la persona mueve el mapa deja de seguir el ultimo punto y aparece "Centrar".
    const stopFollowing = (e: { originalEvent?: unknown }) => {
      if (!e.originalEvent) return;
      followRef.current = false;
      setFollowing(false);
    };
    map.on("dragstart", stopFollowing);
    map.on("zoomstart", stopFollowing);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Cada dato nuevo: mueve pin, capas y, si sigue, la camara.
  useEffect(() => {
    latest.current = { location, trail };
    const map = mapRef.current;
    if (!map) return;
    markerRef.current?.setLngLat([location.lon, location.lat]);
    markerRef.current?.getElement().classList.toggle("pin-live", location.live);
    setData(map, { location, trail });
    if (followRef.current) map.easeTo({ center: [location.lon, location.lat] });
  }, [location, trail]);

  const recenter = () => {
    followRef.current = true;
    setFollowing(true);
    const { location: loc } = latest.current;
    mapRef.current?.easeTo({ center: [loc.lon, loc.lat], zoom: Math.max(mapRef.current.getZoom(), 15) });
  };

  return (
    <>
      <div ref={containerRef} className="map-canvas" role="region" aria-label={`Mapa con la ubicación de ${name}`} />
      {!following && (
        <button type="button" className="center-btn" onClick={recenter}>
          Centrar
        </button>
      )}
    </>
  );
}
