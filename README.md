# AlertaYA Mobile

App movil de AlertaYA. Expo · React Native · TypeScript.

Consume `alertaya-api`. El cliente HTTP se genera desde el `openapi.json` que publica la API.

## Estructura objetivo

```
src/
  domain/        entidades y casos de uso en TS puro — sin React, sin fetch
  data/          cliente generado de OpenAPI + implementacion de repositorios
  presentation/  pantallas (expo-router), componentes, hooks
```

## Requisitos

- Node 20.19+
- Expo Go, o un dev build

## Correr

```bash
npm install
npx expo start
```

## Nota de seguridad

`npm audit` reporta 10 vulnerabilidades moderadas transitivas de la plantilla oficial
de Expo. `npm audit fix` no las resuelve sin cambios rompedores; Expo fija esas
versiones deliberadamente. Revisar al actualizar el SDK de Expo.
