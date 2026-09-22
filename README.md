# AlertaYA API

Backend de AlertaYA. .NET 10 · Clean Architecture · PostgreSQL.

## Estructura

```
src/
  AlertaYA.Domain/          entidades y reglas puras — sin dependencias externas
  AlertaYA.Application/     casos de uso, DTOs, interfaces de repositorio
  AlertaYA.Infrastructure/  EF Core + Npgsql, Twilio, implementaciones
  AlertaYA.Api/             endpoints, DI, auth, middleware
tests/
  AlertaYA.Domain.Tests/
```

La direccion de dependencias apunta hacia adentro: `Domain` no referencia nada.

## Requisitos

- .NET SDK 10.0+
- PostgreSQL 16+

## Correr

```bash
dotnet build
dotnet run --project src/AlertaYA.Api
```

## Cliente del frontend

La API publica `openapi.json`; `alertaya-mobile` genera su cliente TypeScript desde ahi.
