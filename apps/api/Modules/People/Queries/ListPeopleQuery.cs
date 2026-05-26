using MediatR;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Modules.People.Contracts;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Modules.People.Queries;

public sealed record ListPeopleQuery(
    UserRole? Role,
    PersonStatus? Status,
    string? Query,
    int Page,
    int PageSize) : IRequest<PeoplePage>;

public sealed class ListPeopleQueryHandler(AppDbContext db)
    : IRequestHandler<ListPeopleQuery, PeoplePage>
{
    public async Task<PeoplePage> Handle(ListPeopleQuery request, CancellationToken ct)
    {
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var q = db.Users.AsNoTracking().AsQueryable();

        if (request.Role.HasValue)
        {
            q = q.Where(u => u.Role == request.Role.Value);
        }
        if (request.Status.HasValue)
        {
            var wantActive = request.Status.Value == PersonStatus.Active;
            q = q.Where(u => u.IsActive == wantActive);
        }
        if (!string.IsNullOrWhiteSpace(request.Query))
        {
            var needle = request.Query.Trim().ToLower();
            q = q.Where(u =>
                u.FullName.ToLower().Contains(needle)
                || u.Email.ToLower().Contains(needle)
                || (u.EmployeeCode != null && u.EmployeeCode.ToLower().Contains(needle)));
        }

        var total = await q.CountAsync(ct);

        var users = await q
            .OrderBy(u => u.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var managerIds = users
            .Where(u => u.ManagerId.HasValue)
            .Select(u => u.ManagerId!.Value)
            .Distinct()
            .ToArray();

        var managers = managerIds.Length == 0
            ? new Dictionary<Guid, string>()
            : await db.Users
                .AsNoTracking()
                .Where(m => managerIds.Contains(m.Id))
                .ToDictionaryAsync(m => m.Id, m => m.FullName, ct);

        var userIds = users.Select(u => u.Id).ToArray();
        var lastTokenByUser = await db.RefreshTokens
            .AsNoTracking()
            .Where(t => userIds.Contains(t.UserId))
            .GroupBy(t => t.UserId)
            .Select(g => new { UserId = g.Key, LastAt = g.Max(t => t.CreatedAt) })
            .ToDictionaryAsync(x => x.UserId, x => x.LastAt, ct);

        var data = users.Select(u => new PersonRow(
            u.Id,
            u.FullName,
            u.Email,
            u.Role,
            u.IsActive ? PersonStatus.Active : PersonStatus.Inactive,
            u.EmployeeCode,
            u.ManagerId,
            u.ManagerId is { } mid && managers.TryGetValue(mid, out var name) ? name : null,
            lastTokenByUser.TryGetValue(u.Id, out var at) ? at : null
        )).ToList();

        return new PeoplePage(data, page, pageSize, total);
    }
}
