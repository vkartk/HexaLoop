using HexaLoop.Api.Modules.Courses.Entities;
using HexaLoop.Api.Modules.Trainers.Entities;

namespace HexaLoop.Api.Modules.Sessions.Entities;

public enum SessionStatus
{
    Scheduled,
    Running,
    Completed,
    Cancelled,
}

public sealed class Session
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public Guid TrainerId { get; set; }
    public DateTimeOffset StartDate { get; set; }
    public DateTimeOffset EndDate { get; set; }
    public string? Location { get; set; }
    public string? VirtualLink { get; set; }
    public int Capacity { get; set; }
    public SessionStatus Status { get; set; } = SessionStatus.Scheduled;
    public DateTimeOffset CreatedAt { get; set; }

    public Course? Course { get; set; }
    public Trainer? Trainer { get; set; }
}
