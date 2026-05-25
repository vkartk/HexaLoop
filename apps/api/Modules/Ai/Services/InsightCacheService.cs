using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Ids;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Infrastructure.Time;
using HexaLoop.Api.Modules.Ai.Contracts;
using HexaLoop.Api.Modules.Ai.Entities;

namespace HexaLoop.Api.Modules.Ai.Services;

public interface IInsightCacheService
{
    Task<AiInsight> GetOrGenerateAsync(Guid cycleId, CancellationToken ct = default);
}

public sealed class InsightCacheService(
    AppDbContext db,
    IAiService ai,
    IClock clock) : IInsightCacheService
{
    private static readonly TimeSpan FreshFor = TimeSpan.FromMinutes(15);

    public async Task<AiInsight> GetOrGenerateAsync(Guid cycleId, CancellationToken ct = default)
    {
        var existing = await db.AiInsights.SingleOrDefaultAsync(i => i.CycleId == cycleId, ct);
        var now = clock.UtcNow;

        if (existing is not null && (now - existing.GeneratedAt) < FreshFor)
        {
            return existing;
        }

        var responses = await db.FeedbackResponses
            .AsNoTracking()
            .Where(r => r.CycleId == cycleId)
            .ToListAsync(ct);

        var result = await ai.GenerateInsightsAsync(cycleId, responses, ct);

        if (existing is null)
        {
            existing = new AiInsight
            {
                Id = UuidV7.New(),
                CycleId = cycleId,
            };
            db.AiInsights.Add(existing);
        }

        existing.SentimentPositive = result.SentimentPositive;
        existing.SentimentNeutral = result.SentimentNeutral;
        existing.SentimentNegative = result.SentimentNegative;
        existing.TopThemes = result.TopThemes.ToList();
        existing.Summary = result.Summary;
        existing.Recommendations = result.Recommendations.ToList();
        existing.SourceCount = result.SourceCount;
        existing.GeneratedAt = now;
        existing.Degraded = result.Degraded;

        await db.SaveChangesAsync(ct);
        return existing;
    }
}
