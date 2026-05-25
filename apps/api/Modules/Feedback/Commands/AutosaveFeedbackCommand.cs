using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Auth;
using HexaLoop.Api.Infrastructure.Errors;
using HexaLoop.Api.Infrastructure.Ids;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Infrastructure.Time;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Feedback.Contracts;
using HexaLoop.Api.Modules.Feedback.Entities;
using HexaLoop.Api.Modules.Feedback.Queries;

namespace HexaLoop.Api.Modules.Feedback.Commands;

public sealed record AutosaveFeedbackCommand(Guid CycleId, FeedbackDraftPatch Patch) : IRequest<FeedbackDraftDto>;

public sealed class AutosaveFeedbackCommandValidator : AbstractValidator<AutosaveFeedbackCommand>
{
    public AutosaveFeedbackCommandValidator()
    {
        RuleFor(x => x.Patch.OverallRating).InclusiveBetween(1, 5).When(x => x.Patch.OverallRating.HasValue);
        RuleFor(x => x.Patch.Highlights).MaximumLength(2000);
        RuleFor(x => x.Patch.Improvements).MaximumLength(2000);
    }
}

public sealed class AutosaveFeedbackCommandHandler(
    AppDbContext db,
    ICurrentUser current,
    IClock clock) : IRequestHandler<AutosaveFeedbackCommand, FeedbackDraftDto>
{
    public async Task<FeedbackDraftDto> Handle(AutosaveFeedbackCommand request, CancellationToken ct)
    {
        var userId = current.RequireId();

        var cycle = await db.FeedbackCycles
            .SingleOrDefaultAsync(c => c.Id == request.CycleId, ct)
            ?? throw new NotFoundException("Cycle", request.CycleId);

        if (cycle.Type != CycleType.MaverickPostTraining)
        {
            throw new NotFoundException("Cycle", request.CycleId);
        }

        var draft = await db.FeedbackResponses
            .SingleOrDefaultAsync(r => r.CycleId == request.CycleId && r.MaverickId == userId, ct);

        if (draft is null)
        {
            draft = new FeedbackResponse
            {
                Id = UuidV7.New(),
                CycleId = request.CycleId,
                MaverickId = userId,
                Status = FeedbackResponseStatus.Draft,
                CreatedAt = clock.UtcNow,
            };
            db.FeedbackResponses.Add(draft);
        }

        if (draft.Status == FeedbackResponseStatus.Submitted)
        {
            throw new ConflictException("This feedback has already been submitted and can no longer be edited.");
        }

        if (cycle.Status != CycleStatus.Open)
        {
            throw new ConflictException("This feedback cycle is no longer open.");
        }

        draft.OverallRating = request.Patch.OverallRating;
        draft.Highlights = request.Patch.Highlights;
        draft.Improvements = request.Patch.Improvements;
        draft.UpdatedAt = clock.UtcNow;

        await db.SaveChangesAsync(ct);
        return GetFeedbackFormQueryHandler.ToDto(draft);
    }
}
