using MediatR;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Auth;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Modules.Notifications.Contracts;
using HexaLoop.Api.Modules.Notifications.Entities;

namespace HexaLoop.Api.Modules.Notifications.Queries;

public sealed record ListNotificationsQuery(bool UnreadOnly) : IRequest<NotificationListResponse>;

public sealed class ListNotificationsQueryHandler(AppDbContext db, ICurrentUser current)
    : IRequestHandler<ListNotificationsQuery, NotificationListResponse>
{
    public async Task<NotificationListResponse> Handle(ListNotificationsQuery request, CancellationToken ct)
    {
        var userId = current.RequireId();

        var query = db.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId);

        var rows = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(200)
            .ToListAsync(ct);

        var filtered = request.UnreadOnly
            ? rows.Where(n => n.Status != NotificationStatus.Read).ToList()
            : rows;

        var unreadCount = rows.Count(n => n.Status != NotificationStatus.Read);

        return new NotificationListResponse(
            filtered.Select(NotificationDto.From).ToList(),
            unreadCount);
    }
}
