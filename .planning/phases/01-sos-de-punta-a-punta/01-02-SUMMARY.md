---
phase: 01-sos-de-punta-a-punta
plan: 02
subsystem: decisiones
tags: [android, applicationId, sms-fallback, supply-chain]

requires: []
provides:
  - "applicationId de Android decidido: com.robertocarlos764.alertaya"
  - "Destino de POST /api/alerts/sms-fallback: deshabilitar en esta fase"
  - "Aprobacion consolidada de paquetes de la fase (sin rechazos)"
affects: [01-03, 01-04, 01-06, 01-10, 01-11]

actuals:
  tokens: 0
  tasks: 3
  commits: 1

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified: []

key-decisions:
  - "applicationId = com.robertocarlos764.alertaya (proyecto personal/universitario de Roberto, no de Everest Intelligent)"
  - "sms-fallback se deshabilita: 01-06 elimina el endpoint, SmsFallbackAuthService, su interfaz y SmsFallbackOptions"
  - "Lista de paquetes de 01-02 Tarea 3 aprobada completa por Roberto"

patterns-established: []

requirements-completed: []
---

# Plan 01-02: Decisiones del dia 1

Decisiones tomadas por Roberto el 2026-10-08, en una sola sesion.

## Tarea 1 — applicationId de Android

**Decision:** `com.robertocarlos764.alertaya`

Se descartaron las dos opciones del plan: Everest Intelligent no es dueño del proyecto (es un proyecto de universidad de Roberto) y `co.alertaya.app` apunta a un dominio que no se controla. Se usa el usuario de GitHub de Roberto, que ya es dueño del repo. El plan 01-11 lo pone en `apps/mobile/app.json` como `android.package`.

## Tarea 2 — POST /api/alerts/sms-fallback

**Decision:** deshabilitar en esta fase.

El plan 01-06 elimina el endpoint, `SmsFallbackAuthService`, `ISmsFallbackAuthService` y `SmsFallbackOptions` (incluida la sección `SmsFallback` de `appsettings.Example.json`). Con eso queda cerrada la amenaza T-01-05. El canal de SMS entrante se reconstruirá cuando haya proveedor; el código anterior sigue en el historial de git.

## Tarea 3 — Legitimidad de paquetes (gate blocking-human)

**Decision:** aprobado, sin rechazos.

Se aprobó la lista completa de `01-02-PLAN.md` Tarea 3: npm de la app móvil (SDK 57 vía `npx expo install`; supabase-js 2.117.2, @tanstack/react-query 5.104.1, openapi-fetch 0.17.0, @maplibre/maplibre-react-native 11.5.0, más las dependencias de desarrollo), npm de la web (next 16.x, react/react-dom 19.x, maplibre-gl 6.13.0, vitest 5.0.3, openapi-typescript 7.13.0, vercel CLI), las CLI (supabase 2.120.0 y ngrok) y NuGet (Twilio 8.0.2, xunit 2.9.3, xunit.runner.visualstudio 3.1.4, Microsoft.NET.Test.Sdk 18.10.1, coverlet.collector 6.0.4, Microsoft.AspNetCore.Mvc.Testing 8.0.31, Microsoft.Extensions.TimeProvider.Testing 9.10.0, Swashbuckle.AspNetCore.Cli 6.6.2). Esta aprobación cumple las `<precondition>` de las tareas de instalación de los planes posteriores. Cualquier paquete fuera de la lista necesita una aprobación aparte.

## Deviations

Ninguna en el alcance. Para el applicationId se eligió un valor fuera de las opciones listadas, que el plan permitía con la opción "otro".

## Self-Check: PASSED
