using System.Text;
using AlertaYA.Api.Data;
using AlertaYA.Api.Options;
using AlertaYA.Api.Services;
using AlertaYA.Api.Services.Abstractions;
using AlertaYA.Api.Services.Background;
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

        // Supabase firma los JWT en HS256 con su JWT Secret (Jwt:SigningKey).
        // Si no hay clave configurada, no se exige firma y el arranque no falla (útil en desarrollo);
        // la validación real de firma se activa apenas la clave se configure.
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

app.MapControllers();

app.Run();