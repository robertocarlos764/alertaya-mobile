---
phase: "1"
slug: "sos-de-punta-a-punta"
status: approved
shadcn_initialized: false
preset: none
created: "2026-10-06"
---

# Fase 1 — Contrato de diseño UI

> Contrato visual y de interacción de la Fase 1. Generado por gsd-ui-researcher, verificado por gsd-ui-checker. Prosa en español; identificadores y código en inglés. Todo el copy visible es español (Colombia), tuteo.

**Superficies:** (A) app móvil Expo SDK 57 / React Native / TypeScript, solo Android; (B) página pública de seguimiento `apps/web` (Next.js en Vercel gratis), ruta `/t/[token]`, mobile-first.

**Fuentes que ya decidieron (no se re-preguntó):** D-01 a D-17 de `01-CONTEXT.md`; tokens de `docs/legacy/flutter/lib/theme/app_theme.dart`; reglas de `apps/mobile/AGENTS.md` (Expo Router en `src/app/`, `npx expo install`); STACK.md (reanimated 4.5.1, expo-haptics, expo-linear-gradient, DM Sans, maplibre). Presupuesto cero (D-13): solo librerías y teselas gratuitas.

**Regla rectora (Core Value):** ningún elemento de UI afirma algo que no ocurrió. Prohibido: "¡ALERTA ENVIADA!", checks verdes antes de la confirmación del proveedor, "GPS activo" sin GPS real, coordenadas inventadas, chip "Protección activa" (eso es Fase 2). El legacy hacía todo eso; **no se copia**.

---

## Design System

| Propiedad | Valor |
|-----------|-------|
| Tool | none (React Native no usa shadcn; la página web es una sola ruta, no justifica shadcn; decisión por defecto, reversible) |
| Preset | no aplica |
| Component library | none — componentes propios en `apps/mobile/src/components/ui/` (RN) y CSS propio en `apps/web` |
| Icon library | App: `@expo/vector-icons` (`MaterialIcons`, viene con Expo; mismo set que el legacy). Web: 4 SVG inline (phone, map-pin, navigation, shield), sin dependencia |
| Font | DM Sans. App: `@expo-google-fonts/dm-sans` (400 y 600). Web: `next/font/google` `DM_Sans` (400 y 600, autoalojada por Next) |
| Navegación (app) | Expo Router en `src/app/` (ver "Mapa de pantallas") |
| Mapa (app y web) | MapLibre, estilo vectorial gratuito **OpenFreeMap `dark`** (`https://tiles.openfreemap.org/styles/dark`, sin API key, uso comercial permitido, verificado HTTP 200 el 2026-10-06). Atribución obligatoria "OpenFreeMap © OpenMapTiles Data from OpenStreetMap" visible en el control de atribución del mapa. Web: `maplibre-gl` + `@vis.gl/react-maplibre` (STACK.md). App: `@maplibre/maplibre-react-native` (instalar con `npx expo install`; requiere nueva arquitectura y development build, ya previsto). **Verificar en el plan** que la versión resuelta por `expo install` funcione con SDK 57 (`npx expo-doctor`); si no, plan B: `react-native-webview` embebiendo `/t/[token]?embed=1` (mapa idéntico al de los contactos). |

Se omite `## Component Inventory` del template (Tool: none). Los componentes propios a construir están en "Contrato de componentes".

---

## Spacing Scale

Valores declarados (múltiplos de 4):

| Token | Valor | Uso |
|-------|-------|-----|
| xs | 4px | Separación icono-texto, padding interno de pills |
| sm | 8px | Separación label-input, gaps compactos |
| md | 16px | Espaciado por defecto, padding de cards e inputs |
| lg | 24px | Margen horizontal de pantalla, entre secciones cortas |
| xl | 32px | Entre secciones |
| 2xl | 48px | Quiebres mayores (logo-formulario) |
| 3xl | 64px | Espacio superior de pantallas de auth |

Excepciones (tamaños de componente, no espaciado; múltiplos de 4 salvo el radio 10, que se conserva del legacy por identidad visual — excepción aceptada en la verificación):
- Altura de botones e inputs: **56** (legacy `minimumSize 56`). Padding vertical del input = 16 (el legacy usaba 18; se normaliza a la escala).
- Objetivo táctil mínimo: 48 x 48 (iconos solos, filas de lista, tabs).
- Botón SOS: diámetro **220**; anillo de progreso: trazo 8, radio exterior 124 (deja 8 px de aire a su alrededor).
- Avatar de iniciales: 40 (contactos, header). Icono estándar 24; icono de estado en filas 20.
- Botón CANCELAR de la cuenta regresiva: altura 72.
- Mini mapa: altura 192. Mapa de la página pública: alto de pantalla restante, mínimo 320.
- Radios: 10 inputs y botones; 12 filas/cards pequeñas; 16 cards grandes, diálogos y mini mapa; 999 pills y círculos.

---

## Typography

Exactamente 4 tamaños y 2 pesos (400 regular, 600 semibold).

| Rol | Tamaño | Peso | Line height | Notas |
|-----|--------|------|-------------|-------|
| Body | 16 | 400 | 1.5 | Texto general, inputs, filas, párrafos |
| Label | 12 | 600 | 1.2 | Etiquetas de campo y de sección en MAYÚSCULAS con letterSpacing 1.0 (como el legacy). El texto meta/ayuda ("Label 12/400") usa este mismo tamaño con peso 400, sin mayúsculas, line-height 1.5 |
| Heading | 24 | 600 | 1.2 | Títulos de pantalla, nombre de persona en la página pública, texto de botones grandes (CANCELAR) |
| Display | 56 | 600 | 1.2 | "SOS" del botón (letterSpacing 2.0) |

- Botones: 16/600 letterSpacing 0.5 (legacy). Texto de botón sobre rojo `#E8212B` mide ≈4.48:1; es el color de identidad del legacy y se acepta como excepción **solo** con peso 600; no usar texto de 12 sobre ese rojo.
- Números de cronómetro y "hace X s": `fontVariant: ['tabular-nums']` para que no salten.
- **Excepción única:** el numeral gigante de la cuenta regresiva usa **160** / 600 / line-height 1.0 (D-03 "número gigante"). No es un rol reutilizable.
- Respetar escala de fuente del sistema hasta 1.3x; con escala mayor, los textos envuelven (nunca truncan etiquetas de estado).

