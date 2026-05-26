using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Enrollments.Entities;
using HexaLoop.Api.Modules.Feedback.Entities;
using HexaLoop.Api.Modules.Trainers.Contracts;
using HexaLoop.Api.Modules.Trainers.Entities;

namespace HexaLoop.Api.Modules.Trainers.Services;

/// Computes the aggregate stats the trainer list + scorecard expose. Lives
/// here so the list query, the scorecard query, and the admin dashboard can
/// all agree on what avgRating / completionRate mean for a trainer.
public static class TrainerStats
{
    public sealed record Aggregate(
        int Courses,
        int Sessions,
        int CompletedEnrollments,
        int SubmittedResponses,
        double AvgRating);

    public static async Task<Aggregate> ComputeAsync(
        AppDbContext db, Guid trainerId, CancellationToken ct)
    {
        var sessionIds = await db.Sessions
            .AsNoTracking()
            .Where(s => s.TrainerId == trainerId)
            .Select(s => new { s.Id, s.CourseId })
            .ToListAsync(ct);

        var sessions = sessionIds.Count;
        var courses = sessionIds.Select(s => s.CourseId).Distinct().Count();

        if (sessions == 0)
        {
            return new Aggregate(0, 0, 0, 0, 0);
        }

        var ids = sessionIds.Select(s => s.Id).ToArray();

        var completedEnrollments = await db.Enrollments
            .AsNoTracking()
            .CountAsync(e => ids.Contains(e.SessionId) && e.Status == EnrollmentStatus.Completed, ct);

        var cycleIds = await db.FeedbackCycles
            .AsNoTracking()
            .Where(c => c.Type == CycleType.MaverickPostTraining && ids.Contains(c.SessionId))
            .Select(c => c.Id)
            .ToListAsync(ct);

        var submittedRatings = await db.FeedbackResponses
            .AsNoTracking()
            .Where(r => r.Status == FeedbackResponseStatus.Submitted
                && r.OverallRating != null
                && cycleIds.Contains(r.CycleId))
            .Select(r => (double)r.OverallRating!.Value)
            .ToListAsync(ct);

        var avgRating = submittedRatings.Count == 0
            ? 0
            : Math.Round(submittedRatings.Average(), 2);

        return new Aggregate(
            courses,
            sessions,
            completedEnrollments,
            submittedRatings.Count,
            avgRating);
    }

    public static TrainerListRow ToListRow(Trainer t, Aggregate agg)
    {
        var completion = agg.CompletedEnrollments == 0
            ? 0
            : Math.Round(agg.SubmittedResponses / (double)agg.CompletedEnrollments, 4);

        return new TrainerListRow(
            t.Id,
            t.Name,
            t.Organization,
            t.EngagementType,
            t.DomainExpertise,
            agg.Courses,
            agg.Sessions,
            agg.AvgRating,
            completion);
    }
}
