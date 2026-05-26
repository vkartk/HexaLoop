using MediatR;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Auth;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Feedback.Contracts;
using HexaLoop.Api.Modules.Feedback.Entities;

namespace HexaLoop.Api.Modules.Feedback.Queries;

public sealed record ListFeedbackHistoryQuery(int Page, int PageSize)
    : IRequest<FeedbackHistoryPage>;

public sealed class ListFeedbackHistoryQueryHandler(AppDbContext db, ICurrentUser current)
    : IRequestHandler<ListFeedbackHistoryQuery, FeedbackHistoryPage>
{
    public async Task<FeedbackHistoryPage> Handle(ListFeedbackHistoryQuery request, CancellationToken ct)
    {
        var userId = current.RequireId();
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var cycles = await db.FeedbackCycles
            .AsNoTracking()
            .Where(c => c.Type == CycleType.MaverickPostTraining
                && db.Enrollments.Any(e => e.SessionId == c.SessionId && e.MaverickId == userId))
            .Include(c => c.Session).ThenInclude(s => s!.Course)
            .Include(c => c.Session).ThenInclude(s => s!.Trainer)
            .ToListAsync(ct);

        var cycleIds = cycles.Select(c => c.Id).ToList();
        var responses = await db.FeedbackResponses
            .AsNoTracking()
            .Where(r => r.MaverickId == userId && cycleIds.Contains(r.CycleId))
            .ToDictionaryAsync(r => r.CycleId, ct);

        var rows = new List<FeedbackHistoryItem>(cycles.Count);
        foreach (var c in cycles)
        {
            responses.TryGetValue(c.Id, out var r);
            var status = ResolveStatus(r);

            rows.Add(new FeedbackHistoryItem(
                c.Id,
                c.Session?.Course?.Name ?? "(unknown)",
                c.Session?.Trainer?.Name,
                c.Session?.EndDate,
                (c.Session?.EndDate ?? c.OpensAt).AddDays(7),
                status,
                r?.OverallRating,
                r?.Status == FeedbackResponseStatus.Submitted ? r.SubmittedAt : null,
                c.Status));
        }

        var ordered = rows
            .OrderByDescending(i => i.SubmittedAt ?? i.DueAt)
            .ToList();

        var total = ordered.Count;
        var pageRows = ordered.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return new FeedbackHistoryPage(pageRows, page, pageSize, total);
    }

    private static FeedbackHistoryStatus ResolveStatus(FeedbackResponse? r)
    {
        if (r is null) return FeedbackHistoryStatus.NotStarted;
        if (r.Status == FeedbackResponseStatus.Submitted) return FeedbackHistoryStatus.Submitted;
        var hasContent = r.OverallRating is not null
            || !string.IsNullOrWhiteSpace(r.Highlights)
            || !string.IsNullOrWhiteSpace(r.Improvements);
        return hasContent ? FeedbackHistoryStatus.Draft : FeedbackHistoryStatus.NotStarted;
    }
}
