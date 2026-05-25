using MediatR;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Auth;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Modules.Analytics.Contracts;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Effectiveness.Entities;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Modules.Analytics.Queries;

public sealed record GetSupervisorDashboardQuery : IRequest<SupervisorDashboard>;

public sealed class GetSupervisorDashboardQueryHandler(AppDbContext db, ICurrentUser current)
    : IRequestHandler<GetSupervisorDashboardQuery, SupervisorDashboard>
{
    public async Task<SupervisorDashboard> Handle(GetSupervisorDashboardQuery request, CancellationToken ct)
    {
        var supervisorId = current.RequireId();

        var teamMembers = await db.Users
            .AsNoTracking()
            .Where(u => u.ManagerId == supervisorId && u.Role == UserRole.Maverick)
            .ToListAsync(ct);

        var teamIds = teamMembers.Select(m => m.Id).ToList();

        var supervisorResponses = await db.EffectivenessResponses
            .AsNoTracking()
            .Where(r => r.SupervisorId == supervisorId && teamIds.Contains(r.MaverickId))
            .ToListAsync(ct);

        var pendingForSupervisor = supervisorResponses
            .Count(r => r.Status == EffectivenessResponseStatus.Draft
                && db.FeedbackCycles.Any(c => c.Id == r.CycleId && c.Status == CycleStatus.Open));

        var teamRows = teamMembers.Select(m =>
        {
            var perMember = supervisorResponses.Where(r => r.MaverickId == m.Id).ToList();
            var pendingCount = perMember.Count(r => r.Status == EffectivenessResponseStatus.Draft);
            var lastSubmittedAt = perMember
                .Where(r => r.SubmittedAt != null)
                .Max(r => (DateTimeOffset?)r.SubmittedAt);
            return new SupervisorTeamRow(m.Id, m.FullName, pendingCount, lastSubmittedAt);
        }).OrderBy(t => t.MaverickName).ToList();

        var totalSubmitted = supervisorResponses.Count(r => r.Status == EffectivenessResponseStatus.Submitted);
        var teamSize = teamMembers.Count;
        var avgReadiness = supervisorResponses
            .Where(r => r.OverallReadiness != null)
            .Select(r => (double)r.OverallReadiness!.Value)
            .ToList();

        var metrics = new List<MetricCard>
        {
            new("teamSize", "Team size", teamSize.ToString()),
            new("submittedReviews", "Submitted reviews", totalSubmitted.ToString()),
            new("avgReadiness", "Average readiness",
                avgReadiness.Count == 0 ? "—" : $"{avgReadiness.Average():0.0}/5"),
        };

        return new SupervisorDashboard(pendingForSupervisor, teamRows, metrics);
    }
}