---

## Color

Tema oscuro único (`userInterfaceStyle: dark`; STACK.md lo exige por targetSdk 36). Tokens heredados del legacy salvo los marcados *(nuevo)*.

| Rol | Valor | Uso |
|-----|-------|-----|
| Dominante (60%) | `#0D0D0D` | Fondo de todas las pantallas y de la página pública |
| Secundario (30%) | `#1A1A1A` | Cards, filas, inputs, tab bar, diálogos, hoja inferior de la página pública |
| Borde | `#2A2A2A` | Bordes de cards/inputs, separadores, fondo de avatar |
| Acento (10%) | `#E8212B` | Ver lista reservada abajo |
| Destructivo | `#E8212B` | Solo "Eliminar", "Falló" y errores de validación (siempre con icono y texto, nunca solo color) |
| Texto principal | `#FFFFFF` | Títulos y texto sobre fondos oscuros |
| Texto secundario *(nuevo)* | `#9A9A9A` | Texto de apoyo, placeholders, meta. Contraste 6.9:1 sobre `#0D0D0D` y 6.2:1 sobre `#1A1A1A` |
| Hint / deshabilitado | `#5A5A5A` | **Solo** iconos decorativos, bordes inactivos y controles deshabilitados. El legacy lo usaba para texto (2.8:1, falla WCAG): no repetir |
| Éxito *(nuevo)* | `#4ADE80` | Exclusivamente "Entregado" (con DLR del proveedor), "Estoy a salvo", "Alerta finalizada" |
| Advertencia *(nuevo)* | `#F5A524` | "En cola" con reintento, "Ubicación pendiente", sin conexión, ubicación vieja (>2 min) |
| Rojo profundo *(nuevo)* | `#B3121B` | Solo fondo base de la pantalla de cuenta regresiva (blanco encima = 6.6:1) |

Acento `#E8212B` reservado para:
1. Botón SOS y su anillo de progreso.
2. Botones primarios llenos: "Iniciar sesión", "Crear cuenta", "Guardar contacto", "Llamar a {Nombre}" (página pública).
3. Borde de foco y de error de inputs; icono y etiqueta del tab activo.
4. Logo/escudo "AlertaYA" del header y punto rojo del cronómetro de alerta activa.
5. Estado "Falló" y botón "Eliminar" del diálogo (destructivo).
6. Pin, círculo de precisión y trayecto en los mapas.

**Excepción de la regla 60/30/10 (deliberada):** la pantalla de cuenta regresiva es roja a pantalla completa (D-03): fondo `#B3121B`, glow pulsante `#E8212B`, texto blanco. Es el único lugar donde el rojo domina.

Estados de entrega por contacto (D-10, D-11). Cada estado lleva icono + texto, nunca solo color:

| Estado (API) | Etiqueta | Color | Icono (`MaterialIcons`) | Línea secundaria (Label 12/400) |
|--------------|----------|-------|-------------------------|---------------------------------|
| en cola | En cola | `#9A9A9A` (o `#F5A524` si está reintentando) | `schedule` | "Esperando red" / "Reintentando (1 de 2)" |
| enviado | Enviado | `#FFFFFF` | `check` | "Esperando confirmación de entrega" |
| entregado | Entregado | `#4ADE80` | `done-all` | "Confirmado por el operador" |
| fallido | Falló | `#E8212B` | `error-outline` | "No se pudo enviar el SMS" + botón "Llamar a {Nombre}" |

"Entregado" **solo** se pinta con DLR confirmado por Twilio. Si el worker está apagado o la API no responde, las filas se quedan en "En cola"; el texto "Enviado" jamás aparece sin confirmación del servidor.

---

## Mapa de pantallas y navegación (app, Expo Router)

```
src/app/
  _layout.tsx                 Stack raíz + guardia de sesión + guardia de alerta activa
  (auth)/login.tsx
  (auth)/register.tsx
  (app)/_layout.tsx           Stack
  (app)/(tabs)/_layout.tsx    Tabs: Inicio | Contactos
  (app)/(tabs)/index.tsx      Inicio (botón SOS)
  (app)/(tabs)/contacts.tsx   Lista de contactos
  (app)/contacts/new.tsx      Agregar contacto (push)
  (app)/contacts/[id].tsx     Editar contacto (push)
  (app)/countdown.tsx         Cuenta regresiva (fullScreenModal, sin gesto de cierre)
  (app)/alert.tsx             Alerta activa (se llega con replace)
```

- Guardias: sin sesión -> `/login`. Con sesión y alerta activa en almacenamiento local o servidor -> **siempre** `/alert` al abrir/reabrir la app (D-12). Persistencia de sesión al cerrar y reabrir (AUTH-02): mientras se resuelve la sesión se muestra un splash (fondo `#0D0D0D` + escudo), nunca un parpadeo de login.
- Tab bar: solo "Inicio" (`home`) y "Contactos" (`group`). Historial y Config. son de la Fase 3: **no se muestran pestañas muertas**. Fondo `#1A1A1A`, activo `#E8212B`, inactivo `#9A9A9A`, etiqueta 12/600, alto 64.
- Header de pantallas con tabs: escudo `shield` rojo 28 + "AlertaYA" (Body 16/600 en `#E8212B`) a la izquierda; avatar de iniciales 40 a la derecha (fondo `#2A2A2A`, iniciales blancas 12/600). Sin acción asociada al avatar en esta fase (no es botón).
- Transiciones: zoom/fade estándar de Android; la cuenta regresiva entra con fade (200 ms).
- `BackHandler`: en `/countdown` el botón atrás está **deshabilitado** (solo CANCELAR cancela; evita cancelaciones o salidas accidentales en una emergencia). En `/alert` atrás sale de la app (la alerta sigue activa).

---

## Contrato por pantalla (app)

