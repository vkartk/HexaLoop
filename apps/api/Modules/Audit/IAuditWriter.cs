using System.Text.Json;
using HexaLoop.Api.Infrastructure.Ids;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Infrastructure.Time;
using HexaLoop.Api.Modules.Audit.Entities;

namespace HexaLoop.Api.Modules.Audit;

public interface IAuditWriter
{
    Task WriteAsync(
        Guid actorId,
        string action,
        string entityType,
        string entityId,
        object? metadata = null,
        CancellationToken ct = default);
}

public sealed class AuditWriter(AppDbContext db, IClock clock) : IAuditWriter
{
    public async Task WriteAsync(
        Guid actorId,
        string action,
        string entityType,
        string entityId,
        object? metadata = null,
        CancellationToken ct = default)
    {
        db.AuditLogs.Add(new AuditLog
        {
            Id = UuidV7.New(),
            ActorId = actorId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            MetadataJson = metadata is null
                ? "{}"
                : JsonSerializer.Serialize(metadata, JsonSerializerOptions.Default),
            CreatedAt = clock.UtcNow,
        });
        await db.SaveChangesAsync(ct);
    }
}
