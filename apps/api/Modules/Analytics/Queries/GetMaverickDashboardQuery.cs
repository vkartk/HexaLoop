using MediatR;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Auth;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Modules.Analytics.Contracts;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Feedback.Entities;

namespace HexaLoop.Api.Modules.Analytics.Queries;

public sealed record GetMaverickDashboardQuery : IRequest<MaverickDashboard>;

public sealed class GetMaverickDashboardQueryHandler(AppDbContext db, ICurrentUser current)
    : IRequestHandler<GetMaverickDashboardQuery, MaverickDashboard>
{
    public async Task<MaverickDashboard> Handle(GetMaverickDashboardQuery request, CancellationToken ct)
    {
        var userId = current.RequireId();

        // Cycles linked to sessions this maverick attended.
        var cycles = await db.FeedbackCycles
            .AsNoTracking()
            .Where(c => c.Type == CycleType.MaverickPostTraining
                && db.Enrollments.Any(e => e.SessionId == c.SessionId && e.MaverickId == userId))
            .Include(c => c.Session).ThenInclude(s => s!.Course)
            .Include(c => c.Session).ThenInclude(s => s!.Trainer)
            .ToListAsync(ct);

        var cycleIds = cycles.Select(c => c.Id).ToList();
        var ownResponses = await db.FeedbackResponses
            .AsNoTracking()
            .Where(r => r.MaverickId == userId && cycleIds.Contains(r.CycleId))
            .ToDictionaryAsync(r => r.CycleId, ct);

        var pending = new List<PendingFeedbackItem>();
        var completed = new List<PendingFeedbackItem>();

        foreach (var c in cycles)
        {
            ownResponses.TryGetValue(c.Id, out var r);
            var status = r?.Status switch
            {
                FeedbackResponseStatus.Submitted => "Submitted",
                FeedbackResponseStatus.Draft when (r?.OverallRating ?? null) is not null
                    || !string.IsNullOrWhiteSpace(r?.Highlights)
                    || !string.IsNullOrWhiteSpace(r?.Improvements) => "Draft",
                _ => "NotStarted",
            };

            var item = new PendingFeedbackItem(
                c.Id,
                c.Session?.Course?.Name ?? "(unknown)",
                c.Session?.Trainer?.Name,
                c.Session?.EndDate,
                (c.Session?.EndDate ?? c.OpensAt).AddDays(7),
                status);

            if (status == "Submitted") completed.Add(item);
            else pending.Add(item);
        }

        var submittedCount = ownResponses.Values.Count(r => r.Status == FeedbackResponseStatus.Submitted);
        var onTimeCount = ownResponses.Values.Count(r => r.SubmittedAt is { } at && cycles.Any(c => c.Id == r.CycleId
            && at <= (c.Session?.EndDate ?? c.OpensAt).AddDays(7)));
        var onTimeRate = submittedCount == 0 ? 0 : Math.Round(onTimeCount / (double)submittedCount, 2);

        return new MaverickDashboard(
            pending.OrderBy(p => p.DueAt).ToList(),
            completed.OrderByDescending(p => p.SessionEndedAt ?? DateTimeOffset.MinValue).ToList(),
            new MaverickStreak(submittedCount, onTimeRate));
    }
}
