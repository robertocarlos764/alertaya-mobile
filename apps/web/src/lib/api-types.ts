// Contrato de GET /api/public/tracking/{token} (01-09, TrackingDtos.cs; UI-SPEC "Dependencia con la API").
// Escrito a mano porque apps/api/openapi.json aun no existe. 01-10 lo reemplaza con openapi-typescript.

export type TrackingPoint = {
  lat: number;
  lon: number;
  accuracyM: number | null;
  recordedAt: string; // ISO 8601, hora real del fix
};

export type TrailPoint = {
  lat: number;
  lon: number;
  recordedAt: string;
};

export type TrackingViewResponse = {
  personName: string;
  personPhone: string | null; // null pasada 1 h de endedAt (D-07)
  status: "activa" | "finalizada";
  lastLocation: TrackingPoint | null; // null = ubicacion pendiente; nunca una coordenada sustituta
  trail: TrailPoint[];
  startedAt: string;
  endedAt: string | null;
  serverNow: string;
};
