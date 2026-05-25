using MediatR;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Modules.Analytics.Contracts;
using HexaLoop.Api.Modules.Cycles.Entities;

namespace HexaLoop.Api.Modules.Analytics.Queries;

public sealed record ListReportsQuery : IRequest<ReportListResponse>;

public sealed class ListReportsQueryHandler(AppDbContext db) : IRequestHandler<ListReportsQuery, ReportListResponse>
{
    public async Task<ReportListResponse> Handle(ListReportsQuery request, CancellationToken ct)
    {
        var rows = await db.Reports
            .AsNoTracking()
            .Include(r => r.RequestedByUser)
            .OrderByDescending(r => r.RequestedAt)
            .Take(50)
            .ToListAsync(ct);

        var data = rows.Select(r => new ReportDto(
            r.Id,
            r.Scope,
            r.Format,
            r.Status,
            r.CycleStatusFilter switch
            {
                Entities.ReportCycleStatusFilter.Open => CycleStatus.Open,
                Entities.ReportCycleStatusFilter.Closed => CycleStatus.Closed,
                Entities.ReportCycleStatusFilter.OverrideClosed => CycleStatus.OverrideClosed,
                _ => (CycleStatus?)null,
            },
            r.DateFrom,
            r.DateTo,
            r.DownloadUrl,
            r.RowCount,
            r.RequestedAt,
            r.CompletedAt,
            r.RequestedByUser?.FullName ?? "(unknown)"
        )).ToList();

        return new ReportListResponse(data);
    }
}
