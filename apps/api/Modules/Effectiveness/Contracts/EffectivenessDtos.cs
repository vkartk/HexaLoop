using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Effectiveness.Entities;

namespace HexaLoop.Api.Modules.Effectiveness.Contracts;

public sealed record EffectivenessCycleContextDto(
    Guid CycleId,
    string CourseName,
    string? TrainerName,
    DateTimeOffset DueAt,
    CycleStatus Status);

public sealed record EffectivenessMaverickContextDto(
    Guid Id,
    string FullName,
    string? EmployeeCode,
    DateTimeOffset? SessionEndedAt,
    double? AvgPostTrainingRating);

public sealed record EffectivenessDraftDto(
    Guid CycleId,
    Guid MaverickId,
    int? TechnicalCompetency,
    int? SoftSkills,
    int? ProjectPerformance,
    int? OverallReadiness,
    string? Comments,
    string? FutureTrainingRecommendations,
    EffectivenessResponseStatus Status,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? SubmittedAt);

public sealed record EffectivenessFormBundle(
    EffectivenessCycleContextDto Cycle,
    EffectivenessMaverickContextDto Maverick,
    EffectivenessDraftDto Draft);

public sealed record EffectivenessDraftPatch(
    int? TechnicalCompetency,
    int? SoftSkills,
    int? ProjectPerformance,
    int? OverallReadiness,
    string? Comments,
    string? FutureTrainingRecommendations);

public sealed record EffectivenessSubmitBody(
    int TechnicalCompetency,
    int SoftSkills,
    int ProjectPerformance,
    int OverallReadiness,
    string Comments,
    string? FutureTrainingRecommendations);

public sealed record EffectivenessPendingItem(
    Guid CycleId,
    Guid MaverickId,
    string MaverickName,
    string CourseName,
    string? TrainerName,
    DateTimeOffset DueAt,
    string Status,
    DateTimeOffset? SubmittedAt);

public sealed record EffectivenessQueue(
    IReadOnlyList<EffectivenessPendingItem> Pending,
    IReadOnlyList<EffectivenessPendingItem> RecentlySubmitted);
