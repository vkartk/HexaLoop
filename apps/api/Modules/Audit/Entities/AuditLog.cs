using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Modules.Audit.Entities;

public sealed class AuditLog
{
    public Guid Id { get; set; }
    public Guid ActorId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string MetadataJson { get; set; } = "{}";
    public DateTimeOffset CreatedAt { get; set; }

    public User? Actor { get; set; }
}
