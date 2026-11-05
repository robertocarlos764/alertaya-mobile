using System.Text;
using AlertaYA.Api.Errors;
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
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

builder.Services.AddScoped<CreateAlertHandler>();

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
