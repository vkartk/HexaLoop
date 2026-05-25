using MediatR;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Auth;
using HexaLoop.Api.Infrastructure.Errors;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Infrastructure.Time;
using HexaLoop.Api.Modules.Notifications.Contracts;
using HexaLoop.Api.Modules.Notifications.Entities;

namespace HexaLoop.Api.Modules.Notifications.Commands;

public sealed record MarkNotificationReadCommand(Guid NotificationId) : IRequest<NotificationDto>;

public sealed class MarkNotificationReadCommandHandler(
    AppDbContext db,
    ICurrentUser current,
    IClock clock) : IRequestHandler<MarkNotificationReadCommand, NotificationDto>
{
    public async Task<NotificationDto> Handle(MarkNotificationReadCommand request, CancellationToken ct)
    {
        var userId = current.RequireId();
        var entity = await db.Notifications
            .SingleOrDefaultAsync(n => n.Id == request.NotificationId && n.UserId == userId, ct)
            ?? throw new NotFoundException("Notification", request.NotificationId);

        if (entity.Status != NotificationStatus.Read)
        {
            entity.Status = NotificationStatus.Read;
            entity.ReadAt = clock.UtcNow;
            await db.SaveChangesAsync(ct);
        }

        return NotificationDto.From(entity);
    }
}
