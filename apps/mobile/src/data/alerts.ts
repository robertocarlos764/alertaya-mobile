// Puerto de alertas. Formas y nombres de AlertStatusResponse (01-06) y de PendingAlert (01-13);
// 01-13/01-14/01-15 lo implementan con POST /api/alerts, GET /api/alerts/{id}/status, /active y /finish.

/** Valor crudo de notification_deliveries.estado. La UI lo traduce solo con toDeliveryView. */
export type DeliveryEstado =
  | 'en_cola'
  | 'enviando'
  | 'reintento'
  | 'enviado'
  | 'entregado'
  | 'fallido'
  | 'cancelado';

export type AlertEstado = 'activa' | 'finalizada';

/** Ubicación confirmada (UbicacionConfirmadaDto). capturadaEn = hora del fix en ms. */
export type ConfirmedLocation = {
  lat: number;
  lon: number;
  precisionMetros: number | null;
  capturadaEn: number;
};

/** EntregaContactoDto. */
export type Delivery = {
  contactId: string | null;
  nombre: string;
  telefono: string;
  estado: DeliveryEstado;
  intentos: number;
};

export type Alert = {
  /** Clave de idempotencia generada en el teléfono antes de cualquier red (SOS-03). */
  clientGeneratedId: string;
  /** null = guardada solo en el teléfono, el servidor aún no la confirma. */
  serverId: string | null;
  estado: AlertEstado;
  /** ms. Hora local hasta que el servidor confirme; luego la del servidor. */
  creadoEn: number;
  finalizadaEn: number | null;
  /** null hasta que el servidor devuelva el link (UI-SPEC: "Generando enlace…"). */
  trackingUrl: string | null;
  ultimaUbicacion: ConfirmedLocation | null;
  /** Recorrido desde el inicio (vista del contacto). */
  trail: ConfirmedLocation[];
  contactos: Delivery[];
};

export type GeoFix = { lat: number; lon: number; accuracy: number | null; at: number };

export interface AlertsRepository {
  /** Alerta activa, o finalizada hasta que la persona cierre la pantalla final. */
  current: Alert | null;
  /** false = sin red; null = no se sabe (sin NetInfo en Android, ver SUMMARY). */
  online: boolean | null;
  /** Guarda la alerta en el teléfono (antes de la red) y la pone en cola para sincronizar. */
  start(location: GeoFix | null): Promise<void>;
  /** Cada fix real nuevo del GPS (nunca uno inventado). */
  reportLocation(fix: GeoFix): void;
  /** Resuelve solo cuando el servidor confirma el fin (D-09); si no, rechaza y la alerta sigue activa. */
  finish(): Promise<void>;
  /** Cierra la pantalla final de una alerta finalizada. */
  dismiss(): void;
}
