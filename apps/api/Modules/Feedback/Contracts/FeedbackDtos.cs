using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Feedback.Entities;

namespace HexaLoop.Api.Modules.Feedback.Contracts;

public sealed record FeedbackCycleContextDto(
    Guid CycleId,
    string CourseName,
    string? TrainerName,
    DateTimeOffset? SessionEndedAt,
    DateTimeOffset DueAt,
    CycleStatus Status);

public sealed record FeedbackDraftDto(
    Guid CycleId,
    int? OverallRating,
    string? Highlights,
    string? Improvements,
    FeedbackResponseStatus Status,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? SubmittedAt);

public sealed record FeedbackFormBundle(
    FeedbackCycleContextDto Cycle,
    FeedbackDraftDto Draft);

public sealed record FeedbackDraftPatch(
    int? OverallRating,
    string? Highlights,
    string? Improvements);

public sealed record FeedbackSubmitBody(
    int OverallRating,
    string Highlights,
    string Improvements);

public enum FeedbackHistoryStatus
{
    NotStarted,
    Draft,
    Submitted,
}

public sealed record FeedbackHistoryItem(
    Guid CycleId,
    string CourseName,
    string? TrainerName,
    DateTimeOffset? SessionEndedAt,
    DateTimeOffset DueAt,
    FeedbackHistoryStatus Status,
    int? OverallRating,
    DateTimeOffset? SubmittedAt,
    CycleStatus CycleStatus);

public sealed record FeedbackHistoryPage(
    IReadOnlyList<FeedbackHistoryItem> Data,
    int Page,
    int PageSize,
    int Total);
