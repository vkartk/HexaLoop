using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Modules.Feedback.Entities;

public enum FeedbackResponseStatus
{
    Draft,
    Submitted,
}

public sealed class FeedbackResponse
{
    public Guid Id { get; set; }
    public Guid CycleId { get; set; }
    public Guid MaverickId { get; set; }
    public int? OverallRating { get; set; }
    public string? Highlights { get; set; }
    public string? Improvements { get; set; }
    public FeedbackResponseStatus Status { get; set; } = FeedbackResponseStatus.Draft;
    public DateTimeOffset? SubmittedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public FeedbackCycle? Cycle { get; set; }
    public User? Maverick { get; set; }
}
