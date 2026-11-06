# API Coverage — Fase 1: SOS de punta a punta

> Full coverage by default. Opt-outs are explicit, reasoned decisions.
> Integraciones externas de la fase: Twilio Programmable Messaging (SMS y DLR, D-14) y Supabase Auth (registro/login, AUTH-01/02). Los servicios de hosting (ngrok, Vercel) y las teselas de OpenFreeMap son infraestructura o datos, no superficies de API que la app integre.

## Twilio Programmable Messaging (planes 01-01, 01-07, 01-08)

| capability | decision | reason |
|---|---|---|
| messages-create (enviar SMS) | INTEGRATE | |
| status-callback (webhook de estado / DLR) | INTEGRATE | |
| webhook-signature-validation (X-Twilio-Signature) | INTEGRATE | |
| messages-fetch (leer un mensaje por SID) | INTEGRATE | |
| messages-list (reconciliar envios huerfanos) | OPT-OUT | no necesario aun: riesgo residual at-least-once documentado en el dispatcher; se agrega si aparece un duplicado real (A18) |
| messages-update-cancel-redact | OPT-OUT | no necesario: los SMS de emergencia no se cancelan ni se editan una vez aceptados |
| media-mms | OPT-OUT | no necesario: solo texto GSM-7 (D-05) |
| scheduled-messages | OPT-OUT | no necesario: los avisos salen de inmediato |
| messaging-services-sender-pools | OPT-OUT | fuera de alcance: cuenta trial con un solo numero (D-13, D-14) |
| alphanumeric-sender-id | OPT-OUT | explicitamente fuera de alcance: Colombia no lo admite en trial y requiere pago (PLAT-V2-03, idea diferida) |
| short-codes | OPT-OUT | explicitamente fuera de alcance: requiere pago (idea diferida en CONTEXT) |
| inbound-sms-webhook | OPT-OUT | fuera de alcance: el fallback SMS entrante se decide en 01-02 y no hay proveedor entrante configurado |
| verify-api-otp | OPT-OUT | no en esta fase: OTP de celular es AUTH-03 (fase 6) |
| lookup-api | OPT-OUT | no necesario: validacion E.164 colombiana propia y la API es de pago |
| conversations-whatsapp | OPT-OUT | fuera de alcance del proyecto en v1 |
| pricing-api | OPT-OUT | no necesario: el spike lee el precio del recurso del mensaje |
| usage-records | OPT-OUT | no necesario aun: el saldo trial se revisa en la consola |

## Supabase Auth (planes 01-05, 01-11, 01-14; validacion de JWT en el API)

| capability | decision | reason |
|---|---|---|
| sign-up-email-password | INTEGRATE | |
| sign-in-with-password | INTEGRATE | |
| session-persistence-and-refresh | INTEGRATE | |
| sign-out-on-expiry-or-401 | INTEGRATE | |
| get-session | INTEGRATE | |
| jwks-jwt-validation-server | INTEGRATE | |
| email-confirmation-flow | INTEGRATE | |
| management-api-auth-config | INTEGRATE | |
| password-recovery | OPT-OUT | no en esta fase: AUTH-04 (fase 6) |
| phone-otp | OPT-OUT | no en esta fase: AUTH-03 (fase 6) |
| oauth-providers | OPT-OUT | fuera de alcance: login es correo y contrasena (PROJECT.md) |
| magic-link | OPT-OUT | no necesario: login es correo y contrasena |
| mfa | OPT-OUT | no necesario aun |
| update-user-change-password | OPT-OUT | no en UI-SPEC de la fase 1 |
| admin-api-service-role | OPT-OUT | nunca en el cliente; el API no lo necesita porque lee perfiles por Postgres |
| anonymous-sign-in | OPT-OUT | no necesario: toda alerta requiere cuenta |
| leaked-password-protection | OPT-OUT | no disponible en plan gratuito segun la documentacion de Supabase (D-13); se decide en el checkpoint de 01-05 |
