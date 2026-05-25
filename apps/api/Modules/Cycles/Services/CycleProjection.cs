using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Modules.Cycles.Contracts;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Effectiveness.Entities;
using HexaLoop.Api.Modules.Enrollments.Entities;
using HexaLoop.Api.Modules.Feedback.Entities;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Modules.Cycles.Services;

/// Server-side projection of FeedbackCycle into the contract DTO, including
/// computed expectedCount, responseCount, and completionRate.
public static class CycleProjection
{
    public static async Task<CycleDto> ProjectAsync(AppDbContext db, FeedbackCycle cycle, CancellationToken ct)
    {
        var courseName = cycle.Session?.Course?.Name
            ?? await db.Sessions.Where(s => s.Id == cycle.SessionId)
                .Select(s => s.Course!.Name).FirstOrDefaultAsync(ct)
            ?? "(unknown)";

        var trainerName = cycle.Session?.Trainer?.Name
            ?? await db.Sessions.Where(s => s.Id == cycle.SessionId)
                .Select(s => s.Trainer!.Name).FirstOrDefaultAsync(ct);

        var (expected, responses) = await CountsAsync(db, cycle, ct);
        var completion = expected == 0 ? 0 : Math.Round(responses / (double)expected, 4);

        string? closedByName = null;
        if (cycle.ClosedByUserId is { } cid)
        {
            closedByName = await db.Users.Where(u => u.Id == cid).Select(u => u.FullName).FirstOrDefaultAsync(ct);
        }

        return new CycleDto(
            cycle.Id,
            cycle.SessionId,
            courseName,
            trainerName,
            cycle.Type,
            cycle.Status,
            cycle.Threshold,
            cycle.OpensAt,
            cycle.ClosesAt,
            expected,
            responses,
            completion,
            cycle.TriggerBasis,
            cycle.ClosedAt,
            closedByName,
            cycle.OverrideReason);
    }

    public static async Task<(int expected, int responses)> CountsAsync(
        AppDbContext db, FeedbackCycle cycle, CancellationToken ct)
    {
        if (cycle.Type == CycleType.MaverickPostTraining)
        {
            var expected = await db.Enrollments
                .CountAsync(e => e.SessionId == cycle.SessionId && e.Status == EnrollmentStatus.Completed, ct);
            var responses = await db.FeedbackResponses
                .CountAsync(r => r.CycleId == cycle.Id && r.Status == FeedbackResponseStatus.Submitted, ct);
            return (expected, responses);
        }

        // SupervisorEffectiveness: one expected per (supervisor, completed-maverick-on-session) pair
        var pairs = await db.Enrollments
            .Where(e => e.SessionId == cycle.SessionId && e.Status == EnrollmentStatus.Completed)
            .Join(db.Users, e => e.MaverickId, u => u.Id, (e, u) => new { e.MaverickId, u.ManagerId })
            .Where(x => x.ManagerId != null)
            .Select(x => new { SupervisorId = x.ManagerId!.Value, x.MaverickId })
            .ToListAsync(ct);

        var expectedPairs = pairs.Count;
        var responsesPairs = await db.EffectivenessResponses
            .CountAsync(r => r.CycleId == cycle.Id && r.Status == EffectivenessResponseStatus.Submitted, ct);
        return (expectedPairs, responsesPairs);
    }
}
