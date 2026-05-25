using HexaLoop.Api.Modules.Sessions.Entities;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Modules.Cycles.Entities;

public enum CycleType
{
    MaverickPostTraining,
    SupervisorEffectiveness,
}

public enum CycleStatus
{
    Open,
    Closed,
    OverrideClosed,
}

public enum TriggerBasis
{
    TrainingCompletion,
    Post3MonthProject,
}

public sealed class FeedbackCycle
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public CycleType Type { get; set; }
    public double Threshold { get; set; } = 0.78;
    public CycleStatus Status { get; set; } = CycleStatus.Open;
    public DateTimeOffset OpensAt { get; set; }
    public DateTimeOffset? ClosesAt { get; set; }
    public TriggerBasis TriggerBasis { get; set; }
    public DateTimeOffset? ClosedAt { get; set; }
    public Guid? ClosedByUserId { get; set; }
    public string? OverrideReason { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Session? Session { get; set; }
    public User? ClosedByUser { get; set; }
}
