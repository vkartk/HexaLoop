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

public sealed record SubmitEffectivenessCommand(
    Guid CycleId,
    Guid MaverickId,
    EffectivenessSubmitBody Body) : IRequest<EffectivenessDraftDto>;

public sealed class SubmitEffectivenessCommandValidator : AbstractValidator<SubmitEffectivenessCommand>
{
    public SubmitEffectivenessCommandValidator()
    {
        RuleFor(x => x.Body.TechnicalCompetency).InclusiveBetween(1, 5);
        RuleFor(x => x.Body.SoftSkills).InclusiveBetween(1, 5);
        RuleFor(x => x.Body.ProjectPerformance).InclusiveBetween(1, 5);
        RuleFor(x => x.Body.OverallReadiness).InclusiveBetween(1, 5);
        RuleFor(x => x.Body.Comments).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Body.FutureTrainingRecommendations).MaximumLength(2000);
    }
}

public sealed class SubmitEffectivenessCommandHandler(
    AppDbContext db,
    ICurrentUser current,
    IClock clock) : IRequestHandler<SubmitEffectivenessCommand, EffectivenessDraftDto>
{
    public async Task<EffectivenessDraftDto> Handle(SubmitEffectivenessCommand request, CancellationToken ct)
    {
        var supervisorId = current.RequireId();
        var now = clock.UtcNow;

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
                CreatedAt = now,
            };
            db.EffectivenessResponses.Add(draft);
        }
        else if (draft.Status == EffectivenessResponseStatus.Submitted)
        {
            throw new ConflictException("This evaluation has already been submitted.");
        }

        draft.TechnicalCompetency = request.Body.TechnicalCompetency;
        draft.SoftSkills = request.Body.SoftSkills;
        draft.ProjectPerformance = request.Body.ProjectPerformance;
        draft.OverallReadiness = request.Body.OverallReadiness;
        draft.Comments = request.Body.Comments;
        draft.FutureTrainingRecommendations = request.Body.FutureTrainingRecommendations;
        draft.Status = EffectivenessResponseStatus.Submitted;
        draft.SubmittedAt = now;
        draft.UpdatedAt = now;

        await db.SaveChangesAsync(ct);
        return EffectivenessProjection.ToDto(draft);
    }
}
