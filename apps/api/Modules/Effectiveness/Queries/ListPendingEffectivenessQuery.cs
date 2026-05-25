using MediatR;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Auth;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Effectiveness.Contracts;
using HexaLoop.Api.Modules.Effectiveness.Entities;

namespace HexaLoop.Api.Modules.Effectiveness.Queries;

public sealed record ListPendingEffectivenessQuery : IRequest<EffectivenessQueue>;

public sealed class ListPendingEffectivenessQueryHandler(AppDbContext db, ICurrentUser current)
    : IRequestHandler<ListPendingEffectivenessQuery, EffectivenessQueue>
{
    public async Task<EffectivenessQueue> Handle(ListPendingEffectivenessQuery request, CancellationToken ct)
    {
        var supervisorId = current.RequireId();

        var rows = await db.EffectivenessResponses
            .AsNoTracking()
            .Where(r => r.SupervisorId == supervisorId)
            .Join(db.FeedbackCycles.Where(c => c.Type == CycleType.SupervisorEffectiveness),
                r => r.CycleId, c => c.Id, (r, c) => new { Response = r, Cycle = c })
            .Join(db.Sessions, x => x.Cycle.SessionId, s => s.Id, (x, s) => new { x.Response, x.Cycle, Session = s })
            .Join(db.Courses, x => x.Session.CourseId, co => co.Id, (x, co) => new { x.Response, x.Cycle, x.Session, Course = co })
            .Join(db.Trainers, x => x.Session.TrainerId, t => t.Id, (x, t) => new { x.Response, x.Cycle, x.Session, x.Course, Trainer = t })
            .Join(db.Users, x => x.Response.MaverickId, u => u.Id, (x, u) => new
            {
                x.Response,
                x.Cycle,
                x.Session,
                x.Course,
                x.Trainer,
                Maverick = u,
            })
            .ToListAsync(ct);

        var pending = new List<EffectivenessPendingItem>();
        var recentlySubmitted = new List<EffectivenessPendingItem>();
        var now = DateTimeOffset.UtcNow;

        foreach (var x in rows)
        {
            var dueAt = (x.Session.EndDate.AddDays(90));
            var status = x.Response.Status switch
            {
                EffectivenessResponseStatus.Submitted => "Submitted",
                EffectivenessResponseStatus.Draft when HasContent(x.Response) => "Draft",
                _ => "NotStarted",
            };

            var item = new EffectivenessPendingItem(
                x.Cycle.Id,
                x.Maverick.Id,
                x.Maverick.FullName,
                x.Course.Name,
                x.Trainer.Name,
                dueAt,
                status,
                x.Response.SubmittedAt);

            if (x.Response.Status == EffectivenessResponseStatus.Submitted)
            {
                if (now - x.Response.SubmittedAt <= TimeSpan.FromDays(14))
                {
                    recentlySubmitted.Add(item);
                }
            }
            else
            {
                pending.Add(item);
            }
        }

        return new EffectivenessQueue(
            pending.OrderBy(p => p.DueAt).ToList(),
            recentlySubmitted.OrderByDescending(p => p.SubmittedAt).Take(10).ToList());
    }

    private static bool HasContent(EffectivenessResponse r) =>
        r.TechnicalCompetency.HasValue
        || r.SoftSkills.HasValue
        || r.ProjectPerformance.HasValue
        || r.OverallReadiness.HasValue
        || !string.IsNullOrWhiteSpace(r.Comments)
        || !string.IsNullOrWhiteSpace(r.FutureTrainingRecommendations);
}