### Login (`(auth)/login`)
- Fondo `#0D0D0D`, padding 24, contenido desplazable con teclado. Arriba (64): escudo rojo 48, "AlertaYA" Heading 24/600 blanco, subtítulo Body `#9A9A9A`: "Protección de alto nivel para lo que más importa." (legacy).
- Campos (label Label 12/600 MAYÚSCULAS `#9A9A9A`, 8 sobre el input; input 56, radio 10, fondo `#1A1A1A`, borde `#2A2A2A` 1, foco `#E8212B` 1.5, error `#E8212B` 1 + mensaje 12 rojo con icono):
  - CORREO ELECTRÓNICO (placeholder "nombre@ejemplo.com", teclado email, `autoComplete: email`, sin autocapitalizar)
  - CONTRASEÑA (placeholder "••••••••", icono ojo para mostrar/ocultar, `autoComplete: password`)
- CTA "Iniciar sesión" (primario lleno 56 ancho completo). Enviando: spinner blanco 24 reemplaza el texto, botón deshabilitado, inputs deshabilitados.
- Enlace secundario: "¿No tienes una cuenta? **Crear cuenta**" (texto `#9A9A9A`, enlace blanco 600).
- **No incluir** "Olvidé mi contraseña" (Fase 6) ni iconos biométricos (no existen): no hay controles muertos.
- Error de credenciales: banner arriba del botón (fondo `#1A1A1A`, borde rojo, icono `error-outline`): "Correo o contraseña incorrectos. Revísalos e intenta de nuevo."

### Registro (`(auth)/register`)
- Encabezado "Crear cuenta" Heading 24 + "Únete a la red de seguridad más avanzada." Body `#9A9A9A`. Botón atrás (flecha) arriba a la izquierda.
- Campos en este orden: NOMBRE COMPLETO, CORREO ELECTRÓNICO, TELÉFONO (prefijo fijo "+57" a la izquierda; 10 dígitos; ver validación), CONTRASEÑA (mínimo 6, coincide con el mínimo por defecto de Supabase Auth). Placeholder del teléfono: "300 123 4567".
- Validación al salir del campo y al enviar (mensajes bajo el campo):
  - Nombre vacío: "Ingresa tu nombre."
  - Correo vacío/inválido: "Ingresa un correo válido."
  - Teléfono: "Ingresa un celular colombiano de 10 dígitos (ej. 300 123 4567)." (debe empezar por 3; se normaliza a `+57XXXXXXXXXX`).
  - Contraseña: "Mínimo 6 caracteres."
- Errores del servidor: "Este correo ya está registrado." / "La contraseña es muy débil." / red: ver Copywriting.
- CTA "Crear cuenta". Al registrar con sesión inmediata -> `(tabs)/index`. **Supuesto abierto:** si el proyecto Supabase exige confirmar el correo y `signUp` no devuelve sesión, mostrar pantalla de estado "Revisa tu correo" ("Te enviamos un enlace para confirmar tu cuenta. Después vuelve e inicia sesión.") + botón "Ir a iniciar sesión". El plan debe verificar el ajuste "Confirm email" del proyecto (para la demo conviene desactivarlo; cambio de configuración remota solo con confirmación de Roberto).

### Inicio (`(tabs)/index`)
Orden vertical, centrado, margen 24: header; espacio flexible; botón SOS; 40; texto de ayuda; espacio flexible; card de ubicación.

- **Botón SOS (D-01):** círculo 220 `#E8212B`, glow rojo (dos sombras: `#E8212B` 40% blur 60 spread 20 y 20% blur 100 spread 40; en RN usar `expo-linear-gradient`/`RadialGradient` por SVG detrás del botón, porque `elevation` no da glow de color). Texto "SOS" Display 56/600 letterSpacing 2 + icono `touch-app` 32 debajo.
- **Mantener 2 s (anillo):** `react-native-svg` circle radio 124 trazo 8 `#FFFFFF`, track `#2A2A2A` 100%. Al presionar: escala 0.92 (130 ms easeOut), háptico ligero (`expo-haptics` Impact Light), el trazo se llena en sentido horario de 0 a 100% **lineal en 2000 ms** (Reanimated, en UI thread). Al llegar a 100%: háptico `notificationAsync(Warning)` y `router.push('/countdown')`. Al soltar antes: el trazo vuelve a 0 en 200 ms, escala vuelve a 1 con `easeOutBack`, sin navegar.
- Texto de ayuda (Body `#9A9A9A`, centrado): reposo "Mantén presionado 2 segundos para activar."; durante la presión "Sigue presionando…" (blanco).
- Reposo: pulso sutil del glow (opacidad 0.6 a 1, 2 s, loop). Con "reducir animaciones" activo: sin pulso ni escalado, glow estático.
- **Accesibilidad del hold:** `accessibilityLabel` "Botón SOS", `accessibilityHint` "Mantén presionado dos segundos para iniciar la cuenta regresiva", y acción personalizada TalkBack `activate` "Iniciar cuenta regresiva SOS" que abre `/countdown` directamente (la cuenta regresiva sigue siendo cancelable).
- **Sin contactos (0):** el botón se pinta deshabilitado (`#2A2A2A`, texto `#5A5A5A`, sin glow, el hold no hace nada) y el texto de ayuda se reemplaza por "Agrega al menos un contacto para poder usar SOS." con botón secundario "Agregar contacto". Nunca se inicia una alerta sin destinatarios.
- **Card UBICACIÓN ACTUAL** (fondo `#1A1A1A`, borde `#2A2A2A`, radio 16, padding 16; icono `map` en cuadro `#0D0D0D` radio 12; icono `my_location` a la derecha). Texto real, nunca fijo:

| Estado real | Línea principal | Color del punto/icono |
|-------------|-----------------|-----------------------|
| Sin permiso (primera vez) | "Permite la ubicación para que tus contactos te vean en el mapa." + botón "Permitir ubicación" (pide ubicación en primer plano; los demás permisos son Fase 2) | `#F5A524` |
| Permiso denegado | "Sin permiso de ubicación. Tu alerta saldrá con ubicación pendiente." + enlace "Abrir ajustes" | `#F5A524` |
| Obteniendo | "Obteniendo ubicación…" | `#9A9A9A` |
| Fijada | "Ubicación lista · ±{n} m" | `#4ADE80` |
| GPS apagado/sin fix | "Sin señal GPS. Tu alerta saldrá con ubicación pendiente." | `#F5A524` |

  El SOS **nunca se bloquea** por falta de ubicación (UBIC-02).
