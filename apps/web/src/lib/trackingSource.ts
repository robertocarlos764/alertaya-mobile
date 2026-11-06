// Unico punto de acceso a los datos de la pagina publica.
// Con NEXT_PUBLIC_API_URL consulta GET {API}/api/public/tracking/{token} (contrato de 01-09).
// Sin ella usa fixtures locales (tokens demo-*); nunca se mezclan las dos fuentes.
import type { TrackingViewResponse } from "./api-types";
import type { FetchResult } from "./trackingState";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

export const usingFixtures = !API_URL;

export async function fetchTracking(token: string): Promise<FetchResult> {
  if (!API_URL) {
    const { fixtureResult } = await import("./fixtures");
    return fixtureResult(token, Date.now());
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/public/tracking/${encodeURIComponent(token)}`, {
      cache: "no-store",
      referrerPolicy: "no-referrer",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { kind: "networkError" };
  }

  if (res.status === 404 || res.status === 410) return { kind: "notFound" };
  if (!res.ok) return { kind: "serverError" };
  try {
    const data = (await res.json()) as TrackingViewResponse;
    if (typeof data?.personName !== "string" || !Array.isArray(data.trail)) return { kind: "serverError" };
    return { kind: "ok", data };
  } catch {
    return { kind: "serverError" };
  }
}
