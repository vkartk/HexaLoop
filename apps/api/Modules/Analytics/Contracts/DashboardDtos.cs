using HexaLoop.Api.Modules.Ai.Contracts;

namespace HexaLoop.Api.Modules.Analytics.Contracts;

public sealed record Trend(string Direction, double DeltaPct);

public sealed record MetricCard(
    string Key,
    string Label,
    string Value,
    string? Helper = null,
    Trend? Trend = null);

public sealed record SentimentBreakdown(
    double Positive,
    double Neutral,
    double Negative,
    AiBadge Ai);

public sealed record TrainerScorecardRow(
    Guid TrainerId,
    string Name,
    string? Organization,
    int Courses,
    int Sessions,
    double AvgRating,
    double CompletionRate);

public sealed record Alert(
    Guid Id,
    string Severity,
    string Title,
    string? Body,
    Guid? CycleId,
    DateTimeOffset CreatedAt);

public sealed record AiInsightBanner(
    string Summary,
    IReadOnlyList<string> TopThemes,
    AiBadge Ai);

public sealed record AdminDashboard(
    IReadOnlyList<MetricCard> Metrics,
    SentimentBreakdown Sentiment,
    IReadOnlyList<TrainerScorecardRow> Trainers,
    IReadOnlyList<Alert> Alerts,
    AiInsightBanner Insight);

public sealed record PendingFeedbackItem(
    Guid CycleId,
    string CourseName,
    string? TrainerName,
    DateTimeOffset? SessionEndedAt,
    DateTimeOffset DueAt,
    string Status);

public sealed record MaverickStreak(int SubmittedCount, double OnTimeRate);

public sealed record MaverickDashboard(
    IReadOnlyList<PendingFeedbackItem> Pending,
    IReadOnlyList<PendingFeedbackItem> Completed,
    MaverickStreak Streak);

public sealed record SupervisorTeamRow(
    Guid MaverickId,
    string MaverickName,
    int PendingCount,
    DateTimeOffset? LastSubmittedAt);

public sealed record SupervisorDashboard(
    int PendingEvaluations,
    IReadOnlyList<SupervisorTeamRow> Team,
    IReadOnlyList<MetricCard> Metrics);
