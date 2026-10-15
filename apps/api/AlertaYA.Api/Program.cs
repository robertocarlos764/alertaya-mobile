using System.Text;
using AlertaYA.Api.Options;
using AlertaYA.Api.Services;
using AlertaYA.Api.Services.Abstractions;
using AlertaYA.Api.Services.Background;
using AlertaYA.Application.Abstractions;
using AlertaYA.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Secreto/issuer/audiencia leídos de configuración (env vars o appsettings de entorno, NUNCA hardcodeados).
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// EF Core contra PostgreSQL (Supabase). PostGIS via NetTopologySuite para geography(point, 4326).
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("Default");
    options.UseNpgsql(connectionString, npgsql => npgsql.UseNetTopologySuite());
});

// Puerto de persistencia de Application: misma instancia scoped que AppDbContext.
builder.Services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<AppDbContext>());

// GET /health anónimo: responde "Healthy" sin detalles y sin tocar la BD.
builder.Services.AddHealthChecks();

// Opciones fuertemente tipadas.
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<SmsFallbackOptions>(builder.Configuration.GetSection("SmsFallback"));

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

// Procesamiento asíncrono (sección 7): cola en memoria + workers en background.
builder.Services.AddSingleton<IAlertEventQueue, AlertEventQueue>();
builder.Services.AddScoped<IVerificationService, VerificationService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ISmsFallbackAuthService, SmsFallbackAuthService>();
builder.Services.AddHostedService<VerificationWorker>();
builder.Services.AddHostedService<NotificationWorker>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapControllers();

app.Run();

// Expuesto para WebApplicationFactory<Program> en las pruebas de integración.
public partial class Program;
