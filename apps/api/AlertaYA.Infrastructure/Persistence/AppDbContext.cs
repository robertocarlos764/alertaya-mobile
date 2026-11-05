using AlertaYA.Application.Abstractions;
using AlertaYA.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace AlertaYA.Infrastructure.Persistence;

/// <summary>
/// Mapea las tablas EXISTENTES de Supabase (sección 4 de la especificación).
/// El esquema lo manda <c>supabase/migrations</c> (SQL versionado): EF Core no genera ni
/// aplica migraciones aquí (la BD no tiene <c>__EFMigrationsHistory</c>). Eso incluye la
/// columna <c>client_generated_id</c> de <c>alerts</c> para la idempotencia de la sección 6.
/// </summary>
public class AppDbContext : DbContext, IApplicationDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<EmergencyContact> EmergencyContacts => Set<EmergencyContact>();
    public DbSet<Alert> Alerts => Set<Alert>();
    public DbSet<AlertLocation> AlertLocations => Set<AlertLocation>();
    public DbSet<VerificationLog> VerificationLogs => Set<VerificationLog>();
    public DbSet<NotificationDelivery> NotificationDeliveries => Set<NotificationDelivery>();
    public DbSet<TrackingLink> TrackingLinks => Set<TrackingLink>();

    /// <summary>SqlState 23505 = unique_violation de PostgreSQL.</summary>
    public bool EsViolacionDeUnicidad(DbUpdateException ex)
        => ex.InnerException is PostgresException pg && pg.SqlState == PostgresErrorCodes.UniqueViolation;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Profile>(e =>
        {
            e.ToTable("profiles");
            e.HasKey(p => p.Id);
            e.Property(p => p.Id).HasColumnName("id");
            e.Property(p => p.Nombre).HasColumnName("nombre").IsRequired();
            e.Property(p => p.Telefono).HasColumnName("telefono").IsRequired();
            e.Property(p => p.Correo).HasColumnName("correo");
            e.Property(p => p.PalabraClave).HasColumnName("palabra_clave");
            e.Property(p => p.VentanaConfirmacionSegundos).HasColumnName("ventana_confirmacion_segundos");
            e.Property(p => p.ModoSilencioso).HasColumnName("modo_silencioso");
            e.Property(p => p.CreadoEn).HasColumnName("creado_en");
        });

        modelBuilder.Entity<EmergencyContact>(e =>
        {
            e.ToTable("emergency_contacts");
            e.HasKey(c => c.Id);
            e.Property(c => c.Id).HasColumnName("id");
            e.Property(c => c.UserId).HasColumnName("user_id").IsRequired();
            e.Property(c => c.Nombre).HasColumnName("nombre").IsRequired();
            e.Property(c => c.Telefono).HasColumnName("telefono").IsRequired();
            e.Property(c => c.Relacion).HasColumnName("relacion");
            e.Property(c => c.CreadoEn).HasColumnName("creado_en");

            e.HasIndex(c => c.UserId);
            // La FK apunta a profiles.id, que es el mismo id que auth.users.id.
            e.HasOne<Profile>()
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .HasPrincipalKey(p => p.Id);
        });

        modelBuilder.Entity<Alert>(e =>
        {
            e.ToTable("alerts");
            e.HasKey(a => a.Id);
            e.Property(a => a.Id).HasColumnName("id");
            e.Property(a => a.UserId).HasColumnName("user_id").IsRequired();
            e.Property(a => a.Estado).HasColumnName("estado").IsRequired();
            e.Property(a => a.CanalActivacion).HasColumnName("canal_activacion").IsRequired();
            e.Property(a => a.NivelPrioridadIa).HasColumnName("nivel_prioridad_ia");
            e.Property(a => a.Ubicacion)
                .HasColumnName("ubicacion")
                .HasColumnType("geography (point, 4326)");
            e.Property(a => a.UbicacionPrecisionMetros)
                .HasColumnName("ubicacion_precision_metros")
                .HasColumnType("numeric");
            e.Property(a => a.UbicacionFuente).HasColumnName("ubicacion_fuente");
            e.Property(a => a.CreadoEn).HasColumnName("creado_en");
            e.Property(a => a.ActualizadoEn).HasColumnName("actualizado_en");
            // Columna de idempotencia (sección 6): UUID generado por el cliente.
            e.Property(a => a.ClientGeneratedId).HasColumnName("client_generated_id");
            e.Property(a => a.FinalizadaEn).HasColumnName("finalizada_en");

            e.HasIndex(a => a.UserId);
            // Índice único por usuario: evita alertas duplicadas ante reintentos del cliente
            // (nulls múltiples permitidos en Postgres para alerts sin clientGeneratedId).
            e.HasIndex(a => new { a.UserId, a.ClientGeneratedId })
                .IsUnique()
                .HasDatabaseName("IX_alerts_user_id_client_generated_id");
        });

        modelBuilder.Entity<AlertLocation>(e =>
        {
            e.ToTable("alert_locations");
            e.HasKey(l => l.Id);
            e.Property(l => l.Id).HasColumnName("id");
            e.Property(l => l.AlertId).HasColumnName("alert_id").IsRequired();
            e.Property(l => l.Ubicacion)
                .HasColumnName("ubicacion")
                .HasColumnType("geography (point, 4326)")
                .IsRequired();
            e.Property(l => l.PrecisionMetros)
                .HasColumnName("precision_metros")
                .HasColumnType("numeric");
            e.Property(l => l.Fuente).HasColumnName("fuente").IsRequired();
            e.Property(l => l.CreadoEn).HasColumnName("creado_en");

            e.HasIndex(l => l.AlertId);
            e.HasOne<Alert>()
                .WithMany()
                .HasForeignKey(l => l.AlertId)
                .HasPrincipalKey(a => a.Id);
        });

        modelBuilder.Entity<VerificationLog>(e =>
        {
            e.ToTable("verification_logs");
            e.HasKey(v => v.Id);
            e.Property(v => v.Id).HasColumnName("id");
            e.Property(v => v.AlertId).HasColumnName("alert_id").IsRequired();
            e.Property(v => v.MovimientoScore)
                .HasColumnName("movimiento_score")
                .HasColumnType("numeric");
            e.Property(v => v.AudioAmbienteScore)
                .HasColumnName("audio_ambiente_score")
                .HasColumnType("numeric");
            e.Property(v => v.ConsistenciaUbicacion).HasColumnName("consistencia_ubicacion");
            e.Property(v => v.HoraDelDia).HasColumnName("hora_del_dia");
            e.Property(v => v.NivelAsignado).HasColumnName("nivel_asignado");
            e.Property(v => v.CreadoEn).HasColumnName("creado_en");

            e.HasIndex(v => v.AlertId);
            e.HasOne<Alert>()
                .WithMany()
                .HasForeignKey(v => v.AlertId)
                .HasPrincipalKey(a => a.Id);
        });

        modelBuilder.Entity<TrackingLink>(e =>
        {
            e.ToTable("tracking_links");
            e.HasKey(t => t.Id);
            e.Property(t => t.Id).HasColumnName("id");
            e.Property(t => t.AlertId).HasColumnName("alert_id").IsRequired();
            e.Property(t => t.TokenHash).HasColumnName("token_hash").IsRequired();
            e.Property(t => t.RevocadoEn).HasColumnName("revocado_en");
            e.Property(t => t.CreadoEn).HasColumnName("creado_en");

            e.HasIndex(t => t.AlertId).IsUnique();
            e.HasIndex(t => t.TokenHash).IsUnique();
            e.HasOne<Alert>()
                .WithMany()
                .HasForeignKey(t => t.AlertId)
                .HasPrincipalKey(a => a.Id)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<NotificationDelivery>(e =>
        {
            e.ToTable("notification_deliveries");
            e.HasKey(d => d.Id);
            e.Property(d => d.Id).HasColumnName("id");
            e.Property(d => d.AlertId).HasColumnName("alert_id").IsRequired();
            e.Property(d => d.ContactId).HasColumnName("contact_id");
            e.Property(d => d.Canal).HasColumnName("canal").IsRequired();
            e.Property(d => d.Tipo).HasColumnName("tipo").IsRequired();
            e.Property(d => d.Estado).HasColumnName("estado").IsRequired();
            e.Property(d => d.ContactoNombre).HasColumnName("contacto_nombre").IsRequired();
            e.Property(d => d.ContactoTelefono).HasColumnName("contacto_telefono").IsRequired();
            e.Property(d => d.Intentos).HasColumnName("intentos");
            e.Property(d => d.ProximoIntentoEn).HasColumnName("proximo_intento_en");
            e.Property(d => d.LeaseHasta).HasColumnName("lease_hasta");
            e.Property(d => d.ProveedorSid).HasColumnName("proveedor_sid");
            e.Property(d => d.CodigoError).HasColumnName("codigo_error");
            e.Property(d => d.CreadoEn).HasColumnName("creado_en");
            e.Property(d => d.ActualizadoEn).HasColumnName("actualizado_en");

            e.HasIndex(d => new { d.AlertId, d.ContactId, d.Canal, d.Tipo })
                .IsUnique()
                .HasDatabaseName("notification_deliveries_unica_por_contacto");
            e.HasIndex(d => d.ProveedorSid).IsUnique();
            e.HasOne<Alert>()
                .WithMany()
                .HasForeignKey(d => d.AlertId)
                .HasPrincipalKey(a => a.Id)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne<EmergencyContact>()
                .WithMany()
                .HasForeignKey(d => d.ContactId)
                .HasPrincipalKey(c => c.Id)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
