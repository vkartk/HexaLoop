using FluentValidation;
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
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Modules.Cycles.Commands;

public sealed record OverrideCloseCycleCommand(Guid CycleId, string Reason) : IRequest<CycleDto>;

public sealed class OverrideCloseCycleCommandValidator : AbstractValidator<OverrideCloseCycleCommand>
{
    public OverrideCloseCycleCommandValidator()
    {
        RuleFor(x => x.Reason)
            .NotEmpty()
            .MinimumLength(10)
            .MaximumLength(500)
            .WithMessage("Reason must be between 10 and 500 characters.");
    }
}

public sealed class OverrideCloseCycleCommandHandler(
    AppDbContext db,
    ICurrentUser current,
    IClock clock,
    IAuditWriter audit) : IRequestHandler<OverrideCloseCycleCommand, CycleDto>
{
    public async Task<CycleDto> Handle(OverrideCloseCycleCommand request, CancellationToken ct)
    {
        if (current.Role != UserRole.Admin)
        {
            throw new ForbiddenException("Only Admin users may override-close a cycle.");
        }

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

        var now = clock.UtcNow;
        cycle.Status = CycleStatus.OverrideClosed;
        cycle.ClosedAt = now;
        cycle.ClosesAt = now;
        cycle.ClosedByUserId = actorId;
        cycle.OverrideReason = request.Reason;
        await db.SaveChangesAsync(ct);

        await audit.WriteAsync(
            actorId,
            action: "cycle.override-close",
            entityType: "FeedbackCycle",
            entityId: cycle.Id.ToString(),
            metadata: new
            {
                completionRate = Math.Round(rate, 4),
                threshold = cycle.Threshold,
                reason = request.Reason,
            },
            ct: ct);

        return await CycleProjection.ProjectAsync(db, cycle, ct);
    }
}
