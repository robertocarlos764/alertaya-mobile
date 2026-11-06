using System.Text;
using System.Text.Json;
using System.Threading.RateLimiting;
using AlertaYA.Api.Errors;
using AlertaYA.Api.Extensions;
using AlertaYA.Api.OpenApi;
using AlertaYA.Api.Options;
using AlertaYA.Application.Abstractions;
using AlertaYA.Application.Alerts;
using AlertaYA.Application.Options;
using AlertaYA.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// Secreto/issuer/audiencia leídos de configuración (env vars o appsettings de entorno, NUNCA hardcodeados).
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();

builder.Services.AddControllers();

builder.Services.AddProblemDetails(options => options.CustomizeProblemDetails = ctx =>
{
    var codigo = Problemas.CodigoPorEstado(ctx.ProblemDetails.Status);
    if (codigo is not null)
    {
        ctx.ProblemDetails.Extensions.TryAdd("code", codigo);
    }
});
builder.Services.AddExceptionHandler<ManejadorExcepciones>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SupportNonNullableReferenceTypes();
    // Sin allOf, un $ref anulable (ultimaUbicacion) sale sin "nullable" y el cliente TS no admite el null.
    options.UseAllOfToExtendReferenceSchemas();
    options.SchemaFilter<RequeridosNoAnulables>();
});

// EF Core contra PostgreSQL (Supabase). PostGIS via NetTopologySuite para geography(point, 4326).
// Con UseNpgsql(cadena) el plugin NTS no llegaba al data source y escribir un Point en geography fallaba.
// Singleton perezoso: el host arranca sin cadena (pruebas de humo).
builder.Services.AddSingleton(_ =>
{
    var dataSourceBuilder = new NpgsqlDataSourceBuilder(builder.Configuration.GetConnectionString("Default"));
    dataSourceBuilder.UseNetTopologySuite();
    return dataSourceBuilder.Build();
});
builder.Services.AddDbContext<AppDbContext>((sp, options) =>
    options.UseNpgsql(sp.GetRequiredService<NpgsqlDataSource>(), npgsql => npgsql.UseNetTopologySuite()));

// Puerto de persistencia de Application: misma instancia scoped que AppDbContext.
builder.Services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<AppDbContext>());

// GET /health anónimo: responde "Healthy" sin detalles y sin tocar la BD.
builder.Services.AddHealthChecks();

// Opciones fuertemente tipadas.
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<PublicOptions>(builder.Configuration.GetSection(PublicOptions.Seccion));
builder.Services.AddSingleton(TimeProvider.System);

// Autenticación JWT emitido por Supabase Auth (sección 2): el backend valida el token en cada request.
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var validaciones = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            // El token de Supabase usa aud = "authenticated".
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        };

        // Los proyectos de Supabase nuevos (desde mayo 2025) firman los JWT de usuario con claves
        // asimétricas (RS256/ES256). Si está configurado Jwt:Authority, JwtBearer descarga la metadata
        // OIDC y las claves públicas (JWKS) de https://<ref>.supabase.co/auth/v1/.well-known/jwks.json
        // y valida la firma sin necesidad de guardar secretos. Esto también permite rotar/revocar claves
        // sin redeployar el backend.
        if (!string.IsNullOrEmpty(jwt.Authority))
        {
            options.Authority = jwt.Authority;
            options.MetadataAddress = $"{jwt.Authority.TrimEnd('/')}/.well-known/openid-configuration";
        }

        // Soporte legacy: proyectos antiguos firmaban en HS256 con el JWT Secret. Se conserva por
        // compatibilidad; se refuerza la firma apenas la clave esté configurada.
        if (!string.IsNullOrEmpty(jwt.SigningKey))
        {
            validaciones.ValidateIssuerSigningKey = true;
            validaciones.IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey));
        }

        options.TokenValidationParameters = validaciones;
    });
builder.Services.AddAuthorization();

// Pitfall 18: tope por usuario contra el abuso del canal SMS. Particion por "sub", nunca por IP.
var alertasPorHora = builder.Configuration.GetValue("RateLimits:CrearAlertaPorHora", 10);
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("crear-alerta", http => RateLimitPartition.GetFixedWindowLimiter(
        http.User.GetUserId()?.ToString() ?? string.Empty,
        _ => new FixedWindowRateLimiterOptions { PermitLimit = alertasPorHora, Window = TimeSpan.FromHours(1) }));
    options.OnRejected = async (ctx, ct) =>
    {
        if (ctx.Lease.TryGetMetadata(MetadataName.RetryAfter, out var espera))
        {
            ctx.HttpContext.Response.Headers.RetryAfter = ((int)espera.TotalSeconds).ToString();
        }

        ctx.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        var problema = Problemas.Crear(
            StatusCodes.Status429TooManyRequests,
            Problemas.CodigoRateLimited,
            "Activaste demasiadas alertas en poco tiempo. Si es una emergencia, llama al 123.");
        await ctx.HttpContext.Response.WriteAsJsonAsync(problema, (JsonSerializerOptions?)null, "application/problem+json", ct);
    };
});

builder.Services.AddScoped<CreateAlertHandler>();
builder.Services.AddScoped<GetAlertStatusHandler>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapHealthChecks("/health");
app.MapControllers();

app.Run();

// Expuesto para WebApplicationFactory<Program> en las pruebas de integración.
public partial class Program;
