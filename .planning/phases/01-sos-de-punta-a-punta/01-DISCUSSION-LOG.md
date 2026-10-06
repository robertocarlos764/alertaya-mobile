# Phase 1: SOS de punta a punta - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-06
**Phase:** 01-sos-de-punta-a-punta
**Areas discussed:** Botón y cuenta regresiva, SMS y link de seguimiento, Alerta activa y su fin, Entorno de la demo

---

## Botón y cuenta regresiva

| Option | Description | Selected |
|--------|-------------|----------|
| Mantener 2 s | Anillo que se llena; evita toques accidentales | ✓ |
| Un toque | Más rápido; la cuenta regresiva es la única protección | |
| Deslizar | Tipo "desliza para apagar" | |

| Option | Description | Selected |
|--------|-------------|----------|
| 5 s | Estándar Google/Samsung | ✓ |
| 4 s | Valor actual en BD | |
| 3 s | Más rápido | |
| 10 s | Más margen | |

| Option | Description | Selected |
|--------|-------------|----------|
| Pantalla completa roja | Número gigante, glow, vibración por segundo, CANCELAR | ✓ |
| Anillo sobre el botón | El resto de la pantalla visible | |
| Pantalla completa + sonido | Igual con bip por segundo | |

| Option | Description | Selected |
|--------|-------------|----------|
| Pantalla alerta activa | Directo a estados por contacto | ✓ |
| Confirmación breve | "Alerta enviada" 1 s | |
| Tú decides | | |

**User's choice:** Mantener 2 s · 5 s · pantalla completa roja · directo a alerta activa.

---

## SMS y link de seguimiento

| Option | Description | Selected |
|--------|-------------|----------|
| Directo y urgente | "AlertaYA: Ana Gomez activo una alerta..." | ✓ |
| Informativo | "[AlertaYA] Ana Gomez te tiene como contacto..." | |
| Tú decides | | |

Contenido de la página (multi): Mapa en vivo ✓, Nombre + estado ✓, Botones de acción ✓, Trayecto ✓.

| Option | Description | Selected |
|--------|-------------|----------|
| Al finalizar + 1 h | Luego "finalizada" sin ubicación | ✓ |
| Al finalizar | | |
| 24 h fijas | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Uno gratis temporal | Subdominio Vercel/Render | ✓ |
| Tenemos dominio | | |
| Comprar uno | | |

---

## Alerta activa y su fin

| Option | Description | Selected |
|--------|-------------|----------|
| "Estoy a salvo" | Mantener 3 s, SMS de a salvo; PIN en fase 5 | ✓ |
| Sin cierre desde la app | | |
| Expira sola | | |

Pantalla (multi): Estado por contacto ✓, Mi ubicación ✓, Tiempo activo ✓, Compartir link ✓.

| Option | Description | Selected |
|--------|-------------|----------|
| Reintenta + avisa | 2 reintentos, luego "Falló" con opción de llamar | ✓ |
| Solo marca fallido | | |
| Tú decides | | |

| Option | Description | Selected |
|--------|-------------|----------|
| Sigue activa | Al reabrir va a alerta activa | ✓ |
| Tú decides | | |

---

## Entorno de la demo

| Option | Description | Selected |
|--------|-------------|----------|
| No, crearla (Twilio) | | |
| Sí, de prueba | | |
| Sí, de pago | | |
| Otra opción de SMS | | ✓ |

Seguimiento proveedor: opciones Hablame.co / Infobip / AWS SNS / Investiga y recomienda.
**User's choice (free text):** "alguno que sea gratis con pequeñas pruebas" → Twilio trial propuesto y aprobado.

| Option | Description | Selected |
|--------|-------------|----------|
| Render/Railway | ~5–7 USD/mes | |
| Azure App Service | | ✓ (inicial) |
| Mi PC + túnel | | |
| Servidor de Everest | | |

Seguimiento plan Azure: B1 / créditos / F1 + ping.
**User's choice (free text):** "tener en cuenta que no hay presupuesto para nada, seria hacer lo mas posible sin costos" → propuesto stack costo cero (Twilio trial, PC + Cloudflare Tunnel, Vercel, Supabase gratis, build local) — **aprobado**.

Teléfono: Mi teléfono ✓. Números: El mío y 1–2 más ✓.

---

## Claude's Discretion

- Texto exacto del SMS "a salvo" y microcopy de UI.
- Intervalos de envío de ubicación y polling del link; backoff de reintentos.
- Navegación, librería de mapas gratuita, layout de login/registro/contactos según legado.

## Deferred Ideas

- Costo de Claude API para la IA (fase 4) — sin presupuesto.
- Remitente SMS sin prefijo trial / short code — requiere pago.
- Hosting siempre encendido independiente de la PC — post-demo.
