using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Email;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Infrastructure.Time;
using HexaLoop.Api.Modules.Notifications.Entities;

namespace HexaLoop.Api.Background;

/// Drains the queue of Notifications with Status=Queued and channel=Email
/// by handing them to the IEmailSender (Mailpit in dev).
public sealed class NotificationDispatchWorker(
    IServiceScopeFactory scopeFactory,
    IClock clock,
    ILogger<NotificationDispatchWorker> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(30);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await TickAsync(stoppingToken);
            }
            catch (OperationCanceledException) { /* expected */ }
            catch (Exception ex)
            {
                logger.LogError(ex, "NotificationDispatchWorker tick failed");
            }

            try
            {
                await Task.Delay(Interval, stoppingToken);
            }
            catch (OperationCanceledException) { return; }
        }
    }

    private async Task TickAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var email = scope.ServiceProvider.GetRequiredService<IEmailSender>();

        var pending = await db.Notifications
            .Where(n => n.Status == NotificationStatus.Queued && n.Channel == NotificationChannel.Email)
            .OrderBy(n => n.CreatedAt)
            .Take(50)
            .ToListAsync(ct);

        foreach (var n in pending)
        {
            var user = await db.Users.FindAsync(new object?[] { n.UserId }, ct);
            if (user is null || !user.IsActive)
            {
                n.Status = NotificationStatus.Failed;
                continue;
            }

            try
            {
                await email.SendAsync(user.Email, user.FullName, n.Subject, n.Body ?? string.Empty, ct);
                n.Status = NotificationStatus.Sent;
                n.SentAt = clock.UtcNow;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to send notification {NotificationId}", n.Id);
                n.Status = NotificationStatus.Failed;
            }
        }

        if (pending.Count > 0)
        {
            await db.SaveChangesAsync(ct);
        }
    }
}