- Animación de entrada: stagger fade-in (opacidad + 12 px de desplazamiento, 450-500 ms, retrasos 0/150/300/420 ms: card, botón, texto, ubicación) como el legacy. Se omite con "reducir animaciones".

### Cuenta regresiva (`(app)/countdown`) — D-02, D-03, D-04
- Pantalla completa, sin header ni tab bar. Fondo `#B3121B`; status bar y barra de navegación con el mismo color, iconos claros. `expo-keep-awake` activo.
- Contenido centrado: etiqueta "ENVIANDO ALERTA EN" (Label 12/600 MAYÚSCULAS, blanco 80%); numeral **160**/600 blanco (5, 4, 3, 2, 1); debajo "segundos" Body blanco; 24 más abajo: "Tus contactos recibirán un SMS con tu ubicación." Body blanco 80% centrado.
- Glow pulsante detrás del numeral: círculo `#E8212B` con blur, opacidad 0.25 a 0.6 en 1 s por segundo (sincronizado con el tick). Cada tick: el numeral entra con escala 1.15 a 1 en 150 ms.
- **Vibración en cada segundo:** `Vibration.vibrate(200)` al iniciar y en cada cambio de número; sin sonido (D-03).
- **CANCELAR:** abajo, margen 24, ancho completo, altura 72, fondo `#FFFFFF`, texto "CANCELAR" Heading 24/600 en `#B3121B` (contraste 6.6:1), radio 10. Escala 0.95 al presionar + háptico.
- Duración: 5 s por defecto, tomada del perfil (`ventana_confirmacion_segundos`, D-02). La UI no hardcodea 5.
- Al presionar CANCELAR: vibración corta (80 ms), `router.dismissTo('/')`, snackbar en Inicio: "Alerta cancelada. No se envió nada." No hay llamada de red ni alerta persistida.
- Al llegar a 0: se persiste la alerta localmente y se hace `router.replace('/alert')` sin pantalla intermedia de "enviada" (D-04).
- Reducir animaciones: sin escala del numeral ni pulso del glow; la vibración se mantiene.

### Alerta activa (`(app)/alert`) — D-09 a D-12, SOS-04, UBIC-02
Pantalla desplazable, fondo `#0D0D0D`, margen 24, `expo-keep-awake` activo. Sin botón atrás ni pestañas.

1. **Header:** escudo + "AlertaYA" (izquierda); a la derecha punto rojo pulsante 8 + etiqueta "ACTIVA" (Label 12/600 `#E8212B`) + cronómetro `MM:SS` (`H:MM:SS` desde 1 h) blanco 16/600 tabular. El cronómetro cuenta desde el `createdAt` real de la alerta (sobrevive a reabrir la app).
2. **Banner sin conexión** (solo si no hay red): fondo `#1A1A1A`, borde `#F5A524`, icono `cloud-off`: "Sin conexión. Tu alerta está guardada y se enviará en cuanto vuelva la red."
3. **Titular honesto** (Heading 24/600 + Body `#9A9A9A`), derivado del estado real agregado de los contactos:

| Condición real | Titular | Subtítulo |
|----------------|---------|-----------|
| Todos en cola (o servidor sin confirmar) | "Alerta activa" | "Guardada en tu teléfono. Avisando a tus contactos…" |
| Al menos 1 enviado, ninguno entregado | "Alerta activa" | "Mensajes enviados. Esperando confirmación de entrega." |
| Al menos 1 entregado | "Alerta activa" | "{n} de {m} contactos recibieron tu aviso." |
| Todos fallidos | "No pudimos avisar a tus contactos" (acento `#E8212B`) | "Llámalos directamente o al 123." |

   Sin icono grande de éxito. Sin "¡ALERTA ENVIADA!".
4. **Sección "UBICACIÓN QUE VEN TUS CONTACTOS"** (Label 12/600): mini mapa 192 alto, radio 16, borde `#2A2A2A`, estilo OpenFreeMap dark, no interactivo (sin gestos; toque sin acción), pin `#E8212B` con círculo de precisión (relleno `#E8212B` 15%, borde 40%) centrado en el **último punto confirmado por el servidor**. Debajo (Body): "±{n} m · hace {x} s" (`hace {x} min` desde 60 s; `#F5A524` si pasa de 2 min). **Nunca** coordenadas numéricas ni punto por defecto. Ubicación pendiente: en lugar del mapa, bloque `#1A1A1A` de 192 con icono `location-off` 32 `#F5A524` y "Ubicación pendiente. Esperando señal GPS; tus contactos ven este mismo aviso."
5. **Sección "CONTACTOS"** (Label 12/600): una fila por contacto (fondo `#1A1A1A`, radio 12, padding 16, gap 8 entre filas, altura mínima 72): avatar 40 con iniciales, nombre (Body 600), teléfono (Label 12/400 `#9A9A9A`), a la derecha estado (icono 20 + etiqueta 12/600 con el color de la tabla de estados). Fila **fallida**: debajo, ancho completo, botón outlined 48 "Llamar a {Nombre}" (`tel:` por `Linking`, abre el marcador; no marca solo). El cambio de estado anima con fade de 200 ms y háptico ligero solo al pasar a "Falló".
6. **Compartir enlace:** botón outlined 56 (`#FFFFFF` borde `#2A2A2A` 1.5, icono `share`) "Compartir enlace" -> `Share.share` nativo con el mensaje: "Sigue mi ubicación en vivo: {link}". Deshabilitado con "Generando enlace…" hasta que el servidor devuelva el token.
7. **Estoy a salvo (D-09):** botón 56 ancho completo, borde `#4ADE80` 1.5, texto "ESTOY A SALVO" 16/600 `#4ADE80` letterSpacing 1.0, icono `verified-user`; debajo Label 12/400 `#9A9A9A` "Mantén presionado 3 segundos". Al presionar, un relleno `#4ADE80` al 25% avanza de izquierda a derecha, **lineal en 3000 ms**, háptico ligero al inicio y de éxito al completar; soltar antes lo regresa a 0 en 200 ms. Completado: botón en estado "Finalizando…" (spinner) hasta que el servidor confirme; solo entonces `router.replace('/')` con snackbar "Alerta finalizada. Estamos avisando a tus contactos que estás a salvo." Si falla (sin red): el botón vuelve a reposo y snackbar "No pudimos finalizar la alerta. Sigue activa. Intenta de nuevo." (la alerta **no** se da por terminada hasta que el servidor lo confirme). Mismo `accessibilityAction` alternativo que el SOS.
8. **Llamar al 123:** botón de texto 48 centrado `#9A9A9A` con icono `phone` (abre el marcador con `tel:123`; es solo un atajo, la llamada automática es Fase 5).
- **No hay botón "Cancelar alerta"** en esta fase (PIN = Fase 5); la salida es "Estoy a salvo".
- Apertura tras cerrar la app (D-12): entra directo aquí; el cronómetro y los estados se rehidratan desde el servidor antes de mostrar valores (skeleton 200 ms máx. en filas, nunca estados inventados).

