using HexaLoop.Api.Modules.Cycles.Entities;

namespace HexaLoop.Api.Modules.Cycles.Contracts;

public sealed record CycleDto(
    Guid Id,
    Guid SessionId,
    string CourseName,
    string? TrainerName,
    CycleType Type,
    CycleStatus Status,
    double Threshold,
    DateTimeOffset OpensAt,
    DateTimeOffset? ClosesAt,
    int ExpectedCount,
    int ResponseCount,
    double CompletionRate,
    TriggerBasis TriggerBasis,
    DateTimeOffset? ClosedAt,
    string? ClosedByName,
    string? OverrideReason);

public sealed record CyclePage(
    IReadOnlyList<CycleDto> Data,
    int Page,
    int PageSize,
    int Total);

public sealed record OverrideCloseRequest(string Reason);
