using HexaLoop.Api.Modules.Sessions.Entities;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Modules.Enrollments.Entities;

public enum EnrollmentStatus
{
    Enrolled,
    Completed,
    NoShow,
}

public sealed class Enrollment
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public Guid MaverickId { get; set; }
    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Enrolled;
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public Session? Session { get; set; }
    public User? Maverick { get; set; }
}
