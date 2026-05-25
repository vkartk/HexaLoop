using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Modules.Effectiveness.Entities;

public enum EffectivenessResponseStatus
{
    Draft,
    Submitted,
}

public sealed class EffectivenessResponse
{
    public Guid Id { get; set; }
    public Guid CycleId { get; set; }
    public Guid SupervisorId { get; set; }
    public Guid MaverickId { get; set; }
    public int? TechnicalCompetency { get; set; }
    public int? SoftSkills { get; set; }
    public int? ProjectPerformance { get; set; }
    public int? OverallReadiness { get; set; }
    public string? Comments { get; set; }
    public string? FutureTrainingRecommendations { get; set; }
    public EffectivenessResponseStatus Status { get; set; } = EffectivenessResponseStatus.Draft;
    public DateTimeOffset? SubmittedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public FeedbackCycle? Cycle { get; set; }
    public User? Supervisor { get; set; }
    public User? Maverick { get; set; }
}
