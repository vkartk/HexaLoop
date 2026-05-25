using HexaLoop.Api.Modules.Cycles.Entities;

namespace HexaLoop.Api.Modules.Ai.Entities;

public sealed class AiInsight
{
    public Guid Id { get; set; }
    public Guid CycleId { get; set; }
    public double SentimentPositive { get; set; }
    public double SentimentNeutral { get; set; }
    public double SentimentNegative { get; set; }
    public List<string> TopThemes { get; set; } = [];
    public string Summary { get; set; } = string.Empty;
    public List<string> Recommendations { get; set; } = [];
    public int SourceCount { get; set; }
    public DateTimeOffset GeneratedAt { get; set; }
    public bool IsApproved { get; set; }
    public bool Degraded { get; set; } = true;

    public FeedbackCycle? Cycle { get; set; }
}
