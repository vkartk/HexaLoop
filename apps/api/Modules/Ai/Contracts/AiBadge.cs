namespace HexaLoop.Api.Modules.Ai.Contracts;

public sealed record AiBadge(
    bool AiGenerated,
    bool Degraded,
    DateTimeOffset? GeneratedAt = null,
    int? SourceCount = null);
