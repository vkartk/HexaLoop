using MediatR;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Modules.Courses.Entities;
using HexaLoop.Api.Modules.Trainers.Contracts;
using HexaLoop.Api.Modules.Trainers.Services;

namespace HexaLoop.Api.Modules.Trainers.Queries;

public sealed record ListTrainersQuery(
    TrainerSourcing? EngagementType,
    string? Domain,
    string? Query,
    int Page,
    int PageSize) : IRequest<TrainerPage>;

public sealed class ListTrainersQueryHandler(AppDbContext db)
    : IRequestHandler<ListTrainersQuery, TrainerPage>
{
    public async Task<TrainerPage> Handle(ListTrainersQuery request, CancellationToken ct)
    {
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var q = db.Trainers.AsNoTracking().AsQueryable();

        if (request.EngagementType.HasValue)
        {
            q = q.Where(t => t.EngagementType == request.EngagementType.Value);
        }
        if (!string.IsNullOrWhiteSpace(request.Domain))
        {
            var needle = request.Domain.Trim().ToLower();
            q = q.Where(t => t.DomainExpertise.ToLower().Contains(needle));
        }
        if (!string.IsNullOrWhiteSpace(request.Query))
        {
            var needle = request.Query.Trim().ToLower();
            q = q.Where(t =>
                t.Name.ToLower().Contains(needle)
                || (t.Organization != null && t.Organization.ToLower().Contains(needle)));
        }

        var total = await q.CountAsync(ct);

        // Hydrate the page first, then compute aggregates per trainer — the
        // stats query is per-row, but the page caps at 100 so this stays cheap.
        var pageRows = await q
            .OrderBy(t => t.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var data = new List<TrainerListRow>(pageRows.Count);
        foreach (var t in pageRows)
        {
            var agg = await TrainerStats.ComputeAsync(db, t.Id, ct);
            data.Add(TrainerStats.ToListRow(t, agg));
        }

        // Highest rating first matches the fixture sort the UI was built against.
        data = data.OrderByDescending(r => r.AvgRating).ThenBy(r => r.Name).ToList();

        return new TrainerPage(data, page, pageSize, total);
    }
}
