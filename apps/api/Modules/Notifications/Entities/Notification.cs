using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Modules.Notifications.Entities;

public enum NotificationChannel
{
    Email,
    SMS,
    Portal,
}

public enum NotificationStatus
{
    Queued,
    Sent,
    Failed,
    Read,
}

public enum NotificationSeverity
{
    Info,
    Warn,
    Alert,
}

public sealed class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public NotificationChannel Channel { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string? Body { get; set; }
    public NotificationStatus Status { get; set; } = NotificationStatus.Queued;
    public NotificationSeverity Severity { get; set; } = NotificationSeverity.Info;
    public Guid? RelatedCycleId { get; set; }
    public string? Href { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? SentAt { get; set; }
    public DateTimeOffset? ReadAt { get; set; }

    public User? User { get; set; }
    public FeedbackCycle? RelatedCycle { get; set; }
}
