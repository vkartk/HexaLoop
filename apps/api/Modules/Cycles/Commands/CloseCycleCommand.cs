using MediatR;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Auth;
using HexaLoop.Api.Infrastructure.Errors;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Infrastructure.Time;
using HexaLoop.Api.Modules.Audit;
using HexaLoop.Api.Modules.Cycles.Contracts;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Cycles.Services;

namespace HexaLoop.Api.Modules.Cycles.Commands;

public sealed record CloseCycleCommand(Guid CycleId) : IRequest<CycleDto>;

public sealed class CloseCycleCommandHandler(
    AppDbContext db,
    ICurrentUser current,
    IClock clock,
    IAuditWriter audit) : IRequestHandler<CloseCycleCommand, CycleDto>
{
    public async Task<CycleDto> Handle(CloseCycleCommand request, CancellationToken ct)
    {
        var actorId = current.RequireId();

        var cycle = await db.FeedbackCycles
            .Include(c => c.Session).ThenInclude(s => s!.Course)
            .Include(c => c.Session).ThenInclude(s => s!.Trainer)
            .SingleOrDefaultAsync(c => c.Id == request.CycleId, ct)
            ?? throw new NotFoundException("Cycle", request.CycleId);

        if (cycle.Status != CycleStatus.Open)
        {
            throw new ConflictException("Cycle is already closed.");
        }

        var (expected, responses) = await CycleProjection.CountsAsync(db, cycle, ct);
        var rate = expected == 0 ? 0 : responses / (double)expected;

        if (rate < cycle.Threshold)
        {
            throw new BelowThresholdException(cycle.Id, Math.Round(rate, 4), Math.Round(cycle.Threshold, 4));
        }

        var now = clock.UtcNow;
        cycle.Status = CycleStatus.Closed;
        cycle.ClosedAt = now;
        cycle.ClosesAt = now;
        cycle.ClosedByUserId = actorId;
        await db.SaveChangesAsync(ct);

        await audit.WriteAsync(
            actorId,
            action: "cycle.close",
            entityType: "FeedbackCycle",
            entityId: cycle.Id.ToString(),
            metadata: new { completionRate = Math.Round(rate, 4), threshold = cycle.Threshold },
            ct: ct);

        return await CycleProjection.ProjectAsync(db, cycle, ct);
    }
}
