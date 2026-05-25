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

public sealed record SubmitFeedbackCommand(Guid CycleId, FeedbackSubmitBody Body) : IRequest<FeedbackDraftDto>;

public sealed class SubmitFeedbackCommandValidator : AbstractValidator<SubmitFeedbackCommand>
{
    public SubmitFeedbackCommandValidator()
    {
        RuleFor(x => x.Body.OverallRating).InclusiveBetween(1, 5);
        RuleFor(x => x.Body.Highlights).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Body.Improvements).NotEmpty().MaximumLength(2000);
    }
}

public sealed class SubmitFeedbackCommandHandler(
    AppDbContext db,
    ICurrentUser current,
    IClock clock) : IRequestHandler<SubmitFeedbackCommand, FeedbackDraftDto>
{
    public async Task<FeedbackDraftDto> Handle(SubmitFeedbackCommand request, CancellationToken ct)
    {
        var userId = current.RequireId();

        var cycle = await db.FeedbackCycles
            .SingleOrDefaultAsync(c => c.Id == request.CycleId, ct)
            ?? throw new NotFoundException("Cycle", request.CycleId);

        if (cycle.Type != CycleType.MaverickPostTraining)
        {
            throw new NotFoundException("Cycle", request.CycleId);
        }

        if (cycle.Status != CycleStatus.Open)
        {
            throw new ConflictException("This feedback cycle is no longer open.");
        }

        var now = clock.UtcNow;
        var draft = await db.FeedbackResponses
            .SingleOrDefaultAsync(r => r.CycleId == request.CycleId && r.MaverickId == userId, ct);

        if (draft is null)
        {
            draft = new FeedbackResponse
            {
                Id = UuidV7.New(),
                CycleId = request.CycleId,
                MaverickId = userId,
                CreatedAt = now,
            };
            db.FeedbackResponses.Add(draft);
        }
        else if (draft.Status == FeedbackResponseStatus.Submitted)
        {
            throw new ConflictException("This feedback has already been submitted.");
        }

        draft.OverallRating = request.Body.OverallRating;
        draft.Highlights = request.Body.Highlights;
        draft.Improvements = request.Body.Improvements;
        draft.Status = FeedbackResponseStatus.Submitted;
        draft.SubmittedAt = now;
        draft.UpdatedAt = now;

        await db.SaveChangesAsync(ct);
        return GetFeedbackFormQueryHandler.ToDto(draft);
    }
}
