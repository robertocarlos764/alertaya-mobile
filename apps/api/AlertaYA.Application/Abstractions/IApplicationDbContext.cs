using AlertaYA.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AlertaYA.Application.Abstractions;

/// <summary>
/// Puerto de persistencia que usan los handlers de Application. Lo implementa
/// <c>AppDbContext</c> en Infrastructure; Application no depende del proveedor de BD.
/// </summary>
public interface IApplicationDbContext
{
    DbSet<Profile> Profiles { get; }
    DbSet<EmergencyContact> EmergencyContacts { get; }
    DbSet<Alert> Alerts { get; }
    DbSet<AlertLocation> AlertLocations { get; }
    DbSet<VerificationLog> VerificationLogs { get; }
    DbSet<NotificationDelivery> NotificationDeliveries { get; }
    DbSet<TrackingLink> TrackingLinks { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// True si la excepción viene de una restricción única violada (idempotencia, sección 6).
    /// La detección concreta del motor vive en Infrastructure.
    /// </summary>
    bool EsViolacionDeUnicidad(DbUpdateException ex);
}