### Contactos (`(tabs)/contacts`)
- Título "Contactos" Heading 24/600 (el legacy usaba 32; se normaliza) + contador Body `#9A9A9A`: 1 -> "1 contacto de emergencia"; n -> "{n} contactos de emergencia". FAB circular 56 `#E8212B` con icono `add` abajo a la derecha (sobre la tab bar, margen 16), escala 0.95.
- Fila (fondo `#1A1A1A`, borde `#2A2A2A`, radio 12, padding 16, mínimo 72): avatar 40 (`#2A2A2A`, iniciales blancas 12/600), nombre Body 600 (1 línea, elipsis), "{Relación} · {teléfono}" Label 12/400 `#9A9A9A` (1 línea, elipsis; sin relación solo teléfono). Toque -> editar. Icono `delete-outline` 24 (objetivo 48) `#9A9A9A` a la derecha -> diálogo de eliminación. El legacy tenía llamar/color de avatar: **no** se incluyen (sin campo en la API; YAGNI).
- Diálogo de eliminación: fondo `#1A1A1A`, radio 16, título Heading 24/600 "Eliminar contacto", cuerpo Body, botones "Cancelar" (texto blanco) y "Eliminar" (texto `#E8212B` 600).
- Carga: 3 filas skeleton (`#1A1A1A` pulsando a `#2A2A2A`). Error de carga: ver Copywriting. Sin contactos: ver Copywriting.

### Agregar / editar contacto (`contacts/new`, `contacts/[id]`)
- Header con flecha atrás y título "Nuevo contacto" / "Editar contacto" (Heading 24/600). Avatar grande 80 con iniciales en vivo (se actualizan al escribir el nombre).
- Sección INFORMACIÓN (Label 12/600): NOMBRE COMPLETO (placeholder "Ej: María García"), TELÉFONO (prefijo "+57" fijo, 10 dígitos, placeholder "300 123 4567"), RELACIÓN (opcional; chips seleccionables de una sola opción, alto 40, radio 999, fondo `#1A1A1A`, borde `#2A2A2A`, seleccionado borde `#E8212B`: "Mamá", "Papá", "Pareja", "Hermano/a", "Amigo/a", "Otro"; tocar de nuevo deselecciona).
- Validación: nombre "El nombre es obligatorio."; teléfono "Ingresa un celular colombiano de 10 dígitos (ej. 300 123 4567)."; duplicado de teléfono "Ya tienes un contacto con ese número."
- CTA "Guardar contacto" (primario lleno 56, margen inferior 32). Guardando: spinner. Éxito: vuelve a la lista con snackbar "{Nombre} agregado." / "Cambios guardados.". Sin color de avatar (se descarta el selector del legacy).
- Aviso informativo bajo el CTA en "Nuevo contacto" (Label 12/400 `#9A9A9A`): "Este contacto recibirá un SMS con un enlace cuando actives una alerta." (No promete aviso al agregarlo: eso es CONT-02, Fase 6.)

---

## Página pública de seguimiento (`apps/web`, `/t/[token]`) — D-06, D-07, D-08, NOTI-03

Mobile-first, diseñada a 360 px de ancho, máximo 480 px centrado en pantallas grandes. Mismos tokens de color, DM Sans 400/600 y escala tipográfica de 4 tamaños (12/16/24 y 56 no se usa aquí). Sin login, sin cookies de seguimiento. `<html lang="es-CO">`, `<meta name="robots" content="noindex,nofollow">`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store`. Título: "AlertaYA — Alerta de {Nombre}".

**Estructura (de arriba a abajo):**
1. Barra superior 56: escudo SVG rojo + "AlertaYA" Body 600; a la derecha, la etiqueta de estado (pill, ver tabla).
2. **Banner de estado** (fondo `#1A1A1A`, padding 16, `aria-live="polite"`): ver tabla de estados.
3. **Mapa** a todo el ancho (alto restante, mínimo 320; `maplibre-gl` cargado con `next/dynamic` `ssr:false`; el shell y los textos se pintan antes que el mapa). OpenFreeMap dark. Pin `#E8212B` 16 con anillo pulsante, círculo de precisión (relleno 15%, borde 40%), trayecto = línea `#E8212B` 60% de opacidad, 4 px, desde el inicio de la alerta, punto de inicio `#FFFFFF` 8. Encuadre inicial: `fitBounds` al trayecto; luego sigue el último punto mientras la persona no mueva el mapa; si lo mueve aparece el botón "Centrar" (48, `#1A1A1A`, borde `#2A2A2A`, esquina inferior derecha). Control de atribución visible. Controles de zoom ocultos (gestos táctiles).
4. **Hoja inferior** (no arrastrable; fondo `#1A1A1A`, radio superior 16, padding 24): nombre de la persona Heading 24/600; "Última ubicación hace {x} s · precisión ±{n} m" Body `#9A9A9A` (se actualiza cada segundo en el cliente usando la hora del servidor `serverNow` para no depender del reloj del celular; `#F5A524` si pasa de 2 min con sufijo " — sin actualizar"); "Alerta iniciada hace {x}" Label 12/400.
5. **Botones** apilados, gap 8, ancho completo, altura 56, radio 10:
   - "Llamar a {Nombre}" — primario `#E8212B` lleno, `tel:`.
   - "Llamar al 123" — outlined (borde `#2A2A2A` 1.5, texto blanco), `tel:123`.
   - "Abrir en Google Maps" — outlined, `https://www.google.com/maps/search/?api=1&query={lat},{lon}`, `target="_blank" rel="noopener noreferrer"`. Con ubicación pendiente queda deshabilitado (`aria-disabled`, texto `#5A5A5A`) con ayuda Label 12 "Disponible cuando haya ubicación."
