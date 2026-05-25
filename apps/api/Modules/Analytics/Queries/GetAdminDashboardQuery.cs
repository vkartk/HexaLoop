using MediatR;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Modules.Ai;
using HexaLoop.Api.Modules.Ai.Contracts;
using HexaLoop.Api.Modules.Analytics.Contracts;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Feedback.Entities;
using HexaLoop.Api.Modules.Notifications.Entities;

namespace HexaLoop.Api.Modules.Analytics.Queries;

public sealed record GetAdminDashboardQuery : IRequest<AdminDashboard>;

public sealed class GetAdminDashboardQueryHandler(AppDbContext db, IAiService ai)
    : IRequestHandler<GetAdminDashboardQuery, AdminDashboard>
{
    public async Task<AdminDashboard> Handle(GetAdminDashboardQuery request, CancellationToken ct)
    {
        var allSubmitted = await db.FeedbackResponses
            .AsNoTracking()
            .Where(r => r.Status == FeedbackResponseStatus.Submitted)
            .ToListAsync(ct);

        var totalRatings = allSubmitted.Where(r => r.OverallRating != null).Count();
        var avgRating = totalRatings == 0
            ? 0
            : allSubmitted.Where(r => r.OverallRating != null).Average(r => r.OverallRating!.Value);

        var openCycles = await db.FeedbackCycles.CountAsync(c => c.Status == CycleStatus.Open, ct);
        var closedCycles = await db.FeedbackCycles.CountAsync(c => c.Status != CycleStatus.Open, ct);

        var metrics = new List<MetricCard>
        {
            new("submittedFeedback", "Submitted feedback", totalRatings.ToString(),
                Helper: "Last 90 days"),
            new("avgRating", "Average rating",
                totalRatings == 0 ? "—" : $"{avgRating:0.0}/5"),
            new("openCycles", "Open cycles", openCycles.ToString()),
            new("closedCycles", "Closed cycles", closedCycles.ToString()),
        };

        // Sentiment + insight come from the AI seam (stub today).
        var insight = await ai.GenerateInsightsAsync(Guid.Empty, allSubmitted, ct);

        var sentimentAi = new AiBadge(true, insight.Degraded, DateTimeOffset.UtcNow, totalRatings);
        var sentiment = new SentimentBreakdown(
            insight.SentimentPositive, insight.SentimentNeutral, insight.SentimentNegative, sentimentAi);

        var trainerRows = await db.Trainers
            .AsNoTracking()
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Organization,
                Sessions = db.Sessions.Count(s => s.TrainerId == t.Id),
                Courses = db.Sessions.Where(s => s.TrainerId == t.Id).Select(s => s.CourseId).Distinct().Count(),
                Ratings = db.FeedbackResponses
                    .Where(r => r.Status == FeedbackResponseStatus.Submitted
                        && r.OverallRating != null
                        && db.FeedbackCycles.Any(c => c.Id == r.CycleId
                            && db.Sessions.Any(s => s.Id == c.SessionId && s.TrainerId == t.Id)))
                    .Select(r => (double)r.OverallRating!.Value)
                    .ToList(),
            })
            .ToListAsync(ct);

        var trainers = trainerRows.Select(t => new TrainerScorecardRow(
            t.Id,
            t.Name,
            t.Organization,
            t.Courses,
            t.Sessions,
            t.Ratings.Count == 0 ? 0 : Math.Round(t.Ratings.Average(), 2),
            t.Sessions == 0 ? 0 : Math.Round(t.Ratings.Count / (double)Math.Max(1, t.Sessions * 12), 2)
        )).OrderByDescending(t => t.AvgRating).ToList();

        var alertRows = await db.Notifications
            .AsNoTracking()
            .Where(n => n.Severity == NotificationSeverity.Warn || n.Severity == NotificationSeverity.Alert)
            .OrderByDescending(n => n.CreatedAt)
            .Take(10)
            .ToListAsync(ct);

        var alerts = alertRows.Select(n => new Alert(
            n.Id,
            n.Severity.ToString().ToLowerInvariant(),
            n.Subject,
            n.Body,
            n.RelatedCycleId,
            n.CreatedAt
        )).ToList();

        var insightBanner = new AiInsightBanner(
            insight.Summary,
            insight.TopThemes,
            new AiBadge(true, insight.Degraded, DateTimeOffset.UtcNow, totalRatings));

        return new AdminDashboard(metrics, sentiment, trainers, alerts, insightBanner);
    }
}
