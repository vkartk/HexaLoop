using MediatR;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Errors;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Modules.Ai.Contracts;
using HexaLoop.Api.Modules.Ai.Services;
using HexaLoop.Api.Modules.Analytics.Contracts;

namespace HexaLoop.Api.Modules.Cycles.Queries;

public sealed record GetCycleInsightsQuery(Guid CycleId) : IRequest<CycleInsightsResponse>;

public sealed record CycleInsightsResponse(
    Guid CycleId,
    double SentimentPositive,
    double SentimentNeutral,
    double SentimentNegative,
    IReadOnlyList<string> TopThemes,
    string Summary,
    IReadOnlyList<string> Recommendations,
    bool IsApproved,
    AiBadge Ai);

public sealed class GetCycleInsightsQueryHandler(
    AppDbContext db,
    IInsightCacheService insights)
    : IRequestHandler<GetCycleInsightsQuery, CycleInsightsResponse>
{
    public async Task<CycleInsightsResponse> Handle(GetCycleInsightsQuery request, CancellationToken ct)
    {
        var cycleExists = await db.FeedbackCycles.AnyAsync(c => c.Id == request.CycleId, ct);
        if (!cycleExists)
        {
            throw new NotFoundException("Cycle", request.CycleId);
        }

        var insight = await insights.GetOrGenerateAsync(request.CycleId, ct);

        return new CycleInsightsResponse(
            insight.CycleId,
            insight.SentimentPositive,
            insight.SentimentNeutral,
            insight.SentimentNegative,
            insight.TopThemes,
            insight.Summary,
            insight.Recommendations,
            insight.IsApproved,
            new AiBadge(
                AiGenerated: true,
                Degraded: insight.Degraded,
                GeneratedAt: insight.GeneratedAt,
                SourceCount: insight.SourceCount));
    }
}
