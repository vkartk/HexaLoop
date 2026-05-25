using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Modules.Ai.Entities;
using HexaLoop.Api.Modules.Analytics.Entities;
using HexaLoop.Api.Modules.Audit.Entities;
using HexaLoop.Api.Modules.Courses.Entities;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Effectiveness.Entities;
using HexaLoop.Api.Modules.Enrollments.Entities;
using HexaLoop.Api.Modules.Feedback.Entities;
using HexaLoop.Api.Modules.Notifications.Entities;
using HexaLoop.Api.Modules.Sessions.Entities;
using HexaLoop.Api.Modules.Trainers.Entities;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Trainer> Trainers => Set<Trainer>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<FeedbackCycle> FeedbackCycles => Set<FeedbackCycle>();
    public DbSet<FeedbackResponse> FeedbackResponses => Set<FeedbackResponse>();
    public DbSet<EffectivenessResponse> EffectivenessResponses => Set<EffectivenessResponse>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AiInsight> AiInsights => Set<AiInsight>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Report> Reports => Set<Report>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        var stringListConverter = new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<List<string>, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>());

        b.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasKey(x => x.Id);
            e.Property(x => x.Email).IsRequired().HasMaxLength(320);
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.FullName).IsRequired().HasMaxLength(200);
            e.Property(x => x.EmployeeCode).HasMaxLength(40);
            e.Property(x => x.Role).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.PasswordHash).IsRequired();
            e.HasOne(x => x.Manager).WithMany(x => x.Reports)
                .HasForeignKey(x => x.ManagerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<RefreshToken>(e =>
        {
            e.ToTable("refresh_tokens");
            e.HasKey(x => x.Id);
            e.Property(x => x.TokenHash).IsRequired().HasMaxLength(128);
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Course>(e =>
        {
            e.ToTable("courses");
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).IsRequired().HasMaxLength(40);
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.TrainerType).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Domain).HasMaxLength(120);
            e.Property(x => x.Objectives).HasMaxLength(2000);
        });

        b.Entity<Trainer>(e =>
        {
            e.ToTable("trainers");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);
            e.Property(x => x.Organization).HasMaxLength(200);
            e.Property(x => x.DomainExpertise).HasMaxLength(200);
            e.Property(x => x.EngagementType).HasConversion<string>().HasMaxLength(20);
        });

        b.Entity<Session>(e =>
        {
            e.ToTable("sessions");
            e.HasKey(x => x.Id);
            e.Property(x => x.Location).HasMaxLength(200);
            e.Property(x => x.VirtualLink).HasMaxLength(500);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Course).WithMany().HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Trainer).WithMany().HasForeignKey(x => x.TrainerId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.Status);
        });

        b.Entity<Enrollment>(e =>
        {
            e.ToTable("enrollments");
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Session).WithMany().HasForeignKey(x => x.SessionId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Maverick).WithMany().HasForeignKey(x => x.MaverickId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.SessionId, x.MaverickId }).IsUnique();
        });

        b.Entity<FeedbackCycle>(e =>
        {
            e.ToTable("feedback_cycles");
            e.HasKey(x => x.Id);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(40);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.TriggerBasis).HasConversion<string>().HasMaxLength(40);
            e.Property(x => x.OverrideReason).HasMaxLength(500);
            e.HasOne(x => x.Session).WithMany().HasForeignKey(x => x.SessionId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.ClosedByUser).WithMany().HasForeignKey(x => x.ClosedByUserId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.SessionId, x.Type }).IsUnique();
            e.HasIndex(x => x.Status);
        });

        b.Entity<FeedbackResponse>(e =>
        {
            e.ToTable("feedback_responses");
            e.HasKey(x => x.Id);
            e.Property(x => x.Highlights).HasMaxLength(2000);
            e.Property(x => x.Improvements).HasMaxLength(2000);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Cycle).WithMany().HasForeignKey(x => x.CycleId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Maverick).WithMany().HasForeignKey(x => x.MaverickId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.CycleId, x.MaverickId }).IsUnique();
        });

        b.Entity<EffectivenessResponse>(e =>
        {
            e.ToTable("effectiveness_responses");
            e.HasKey(x => x.Id);
            e.Property(x => x.Comments).HasMaxLength(2000);
            e.Property(x => x.FutureTrainingRecommendations).HasMaxLength(2000);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.HasOne(x => x.Cycle).WithMany().HasForeignKey(x => x.CycleId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Supervisor).WithMany().HasForeignKey(x => x.SupervisorId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Maverick).WithMany().HasForeignKey(x => x.MaverickId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.CycleId, x.SupervisorId, x.MaverickId }).IsUnique();
        });

        b.Entity<Notification>(e =>
        {
            e.ToTable("notifications");
            e.HasKey(x => x.Id);
            e.Property(x => x.Channel).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Severity).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Subject).IsRequired().HasMaxLength(200);
            e.Property(x => x.Body).HasMaxLength(4000);
            e.Property(x => x.Href).HasMaxLength(500);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.RelatedCycle).WithMany().HasForeignKey(x => x.RelatedCycleId).OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(x => new { x.UserId, x.Status });
        });

        b.Entity<AiInsight>(e =>
        {
            e.ToTable("ai_insights");
            e.HasKey(x => x.Id);
            e.Property(x => x.Summary).HasMaxLength(4000);
            e.Property(x => x.TopThemes).HasConversion(stringListConverter).HasColumnType("jsonb");
            e.Property(x => x.Recommendations).HasConversion(stringListConverter).HasColumnType("jsonb");
            e.HasOne(x => x.Cycle).WithMany().HasForeignKey(x => x.CycleId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.CycleId).IsUnique();
        });

        b.Entity<Report>(e =>
        {
            e.ToTable("reports");
            e.HasKey(x => x.Id);
            e.Property(x => x.Scope).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Format).HasConversion<string>().HasMaxLength(10);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.CycleStatusFilter).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.DownloadUrl).HasMaxLength(500);
            e.HasOne(x => x.RequestedByUser).WithMany().HasForeignKey(x => x.RequestedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.RequestedAt);
        });

        b.Entity<AuditLog>(e =>
        {
            e.ToTable("audit_logs");
            e.HasKey(x => x.Id);
            e.Property(x => x.Action).IsRequired().HasMaxLength(80);
            e.Property(x => x.EntityType).IsRequired().HasMaxLength(80);
            e.Property(x => x.EntityId).IsRequired().HasMaxLength(80);
            e.Property(x => x.MetadataJson).HasColumnType("jsonb");
            e.HasOne(x => x.Actor).WithMany().HasForeignKey(x => x.ActorId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.EntityType, x.EntityId });
            e.HasIndex(x => x.CreatedAt);
        });
    }
}
