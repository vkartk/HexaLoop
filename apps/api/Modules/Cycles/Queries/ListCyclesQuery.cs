using MediatR;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Modules.Cycles.Contracts;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Cycles.Services;

namespace HexaLoop.Api.Modules.Cycles.Queries;

public sealed record ListCyclesQuery(
    CycleStatus? Status,
    CycleType? Type,
    string? Query,
    int Page,
    int PageSize) : IRequest<CyclePage>;

public sealed class ListCyclesQueryHandler(AppDbContext db) : IRequestHandler<ListCyclesQuery, CyclePage>
{
    public async Task<CyclePage> Handle(ListCyclesQuery request, CancellationToken ct)
    {
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var q = db.FeedbackCycles
            .AsNoTracking()
            .Include(c => c.Session).ThenInclude(s => s!.Course)
            .Include(c => c.Session).ThenInclude(s => s!.Trainer)
            .AsQueryable();

        if (request.Status.HasValue)
        {
            q = q.Where(c => c.Status == request.Status.Value);
        }
        if (request.Type.HasValue)
        {
            q = q.Where(c => c.Type == request.Type.Value);
        }
        if (!string.IsNullOrWhiteSpace(request.Query))
        {
            var needle = request.Query.Trim().ToLowerInvariant();
            q = q.Where(c =>
                (c.Session!.Course!.Name.ToLower().Contains(needle))
                || (c.Session.Trainer!.Name.ToLower().Contains(needle)));
        }

        var total = await q.CountAsync(ct);

        var entities = await q
            .OrderByDescending(c => c.OpensAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var data = new List<CycleDto>(entities.Count);
        foreach (var e in entities)
        {
            data.Add(await CycleProjection.ProjectAsync(db, e, ct));
        }

        return new CyclePage(data, page, pageSize, total);
    }
}
