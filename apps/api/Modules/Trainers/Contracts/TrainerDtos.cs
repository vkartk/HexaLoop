using HexaLoop.Api.Modules.Ai.Contracts;
using HexaLoop.Api.Modules.Analytics.Contracts;
using HexaLoop.Api.Modules.Courses.Entities;
using HexaLoop.Api.Modules.Cycles.Entities;

namespace HexaLoop.Api.Modules.Trainers.Contracts;

public sealed record TrainerListRow(
    Guid TrainerId,
    string Name,
    string? Organization,
    TrainerSourcing EngagementType,
    string Domain,
    int Courses,
    int Sessions,
    double AvgRating,
    double CompletionRate);

public sealed record TrainerPage(
    IReadOnlyList<TrainerListRow> Data,
    int Page,
    int PageSize,
    int Total);

public sealed record TrainerScorecardCycle(
    Guid CycleId,
    string CourseName,
    double CompletionRate,
    double? AvgRating,
    CycleStatus Status,
    DateTimeOffset? ClosedAt);

public sealed record TrainerLifetime(
    int Sessions,
    int Responses,
    double AvgRating,
    double CompletionRate);

public sealed record TrainerScorecard(
    TrainerListRow Trainer,
    TrainerLifetime Lifetime,
    IReadOnlyList<TrainerScorecardCycle> RecentCycles,
    SentimentBreakdown Sentiment);
