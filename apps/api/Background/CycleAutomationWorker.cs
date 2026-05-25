using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Ids;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Infrastructure.Time;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Sessions.Entities;

namespace HexaLoop.Api.Background;

/// Opens FeedbackCycles on the two configured triggers:
///   - TrainingCompletion: session has Status=Completed and is missing its MaverickPostTraining cycle.
///   - Post3MonthProject: session.EndDate is at least 90 days in the past and is missing its SupervisorEffectiveness cycle.
public sealed class CycleAutomationWorker(
    IServiceScopeFactory scopeFactory,
    IClock clock,
    ILogger<CycleAutomationWorker> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

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
                logger.LogError(ex, "CycleAutomationWorker tick failed");
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
        var now = clock.UtcNow;

        var completedSessions = await db.Sessions
            .Where(s => s.Status == SessionStatus.Completed)
            .ToListAsync(ct);

        var opened = 0;

        foreach (var s in completedSessions)
        {
            var hasPostTraining = await db.FeedbackCycles
                .AnyAsync(c => c.SessionId == s.Id && c.Type == CycleType.MaverickPostTraining, ct);
            if (!hasPostTraining)
            {
                db.FeedbackCycles.Add(new FeedbackCycle
                {
                    Id = UuidV7.New(),
                    SessionId = s.Id,
                    Type = CycleType.MaverickPostTraining,
                    Threshold = 0.78,
                    Status = CycleStatus.Open,
                    OpensAt = s.EndDate.AddHours(1) > now ? now : s.EndDate.AddHours(1),
                    TriggerBasis = TriggerBasis.TrainingCompletion,
                    CreatedAt = now,
                });
                opened++;
            }

            if (s.EndDate.AddDays(90) <= now)
            {
                var hasEffectiveness = await db.FeedbackCycles
                    .AnyAsync(c => c.SessionId == s.Id && c.Type == CycleType.SupervisorEffectiveness, ct);
                if (!hasEffectiveness)
                {
                    db.FeedbackCycles.Add(new FeedbackCycle
                    {
                        Id = UuidV7.New(),
                        SessionId = s.Id,
                        Type = CycleType.SupervisorEffectiveness,
                        Threshold = 0.78,
                        Status = CycleStatus.Open,
                        OpensAt = s.EndDate.AddDays(90),
                        TriggerBasis = TriggerBasis.Post3MonthProject,
                        CreatedAt = now,
                    });
                    opened++;
                }
            }
        }

        if (opened > 0)
        {
            await db.SaveChangesAsync(ct);
            logger.LogInformation("CycleAutomationWorker opened {Count} cycle(s).", opened);
        }
    }
}
