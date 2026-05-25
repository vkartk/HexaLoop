using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Modules.Analytics.Entities;

public enum ReportScope
{
    Cycles,
    Trainers,
    Sentiment,
}

public enum ReportFormat
{
    Xlsx,
    Csv,
    Pdf,
}

public enum ReportStatus
{
    Queued,
    Running,
    Ready,
    Failed,
}

public enum ReportCycleStatusFilter
{
    Open,
    Closed,
    OverrideClosed,
}

public sealed class Report
{
    public Guid Id { get; set; }
    public Guid RequestedByUserId { get; set; }
    public ReportScope Scope { get; set; }
    public ReportFormat Format { get; set; }
    public ReportStatus Status { get; set; }
    public ReportCycleStatusFilter? CycleStatusFilter { get; set; }
    public DateOnly? DateFrom { get; set; }
    public DateOnly? DateTo { get; set; }
    public string? DownloadUrl { get; set; }
    public int? RowCount { get; set; }
    public DateTimeOffset RequestedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }

    public User? RequestedByUser { get; set; }
}
