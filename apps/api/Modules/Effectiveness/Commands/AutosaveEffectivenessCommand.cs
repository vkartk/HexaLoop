using FluentValidation;
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

namespace HexaLoop.Api.Modules.Effectiveness.Commands;

public sealed record AutosaveEffectivenessCommand(
    Guid CycleId,
    Guid MaverickId,
    EffectivenessDraftPatch Patch) : IRequest<EffectivenessDraftDto>;

public sealed class AutosaveEffectivenessCommandValidator : AbstractValidator<AutosaveEffectivenessCommand>
{
    public AutosaveEffectivenessCommandValidator()
    {
        RuleFor(x => x.Patch.TechnicalCompetency).InclusiveBetween(1, 5).When(x => x.Patch.TechnicalCompetency.HasValue);
        RuleFor(x => x.Patch.SoftSkills).InclusiveBetween(1, 5).When(x => x.Patch.SoftSkills.HasValue);
        RuleFor(x => x.Patch.ProjectPerformance).InclusiveBetween(1, 5).When(x => x.Patch.ProjectPerformance.HasValue);
        RuleFor(x => x.Patch.OverallReadiness).InclusiveBetween(1, 5).When(x => x.Patch.OverallReadiness.HasValue);
        RuleFor(x => x.Patch.Comments).MaximumLength(2000);
        RuleFor(x => x.Patch.FutureTrainingRecommendations).MaximumLength(2000);
    }
}

public sealed class AutosaveEffectivenessCommandHandler(
    AppDbContext db,
    ICurrentUser current,
    IClock clock) : IRequestHandler<AutosaveEffectivenessCommand, EffectivenessDraftDto>
{
    public async Task<EffectivenessDraftDto> Handle(AutosaveEffectivenessCommand request, CancellationToken ct)
    {
        var supervisorId = current.RequireId();

        var cycle = await db.FeedbackCycles
            .SingleOrDefaultAsync(c => c.Id == request.CycleId, ct)
            ?? throw new NotFoundException("Cycle", request.CycleId);

        if (cycle.Type != CycleType.SupervisorEffectiveness)
        {
            throw new NotFoundException("Cycle", request.CycleId);
        }

        if (cycle.Status != CycleStatus.Open)
        {
            throw new ConflictException("This evaluation cycle is no longer open.");
        }

        var maverick = await db.Users
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
                CreatedAt = clock.UtcNow,
            };
            db.EffectivenessResponses.Add(draft);
        }

        if (draft.Status == EffectivenessResponseStatus.Submitted)
        {
            throw new ConflictException("This evaluation has already been submitted.");
        }

        draft.TechnicalCompetency = request.Patch.TechnicalCompetency;
        draft.SoftSkills = request.Patch.SoftSkills;
        draft.ProjectPerformance = request.Patch.ProjectPerformance;
        draft.OverallReadiness = request.Patch.OverallReadiness;
        draft.Comments = request.Patch.Comments;
        draft.FutureTrainingRecommendations = request.Patch.FutureTrainingRecommendations;
        draft.UpdatedAt = clock.UtcNow;

        await db.SaveChangesAsync(ct);
        return EffectivenessProjection.ToDto(draft);
    }
}