6. Pie (Label 12/400 `#9A9A9A`, padding 24): "Este enlace deja de mostrar la ubicación 1 hora después de que termine la alerta."

**Estados (todos obligatorios):**

| Estado | Pill / banner | Mapa | Botones |
|--------|---------------|------|---------|
| Cargando (primer fetch) | Banner "Cargando alerta…" | Bloque `#1A1A1A` pulsando "Cargando mapa…" | Ocultos |
| Activa con ubicación | Pill rojo "ACTIVA" con punto pulsante; banner "{Nombre} activó una alerta de emergencia." | Pin + precisión + trayecto | Los 3 |
| Ubicación pendiente (sin ningún punto) | Pill ámbar "UBICACIÓN PENDIENTE"; banner "Ubicación pendiente. {Nombre} aún no tiene señal GPS. Seguimos esperando." | **Sin mapa**: bloque `#1A1A1A` con icono `location-off` `#F5A524` y el mismo texto. Nunca una coordenada ni mapa centrado en una ciudad por defecto | "Llamar a {Nombre}", "Llamar al 123"; Google Maps deshabilitado |
| Finalizada (dentro de 1 h, D-07) | Pill verde "FINALIZADA"; banner (verde) "{Nombre} indicó que está a salvo. La alerta terminó." | Último punto + trayecto, sin pulso, sin polling | "Llamar a {Nombre}" y "Abrir en Google Maps" (se oculta el 123) |
| Finalizada (pasada 1 h) | Pill verde "FINALIZADA"; pantalla centrada: icono `check-circle` 48 `#4ADE80`, "Alerta finalizada" Heading 24, "Por privacidad, ya no se muestra la ubicación." Body `#9A9A9A` | **No se pide ni se muestra ningún dato de ubicación** | Ninguno |
| Enlace inválido, expirado o revocado (404/410) | Pantalla centrada: icono `link-off` 48 `#9A9A9A`, "Este enlace ya no está disponible" Heading 24, "Si estás intentando ayudar a alguien, llama al 123." Body | Ninguno | "Llamar al 123" |
| Error de red durante polling | Barra ámbar fija bajo la barra superior: "Sin conexión. Reintentando…" | Se conserva el último dato y su antigüedad real | Se conservan |
| Error 5xx en carga inicial | "No pudimos cargar la alerta." + botón "Reintentar" (outlined) y "Llamar al 123" | Ninguno | — |

- **Polling (discreción):** cada 5 s mientras la pestaña está visible; se pausa con `document.hidden` y reanuda con un fetch inmediato al volver; se detiene en "finalizada" e "inválido". Backoff a 15 s tras 3 fallos seguidos. Sin Realtime ni claves anónimas (STACK.md).
- **Accesibilidad:** botones y enlaces >= 48 px de alto, foco visible (`outline 2px #FFFFFF`), banner de estado en región `aria-live="polite"`, mapa con `aria-label="Mapa con la ubicación de {Nombre}"` y la misma información disponible en texto (hoja inferior), contraste mínimo 4.5:1 (texto sobre `#E8212B` solo en botones 16/600, ver nota de Typography).
- **Rendimiento:** presupuesto cero y datos móviles del contacto: shell HTML+CSS inicial ligero; `maplibre-gl` diferido; sin librerías de UI.
- **Dependencia con la API:** el endpoint público debe devolver `personName`, `personPhone`, `status`, `lastLocation{lat,lon,accuracyM,recordedAt}|null`, `trail[]`, `startedAt`, `endedAt|null`, `serverNow`. Pasada 1 h de `endedAt` debe devolver `status` sin `lastLocation` ni `trail`.

---

## Contrato de componentes (propios)

| Componente | Ubicación | Responsabilidad |
|------------|-----------|-----------------|
| `theme/tokens.ts` | `src/theme/` | Colores, espaciado, radios, tipografía de este documento (única fuente; prohibidos hex sueltos en pantallas) |
| `Screen`, `Header` | `src/components/ui/` | Fondo, safe areas, margen 24, header con logo y avatar |
| `AppText` | `src/components/ui/` | Variantes `body`, `label`, `heading`, `display` (solo las 4 de Typography) |
| `Button` | `src/components/ui/` | Variantes `primary`, `outline`, `ghost`, `destructive-text`; altura 56; estado `loading`/`disabled`; escala 0.95 + háptico opcional (`PressableScale`) |
| `TextField` | `src/components/ui/` | Label MAYÚSCULAS, input 56, estados foco/error/deshabilitado, mensaje de error con icono |
| `HoldButton` | `src/components/` | Anillo/relleno de progreso por duración (2000 ms SOS, 3000 ms a salvo), háptico inicio/fin, cancelación al soltar, `accessibilityActions` |
| `ContactRow`, `Avatar` | `src/components/` | Fila de contacto y avatar de iniciales |
| `DeliveryStatus` | `src/components/` | Mapea estado API -> icono + etiqueta + color (tabla de estados); **única** ruta para pintar un estado de entrega |
| `LocationMiniMap` | `src/components/` | MapLibre no interactivo, pin + precisión; `pending` renderiza el bloque "Ubicación pendiente" |
| `Snackbar` / `Dialog` | `src/components/ui/` | Mensajes breves (4 s) y confirmación de eliminar |
| `Skeleton` | `src/components/ui/` | Filas pulsantes en carga |

---

## Movimiento y accesibilidad (transversal)

- Duraciones: press 130 ms; fades 200-500 ms; progreso de hold lineal (2000/3000 ms); nada decorativo > 600 ms salvo loops de pulso.
- Reanimated 4.5.1 (pin SDK 57) para escala, pulso, anillos; todo en UI thread.
- `AccessibilityInfo.isReduceMotionEnabled`: desactiva stagger, pulsos y escalado de numeral; mantiene vibración y progreso de holds (son funcionales).
- Cada control con `accessibilityLabel` en español; los estados de entrega y el cronómetro se anuncian como texto ("Ana García, entregado"), no solo por color/icono.
- Objetivos táctiles >= 48 x 48. Orientación fija vertical (la app ya está en `portrait`).
- Teclado: `KeyboardAvoidingView`/`edge-to-edge` (targetSdk 36 no permite opt-out de edge-to-edge): respetar insets en todas las pantallas, incluida la cuenta regresiva a color completo bajo la barra de estado y de navegación.

