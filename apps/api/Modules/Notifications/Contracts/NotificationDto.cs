using HexaLoop.Api.Modules.Notifications.Entities;

namespace HexaLoop.Api.Modules.Notifications.Contracts;

public sealed record NotificationDto(
    Guid Id,
    NotificationChannel Channel,
    string Subject,
    string? Body,
    NotificationStatus Status,
    string Severity,
    Guid? RelatedCycleId,
    string? Href,
    DateTimeOffset CreatedAt,
    DateTimeOffset? SentAt,
    DateTimeOffset? ReadAt)
{
    public static NotificationDto From(Notification n) => new(
        n.Id,
        n.Channel,
        n.Subject,
        n.Body,
        n.Status,
        n.Severity.ToString().ToLowerInvariant(),
        n.RelatedCycleId,
        n.Href,
        n.CreatedAt,
        n.SentAt,
        n.ReadAt);
}

public sealed record NotificationListResponse(
    IReadOnlyList<NotificationDto> Data,
    int UnreadCount);
