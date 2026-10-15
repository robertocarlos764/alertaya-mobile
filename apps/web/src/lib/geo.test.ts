import { describe, expect, it } from "vitest";
import { googleMapsUrl, precisionCircle } from "./geo";

/** Haversine, independiente de la aproximacion del codigo. */
function distanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 2 * 6371008.8 * Math.asin(Math.sqrt(a));
}

describe("precisionCircle", () => {
  it("devuelve un anillo cerrado de 49 puntos a 50 m ± 1 m", () => {
    const ring = precisionCircle(4.65, -74.06, 50);
    expect(ring).toHaveLength(49);
    expect(ring[48]).toEqual(ring[0]);
    for (const [lon, lat] of ring) {
      expect(Math.abs(distanceM(4.65, -74.06, lat, lon) - 50)).toBeLessThanOrEqual(1);
    }
  });
});

describe("googleMapsUrl", () => {
  it("arma la URL de busqueda de Google Maps", () => {
    expect(googleMapsUrl(4.6, -74.1)).toBe("https://www.google.com/maps/search/?api=1&query=4.6,-74.1");
  });
});