---

## Copywriting Contract

| Elemento | Copy |
|----------|------|
| CTA principal de la fase | Botón "SOS" (mantener 2 s). Ayuda: "Mantén presionado 2 segundos para activar." |
| CTAs de formularios | "Iniciar sesión", "Crear cuenta", "Guardar contacto" |
| Cuenta regresiva | "ENVIANDO ALERTA EN" / "segundos" / "Tus contactos recibirán un SMS con tu ubicación." / botón "CANCELAR" |
| Cuenta regresiva cancelada | "Alerta cancelada. No se envió nada." |
| Estado vacío — contactos (título) | "Sin contactos aún" |
| Estado vacío — contactos (cuerpo) | "Agrega a quienes quieres que avisemos en una emergencia. Necesitas al menos uno para usar SOS." + botón "Agregar contacto" |
| Estado vacío — SOS sin contactos | "Agrega al menos un contacto para poder usar SOS." |
| Error — credenciales | "Correo o contraseña incorrectos. Revísalos e intenta de nuevo." |
| Error — sin conexión (acciones) | "No hay conexión. Revisa tu internet e intenta de nuevo." |
| Error — servidor | "No pudimos completar la acción. Intenta de nuevo en unos segundos." |
| Error — cargar contactos | "No pudimos cargar tus contactos." + botón "Reintentar" |
| Error — guardar contacto | "No se pudo guardar el contacto. Intenta de nuevo." |
| Error — registro | "Este correo ya está registrado." / "La contraseña es muy débil." / "Ingresa un correo válido." |
| Alerta — titular | "Alerta activa" (ver tabla de titulares honestos) |
| Alerta — sin red | "Sin conexión. Tu alerta está guardada y se enviará en cuanto vuelva la red." |
| Alerta — estados | "En cola" / "Enviado" / "Entregado" / "Falló" (+ "Reintentando (1 de 2)") |
| Alerta — fallo por contacto | "No se pudo enviar el SMS" + botón "Llamar a {Nombre}" |
| Alerta — ubicación pendiente | "Ubicación pendiente. Esperando señal GPS; tus contactos ven este mismo aviso." |
| Compartir | "Compartir enlace" / mensaje: "Sigue mi ubicación en vivo: {link}" |
| Finalizar | "ESTOY A SALVO" / "Mantén presionado 3 segundos" / "Finalizando…" |
| Finalizada (éxito) | "Alerta finalizada. Estamos avisando a tus contactos que estás a salvo." |
| Finalizada (error) | "No pudimos finalizar la alerta. Sigue activa. Intenta de nuevo." |
| Confirmación destructiva — eliminar contacto | "Eliminar contacto: ¿Eliminar a {Nombre} de tus contactos de emergencia? Dejará de recibir tus alertas." Botones "Cancelar" / "Eliminar" |
| Destructivas restantes | Ninguna en la fase. "Estoy a salvo" y SOS se confirman con el hold; la cuenta regresiva se cancela con CANCELAR |
| SMS de a salvo (discreción, sin tildes para GSM-7) | `AlertaYA: <Nombre> indico que esta a salvo. La alerta termino.` |

Notas de copy:
- Tuteo, frases cortas, sin signos de exclamación en estados de emergencia (el legacy usaba "¡ALERTA ENVIADA!").
- El SMS (D-05) está bloqueado. **Para el plan:** el `<Nombre>` puede traer tildes/ñ; normalizar a caracteres GSM-7 (o aceptar segmento UCS-2 de 70 caracteres) y probar la longitud real con el nombre más largo permitido.
- Contactos y alerta usan vocabulario del dominio ("contacto de emergencia", "alerta"); nunca "panic", "ping" ni anglicismos en UI.

---

## UI Considerations

