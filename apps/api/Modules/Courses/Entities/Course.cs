namespace HexaLoop.Api.Modules.Courses.Entities;

public enum CourseType
{
    Technical,
    SoftSkills,
    Blended,
}

public enum TrainerSourcing
{
    Internal,
    External,
}

public sealed class Course
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public CourseType Type { get; set; }
    public TrainerSourcing TrainerType { get; set; }
    public string Domain { get; set; } = string.Empty;
    public string Objectives { get; set; } = string.Empty;
    public int DurationHours { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }
}
