using HexaLoop.Api.Modules.Effectiveness.Contracts;
using HexaLoop.Api.Modules.Effectiveness.Entities;

namespace HexaLoop.Api.Modules.Effectiveness.Services;

public static class EffectivenessProjection
{
    public static EffectivenessDraftDto ToDto(EffectivenessResponse r) => new(
        r.CycleId,
        r.MaverickId,
        r.TechnicalCompetency,
        r.SoftSkills,
        r.ProjectPerformance,
        r.OverallReadiness,
        r.Comments,
        r.FutureTrainingRecommendations,
        r.Status,
        r.UpdatedAt,
        r.SubmittedAt);
}
