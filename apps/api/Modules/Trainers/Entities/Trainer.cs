using HexaLoop.Api.Modules.Courses.Entities;

namespace HexaLoop.Api.Modules.Trainers.Entities;

public sealed class Trainer
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Organization { get; set; }
    public string DomainExpertise { get; set; } = string.Empty;
    public TrainerSourcing EngagementType { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
