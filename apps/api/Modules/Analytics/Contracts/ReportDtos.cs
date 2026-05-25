using HexaLoop.Api.Modules.Analytics.Entities;
using HexaLoop.Api.Modules.Cycles.Entities;

namespace HexaLoop.Api.Modules.Analytics.Contracts;

public sealed record ReportDto(
    Guid Id,
    ReportScope Scope,
    ReportFormat Format,
    ReportStatus Status,
    CycleStatus? CycleStatus,
    DateOnly? DateFrom,
    DateOnly? DateTo,
    string? DownloadUrl,
    int? RowCount,
    DateTimeOffset RequestedAt,
    DateTimeOffset? CompletedAt,
    string RequestedByName);

public sealed record ReportListResponse(IReadOnlyList<ReportDto> Data);

public sealed record ReportRequest(
    ReportScope Scope,
    ReportFormat Format,
    CycleStatus? CycleStatus,
    DateOnly? DateFrom,
    DateOnly? DateTo);
