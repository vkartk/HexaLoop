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

namespace HexaLoop.Api.Modules.Feedback.Queries;

public sealed record GetFeedbackFormQuery(Guid CycleId) : IRequest<FeedbackFormBundle>;

public sealed class GetFeedbackFormQueryHandler(
    AppDbContext db,
    ICurrentUser current,
    IClock clock) : IRequestHandler<GetFeedbackFormQuery, FeedbackFormBundle>
{
    public async Task<FeedbackFormBundle> Handle(GetFeedbackFormQuery request, CancellationToken ct)
    {
        var userId = current.RequireId();

        var cycle = await db.FeedbackCycles
            .AsNoTracking()
            .Include(c => c.Session).ThenInclude(s => s!.Course)
            .Include(c => c.Session).ThenInclude(s => s!.Trainer)
            .SingleOrDefaultAsync(c => c.Id == request.CycleId, ct)
            ?? throw new NotFoundException("Cycle", request.CycleId);

        if (cycle.Type != CycleType.MaverickPostTraining)
        {
            throw new NotFoundException("Cycle", request.CycleId);
        }

        var existing = await db.FeedbackResponses
            .SingleOrDefaultAsync(r => r.CycleId == request.CycleId && r.MaverickId == userId, ct);

        if (existing is null)
        {
            existing = new FeedbackResponse
            {
                Id = UuidV7.New(),
                CycleId = cycle.Id,
                MaverickId = userId,
                Status = FeedbackResponseStatus.Draft,
                UpdatedAt = clock.UtcNow,
                CreatedAt = clock.UtcNow,
            };
            db.FeedbackResponses.Add(existing);
            await db.SaveChangesAsync(ct);
        }

        var courseName = cycle.Session?.Course?.Name ?? "(unknown)";
        var trainerName = cycle.Session?.Trainer?.Name;
        var sessionEndedAt = cycle.Session?.EndDate;
        var dueAt = (cycle.Session?.EndDate ?? cycle.OpensAt).AddDays(7);

        return new FeedbackFormBundle(
            new FeedbackCycleContextDto(cycle.Id, courseName, trainerName, sessionEndedAt, dueAt, cycle.Status),
            ToDto(existing));
    }

    internal static FeedbackDraftDto ToDto(FeedbackResponse r) => new(
        r.CycleId,
        r.OverallRating,
        r.Highlights,
        r.Improvements,
        r.Status,
        r.UpdatedAt,
        r.SubmittedAt);
}