Probe ejecutado sobre 8 superficies (44 consideraciones aplicables). Todas resueltas: explícitas (✅) o con prueba de respaldo (🧪). Sin pendientes.

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| empty | list-collection: lista de contactos | ✅ covered | Sin contactos se muestra "Sin contactos aún" + cuerpo y botón "Agregar contacto" (ver Copywriting) |
| empty | interactive-control: botón SOS | ✅ covered | Con 0 contactos el botón SOS queda deshabilitado y explica por qué; nunca inicia una alerta sin destinatarios |
| empty | media: mini mapa / mapa público | ✅ covered | Sin ningún punto de ubicación se reemplaza el mapa por el bloque "Ubicación pendiente"; nunca una coordenada ni centro por defecto |
| loading | list-collection: contactos | ✅ covered | 3 filas skeleton pulsando; sin spinner a pantalla completa |
| loading | form: login, registro, contacto | ✅ covered | Botón con spinner, inputs deshabilitados mientras se envía; doble envío bloqueado |
| loading | media: mapa público | ✅ covered | Shell y textos primero; mapa diferido con bloque "Cargando mapa…" |
| loading | list-collection: contactos de la alerta activa al reabrir | ✅ covered | Skeleton máx. 200 ms y luego estados rehidratados del servidor; nunca estados inventados |
| loading | interactive-control: compartir enlace | ✅ covered | Deshabilitado con "Generando enlace…" hasta tener el token |
| error | form: login, registro | ✅ covered | Mensajes bajo cada campo y banner de credenciales (ver Copywriting) |
| error | list-collection: contactos | ✅ covered | "No pudimos cargar tus contactos." + "Reintentar" |
| error | interactive-control: estoy a salvo | ✅ covered | Si falla la red, la alerta sigue activa y se avisa; no se da por finalizada sin confirmación |
| error | list-collection: contacto fallido | ✅ covered | "Falló" rojo + "No se pudo enviar el SMS" + botón "Llamar a {Nombre}" tras 2 reintentos (D-11) |
| error | media: página pública | ✅ covered | Tabla de estados: red (barra ámbar, conserva último dato), 5xx (reintentar + 123), 404/410 (enlace no disponible) |
| error | nav: guardia de sesión | ✅ covered | Sesión inválida/expirada -> `/login` con "Tu sesión expiró. Inicia sesión de nuevo." |
| populated | list-collection: contactos y estados por contacto | ✅ covered | Filas de 72 con avatar, nombre, relación, teléfono; estados por tabla de entrega |
| populated | media: mapa con trayecto | ✅ covered | Pin + precisión + polilínea desde el inicio + "hace X s" |
| partial | form: contacto sin relación | ✅ covered | Relación opcional; la fila muestra solo el teléfono |
| partial | list-collection: alerta con estados mezclados | ✅ covered | Cada fila con su estado; titular agregado "{n} de {m} contactos recibieron tu aviso" |
| partial | media: ubicación con precisión o antigüedad degradada | ✅ covered | Muestra siempre ±m y antigüedad real; ámbar a partir de 2 min sin actualizar |
| overflow | list-collection: muchos contactos | 🧪 backstop | Lista desplazable con FAB sin tapar la última fila (padding inferior 80); prueba visual con 20 contactos |
| overflow | list-collection: alerta activa con muchos contactos | 🧪 backstop | La pantalla entera desplaza; "Estoy a salvo" siempre alcanzable al final; prueba visual con 10 contactos |
| zero-one-many | list-collection: contactos | ✅ covered | Contador singular/plural: "1 contacto de emergencia" / "{n} contactos de emergencia"; 0 muestra el vacío |
| long-text | form/list: nombre y relación largos | ✅ covered | Una línea con elipsis en filas de contactos; en la alerta activa el nombre puede ocupar 2 líneas; en la página pública el nombre en Heading envuelve |
| long-text | static-content: nombre en SMS y página | 🧪 backstop | Prueba con nombre de 60 caracteres y tildes (SMS GSM-7 y titular de la página) |
| long-text | interactive-control: etiquetas de botones con fuente 1.3x | 🧪 backstop | Botones crecen en alto (min 56), sin truncar; prueba con escala de fuente 1.3 |
| long-text | nav: etiquetas de tabs | ✅ covered | 2 tabs cortas ("Inicio", "Contactos"), 12/600 una línea |
| error | form: confirmación de correo de Supabase | ✅ covered | Para la demo se desactiva "Confirm email" en Supabase Auth (cambio en el proyecto remoto: el plan lo ejecuta como checkpoint con confirmación explícita de Roberto). La pantalla "Revisa tu correo" se implementa igual por si el ajuste está activo: `signUp` sin sesión -> "Te enviamos un correo para confirmar tu cuenta." |
| error | media: `@maplibre/maplibre-react-native` en SDK 57 | ✅ covered | El plan verifica compatibilidad con `npx expo install` + `npx expo-doctor` al inicio; si falla, se adopta el plan B (WebView con `/t/[token]?embed=1`) sin re-preguntar |
| loading | media: primera carga de teselas en datos móviles lentos | ✅ covered | Sin estilo de respaldo (YAGNI): si las teselas no cargan, el fondo queda `#1A1A1A` y el pin, la precisión, la antigüedad y el estado en texto siguen visibles; el texto nunca depende del mapa |

| empty | form: login, registro, agregar contacto | ✅ covered | Formulario vacío con placeholders del Copywriting; botón primario deshabilitado hasta que los campos obligatorios sean válidos |
| partial | form: registro con campos a medio llenar | ✅ covered | Validación por campo al perder foco; solo se muestran errores de campos tocados |
| long-text | form: correo/nombre largos en inputs | ✅ covered | Input de una línea con desplazamiento horizontal nativo; sin truncar el valor |
| loading | interactive-control: cuenta regresiva | ✅ covered | No hay carga: la cuenta corre 100% local; la alerta se persiste en el outbox local al llegar a 0 antes de cualquier red |
| error | interactive-control: cuenta regresiva sin red | ✅ covered | Al llegar a 0 sin conexión navega igual a alerta activa con banner "Sin conexión" y contactos "En cola"; nunca "Enviado" |
| long-text | static-content: numeral de la cuenta regresiva | ✅ covered | Un dígito (5..1) a 160; sin texto variable |
| populated | interactive-control: inicio con SOS | ✅ covered | Botón SOS rojo con glow + tarjeta de ubicación real + contador de contactos |
| overflow | static-content: inicio en pantallas pequeñas | 🧪 backstop | Pantalla desplazable; SOS 220 centrado; prueba visual en 360x640 |
| zero-one-many | list-collection: contactos en alerta activa | ✅ covered | Titular "{n} de {m} contactos recibieron tu aviso"; 1 contacto en singular; 0 imposible (SOS deshabilitado sin contactos) |
| empty | list-collection: alerta activa sin estados aún | ✅ covered | Cada contacto arranca "En cola" mientras el servidor no responde |
| loading | media: página pública primera carga | ✅ covered | Shell con nombre/estado primero y "Cargando mapa…"; ver tabla de estados de la página |
| long-text | static-content: página pública nombre largo | ✅ covered | Heading envuelve en 2 líneas; botones de ancho completo |

Notas de dominio (open probes, resueltas aquí):
- **Offline/optimista:** el SOS se persiste localmente antes de la red (SOS-03). UI honesta: banner "Sin conexión", estados "En cola", nunca "Enviado" sin servidor.
- **Reducir animaciones:** cubierto en Movimiento y accesibilidad.
- **i18n:** solo español (Colombia); sin RTL; strings centralizados en un único módulo `src/i18n/es.ts` (no librería i18n; YAGNI).

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | ninguno (no se inicializa shadcn) | no aplica |
| Terceros | ninguno | no aplica |

Teselas/estilos: OpenFreeMap (público, sin clave), revisado como dependencia de datos, no de código.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: FLAG aceptado (radio 10 del legacy se conserva)
- [x] Dimension 6 Registry Safety: PASS
- [x] Dimension 7 Inventory Provenance: PASS (no aplica: Tool none)

Decisiones confirmadas por Roberto (2026-10-06): tabs solo Inicio y Contactos; acento #E8212B se mantiene (4.48:1 aceptado); SOS deshabilitado sin contactos; mapa OpenFreeMap dark.

**Approval:** approved 2026-10-06
