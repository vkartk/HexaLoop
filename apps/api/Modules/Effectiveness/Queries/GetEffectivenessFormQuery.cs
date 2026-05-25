using MediatR;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Auth;
using HexaLoop.Api.Infrastructure.Errors;
using HexaLoop.Api.Infrastructure.Ids;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Infrastructure.Time;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Effectiveness.Contracts;
using HexaLoop.Api.Modules.Effectiveness.Entities;
using HexaLoop.Api.Modules.Effectiveness.Services;
using HexaLoop.Api.Modules.Feedback.Entities;

namespace HexaLoop.Api.Modules.Effectiveness.Queries;

public sealed record GetEffectivenessFormQuery(Guid CycleId, Guid MaverickId) : IRequest<EffectivenessFormBundle>;

public sealed class GetEffectivenessFormQueryHandler(
    AppDbContext db,
    ICurrentUser current,
    IClock clock) : IRequestHandler<GetEffectivenessFormQuery, EffectivenessFormBundle>
{
    public async Task<EffectivenessFormBundle> Handle(GetEffectivenessFormQuery request, CancellationToken ct)
    {
        var supervisorId = current.RequireId();

        var cycle = await db.FeedbackCycles
            .AsNoTracking()
            .Include(c => c.Session).ThenInclude(s => s!.Course)
            .Include(c => c.Session).ThenInclude(s => s!.Trainer)
            .SingleOrDefaultAsync(c => c.Id == request.CycleId, ct)
            ?? throw new NotFoundException("Cycle", request.CycleId);

        if (cycle.Type != CycleType.SupervisorEffectiveness)
        {
            throw new NotFoundException("Cycle", request.CycleId);
        }

        var maverick = await db.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(u => u.Id == request.MaverickId, ct)
            ?? throw new NotFoundException("Maverick", request.MaverickId);

        if (maverick.ManagerId != supervisorId)
        {
            throw new ForbiddenException("This maverick is not on your team.");
        }

        var draft = await db.EffectivenessResponses
            .SingleOrDefaultAsync(
                r => r.CycleId == request.CycleId
                    && r.SupervisorId == supervisorId
                    && r.MaverickId == request.MaverickId, ct);

        if (draft is null)
        {
            draft = new EffectivenessResponse
            {
                Id = UuidV7.New(),
                CycleId = request.CycleId,
                SupervisorId = supervisorId,
                MaverickId = request.MaverickId,
                Status = EffectivenessResponseStatus.Draft,
                UpdatedAt = clock.UtcNow,
                CreatedAt = clock.UtcNow,
            };
            db.EffectivenessResponses.Add(draft);
            await db.SaveChangesAsync(ct);
        }

        var avg = await db.FeedbackResponses
            .Where(r => r.MaverickId == request.MaverickId
                && r.Status == FeedbackResponseStatus.Submitted
                && r.OverallRating != null)
            .Select(r => (double?)r.OverallRating!.Value)
            .ToListAsync(ct);

        var avgPostTrainingRating = avg.Count == 0 ? (double?)null : Math.Round(avg.Average()!.Value, 1);

        return new EffectivenessFormBundle(
            new EffectivenessCycleContextDto(
                cycle.Id,
                cycle.Session?.Course?.Name ?? "(unknown)",
                cycle.Session?.Trainer?.Name,
                cycle.Session?.EndDate.AddDays(90) ?? cycle.OpensAt,
                cycle.Status),
            new EffectivenessMaverickContextDto(
                maverick.Id,
                maverick.FullName,
                maverick.EmployeeCode,
                cycle.Session?.EndDate,
                avgPostTrainingRating),
            EffectivenessProjection.ToDto(draft));
    }
}
