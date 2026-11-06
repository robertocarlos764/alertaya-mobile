---
last_mapped_commit: e508685e1915fdaca9091011aa6fc7a60807bc93
last_mapped_at: 2026-09-28
---
# Technology Stack

**Analysis Date:** 2026-09-28

## Languages

**Primary:**

- TypeScript ~6.0.3 - Mobile frontend (Expo/React Native)
- C# - Backend API (.NET 8.0)

**Secondary:**

- JavaScript - Runtime (Node.js)

## Runtime

**Environment:**

- Node.js + npm (mobile app development and deployment)
- .NET 8.0 (ASP.NET Core API runtime)

**Package Manager:**

- npm v9+ (mobile: `package-lock.json` lockfileVersion 3)
- NuGet (API dependencies managed via `.csproj`)

## Frameworks

**Mobile:**

- Expo ~57.0.24 - Build and deployment platform for React Native
- React 19.2.3 - UI library
- React Native 0.86.3 - Cross-platform mobile framework
- expo-status-bar ~57.0.1 - Status bar component

**Backend:**

- ASP.NET Core 8.0 - Web API framework
- Entity Framework Core 8.x - ORM
- Npgsql.EntityFrameworkCore.PostgreSQL 8.x - PostgreSQL provider
- Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite 8.x - Spatial/GIS support

**API Documentation:**

- Swashbuckle.AspNetCore 6.6.2 - Swagger/OpenAPI documentation

## Key Dependencies

**Critical - Mobile:**

- `expo` ~57.0.24 - Expo SDK, includes core native modules
- `react` 19.2.3 - Core UI framework
- `react-native` 0.86.3 - Native module bridge

**Critical - API:**

- `Microsoft.AspNetCore.Authentication.JwtBearer` 8.x - JWT authentication
- `Npgsql.EntityFrameworkCore.PostgreSQL` 8.x - Database access layer
- `Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite` 8.x - PostGIS integration for geographic queries

**Infrastructure:**

- `Microsoft.EntityFrameworkCore.Design` 8.x - Migrations and tooling (design-time only)

## Configuration

**Environment:**

- Mobile: `app.json` - Expo configuration (icon, orientation, Android/iOS settings)
- API: `appsettings.json` / `appsettings.{Environment}.json` (not committed to git)
- API: Environment variables prefixed with `ConnectionStrings__`, `Jwt__`, `SmsFallback__` can override config
- Both: `.env` and `.env*.local` files excluded from git

**Build:**

- Mobile: `tsconfig.json` extends `expo/tsconfig.base`, enables strict mode
- API: `.csproj` targets net8.0, enables nullable reference types, implicit usings

**Key Configuration Areas:**

- `Jwt.Authority` - Supabase Auth OIDC endpoint (e.g., `https://<project-ref>.supabase.co/auth/v1`)
- `Jwt.Issuer` - Token issuer (Supabase Auth)
- `Jwt.Audience` - Token audience (default: `authenticated`)
- `Jwt.SigningKey` - Legacy HS256 key (only if project uses legacy JWT signing, not needed for new asymmetric signing)
- `ConnectionStrings.Default` - PostgreSQL connection string (Supabase instance)
- `SmsFallback.Secret` - Shared secret for SMS fallback auth hashing
- `SmsFallback.MaxAgeSeconds` - Token expiration for SMS fallback (default: 300s)

## Platform Requirements

**Development - Mobile:**

- Node.js (npm v9+)
- Expo CLI: `npx expo` commands
- Development build or Expo Go for testing
- iOS: Xcode (for native builds via EAS), or develop via Expo Go
- Android: Android SDK (for native builds via EAS), or develop via Expo Go

**Development - API:**

- .NET 8.0 SDK
- PostgreSQL client (psql or similar for schema inspection)

**Production - Mobile:**

- EAS (Expo Application Services) for builds and over-the-air updates
- Apple Developer account (iOS App Store submission)
- Google Play Developer account (Android)

**Production - API:**

- .NET 8.0 runtime
- PostgreSQL 14+ (Supabase managed)
- Network access to Supabase Auth endpoints for JWT validation

---

*Stack analysis: 2026-09-28*
