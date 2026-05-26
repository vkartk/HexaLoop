using MediatR;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Errors;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Infrastructure.Time;
using HexaLoop.Api.Modules.Ai;
using HexaLoop.Api.Modules.Ai.Contracts;
using HexaLoop.Api.Modules.Analytics.Contracts;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Cycles.Services;
using HexaLoop.Api.Modules.Feedback.Entities;
using HexaLoop.Api.Modules.Trainers.Contracts;
using HexaLoop.Api.Modules.Trainers.Services;

namespace HexaLoop.Api.Modules.Trainers.Queries;

public sealed record GetTrainerScorecardQuery(Guid TrainerId) : IRequest<TrainerScorecard>;

public sealed class GetTrainerScorecardQueryHandler(
    AppDbContext db,
    IAiService ai,
    IClock clock) : IRequestHandler<GetTrainerScorecardQuery, TrainerScorecard>
{
    private const int RecentCycleLimit = 6;

    public async Task<TrainerScorecard> Handle(GetTrainerScorecardQuery request, CancellationToken ct)
    {
        var trainer = await db.Trainers
            .AsNoTracking()
            .SingleOrDefaultAsync(t => t.Id == request.TrainerId, ct)
            ?? throw new NotFoundException("Trainer", request.TrainerId);

        var agg = await TrainerStats.ComputeAsync(db, trainer.Id, ct);
        var listRow = TrainerStats.ToListRow(trainer, agg);

        var lifetime = new TrainerLifetime(
            agg.Sessions,
            agg.SubmittedResponses,
            agg.AvgRating,
            listRow.CompletionRate);

        var cycles = await db.FeedbackCycles
            .AsNoTracking()
            .Include(c => c.Session).ThenInclude(s => s!.Course)
            .Where(c => c.Type == CycleType.MaverickPostTraining
                && c.Session != null && c.Session.TrainerId == trainer.Id)
            .OrderByDescending(c => c.OpensAt)
            .Take(RecentCycleLimit)
            .ToListAsync(ct);

        var recentCycles = new List<TrainerScorecardCycle>(cycles.Count);
        foreach (var c in cycles)
        {
            var (expected, responses) = await CycleProjection.CountsAsync(db, c, ct);
            var completion = expected == 0 ? 0 : Math.Round(responses / (double)expected, 4);

            var ratings = await db.FeedbackResponses
                .AsNoTracking()
                .Where(r => r.CycleId == c.Id
                    && r.Status == FeedbackResponseStatus.Submitted
                    && r.OverallRating != null)
                .Select(r => (double)r.OverallRating!.Value)
                .ToListAsync(ct);

            double? avg = ratings.Count == 0 ? null : Math.Round(ratings.Average(), 2);

            recentCycles.Add(new TrainerScorecardCycle(
                c.Id,
                c.Session?.Course?.Name ?? "(unknown)",
                completion,
                avg,
                c.Status,
                c.ClosedAt));
        }

        var allResponses = await db.FeedbackResponses
            .AsNoTracking()
            .Where(r => r.Status == FeedbackResponseStatus.Submitted
                && db.FeedbackCycles.Any(c => c.Id == r.CycleId
                    && c.Session != null && c.Session.TrainerId == trainer.Id))
            .ToListAsync(ct);

        var insight = await ai.GenerateInsightsAsync(trainer.Id, allResponses, ct);
        var badge = new AiBadge(true, insight.Degraded, clock.UtcNow, allResponses.Count);
        var sentiment = new SentimentBreakdown(
            insight.SentimentPositive,
            insight.SentimentNeutral,
            insight.SentimentNegative,
            badge);

        return new TrainerScorecard(listRow, lifetime, recentCycles, sentiment);
    }
}
