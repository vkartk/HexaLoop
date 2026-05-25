using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Ids;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Infrastructure.Time;
using HexaLoop.Api.Modules.Ai;
using HexaLoop.Api.Modules.Ai.Contracts;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Enrollments.Entities;
using HexaLoop.Api.Modules.Feedback.Entities;
using HexaLoop.Api.Modules.Notifications.Entities;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Background;

/// Sends reminder notifications to Mavericks with outstanding feedback drafts.
/// Throttled by `_minReminderGap`. After `MaxRemindersBeforeEscalation` reminders, also CCs the manager.
public sealed class ReminderWorker(
    IServiceScopeFactory scopeFactory,
    IClock clock,
    ILogger<ReminderWorker> logger) : BackgroundService
{
    private const int MaxRemindersBeforeEscalation = 3;
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan MinReminderGap = TimeSpan.FromHours(20);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await TickAsync(stoppingToken);
            }
            catch (OperationCanceledException) { /* expected on shutdown */ }
            catch (Exception ex)
            {
                logger.LogError(ex, "ReminderWorker tick failed");
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
        var ai = scope.ServiceProvider.GetRequiredService<IAiService>();
        var now = clock.UtcNow;

        // Open MaverickPostTraining cycles where the maverick is enrolled+completed but not yet submitted.
        var openCycles = await db.FeedbackCycles
            .Where(c => c.Status == CycleStatus.Open && c.Type == CycleType.MaverickPostTraining)
            .Include(c => c.Session)
            .ToListAsync(ct);

        var queued = 0;

        foreach (var cycle in openCycles)
        {
            var dueAt = (cycle.Session?.EndDate ?? cycle.OpensAt).AddDays(7);
            if (now > dueAt + TimeSpan.FromDays(7)) continue; // skip very stale cycles

            var attendees = await db.Enrollments
                .Where(e => e.SessionId == cycle.SessionId && e.Status == EnrollmentStatus.Completed)
                .Join(db.Users, e => e.MaverickId, u => u.Id, (e, u) => u)
                .Where(u => u.IsActive)
                .ToListAsync(ct);

            foreach (var maverick in attendees)
            {
                var responseSubmitted = await db.FeedbackResponses.AnyAsync(
                    r => r.CycleId == cycle.Id
                        && r.MaverickId == maverick.Id
                        && r.Status == FeedbackResponseStatus.Submitted, ct);
                if (responseSubmitted) continue;

                var existingReminders = await db.Notifications
                    .Where(n => n.UserId == maverick.Id
                        && n.RelatedCycleId == cycle.Id
                        && n.Subject.StartsWith("Reminder:"))
                    .OrderByDescending(n => n.CreatedAt)
                    .ToListAsync(ct);

                var lastSentAt = existingReminders.FirstOrDefault()?.CreatedAt;
                if (lastSentAt is { } sentAt && now - sentAt < MinReminderGap)
                {
                    continue;
                }

                var courseName = cycle.Session?.Course?.Name ?? "your training";
                var nudge = await ai.PersonalizeNudgeAsync(new NudgeContext(
                    maverick.Id, maverick.FullName, courseName, cycle.Session?.Trainer?.Name, dueAt), ct);

                db.Notifications.Add(new Notification
                {
                    Id = UuidV7.New(),
                    UserId = maverick.Id,
                    Channel = NotificationChannel.Email,
                    Subject = nudge.Subject,
                    Body = nudge.Body,
                    Status = NotificationStatus.Queued,
                    Severity = NotificationSeverity.Info,
                    RelatedCycleId = cycle.Id,
                    Href = "/feedback/" + cycle.Id,
                    CreatedAt = now,
                });
                queued++;

                // Escalation: after N reminders, notify the manager too.
                if (existingReminders.Count + 1 >= MaxRemindersBeforeEscalation && maverick.ManagerId is { } mgrId)
                {
                    var alreadyEscalated = await db.Notifications.AnyAsync(
                        n => n.UserId == mgrId
                            && n.RelatedCycleId == cycle.Id
                            && n.Subject.StartsWith("Escalation:"), ct);
                    if (!alreadyEscalated)
                    {
                        db.Notifications.Add(new Notification
                        {
                            Id = UuidV7.New(),
                            UserId = mgrId,
                            Channel = NotificationChannel.Email,
                            Subject = $"Escalation: {maverick.FullName} has not completed feedback",
                            Body = $"{maverick.FullName} has missed {MaxRemindersBeforeEscalation} reminders for \"{courseName}\". Please follow up.",
                            Status = NotificationStatus.Queued,
                            Severity = NotificationSeverity.Warn,
                            RelatedCycleId = cycle.Id,
                            Href = "/admin/cycles/" + cycle.Id,
                            CreatedAt = now,
                        });
                        queued++;
                    }
                }
            }
        }

        if (queued > 0)
        {
            await db.SaveChangesAsync(ct);
            logger.LogInformation("ReminderWorker queued {Count} reminder(s).", queued);
        }
    }
}
