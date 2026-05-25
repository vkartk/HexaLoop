using MediatR;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Auth;
using HexaLoop.Api.Infrastructure.Errors;
using HexaLoop.Api.Infrastructure.Ids;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Infrastructure.Time;
using HexaLoop.Api.Modules.Analytics.Contracts;
using HexaLoop.Api.Modules.Analytics.Entities;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Modules.Analytics.Commands;

public sealed record TriggerReportCommand(ReportRequest Request) : IRequest<ReportDto>;

public sealed class TriggerReportCommandHandler(
    AppDbContext db,
    ICurrentUser current,
    IClock clock) : IRequestHandler<TriggerReportCommand, ReportDto>
{
    public async Task<ReportDto> Handle(TriggerReportCommand request, CancellationToken ct)
    {
        if (current.Role != UserRole.Admin)
        {
            throw new ForbiddenException("Only Admin users may trigger reports.");
        }

        var actorId = current.RequireId();
        var now = clock.UtcNow;

        var entity = new Report
        {
            Id = UuidV7.New(),
            RequestedByUserId = actorId,
            Scope = request.Request.Scope,
            Format = request.Request.Format,
            CycleStatusFilter = request.Request.CycleStatus switch
            {
                CycleStatus.Open => ReportCycleStatusFilter.Open,
                CycleStatus.Closed => ReportCycleStatusFilter.Closed,
                CycleStatus.OverrideClosed => ReportCycleStatusFilter.OverrideClosed,
                _ => null,
            },
            DateFrom = request.Request.DateFrom,
            DateTo = request.Request.DateTo,
            // Stub: mark Ready immediately. A real implementation would queue a job.
            Status = ReportStatus.Ready,
            RowCount = await EstimateRowCountAsync(request.Request, ct),
            DownloadUrl = $"/api/v1/reports/{Guid.NewGuid()}/download",
            RequestedAt = now,
            CompletedAt = now,
        };

        db.Reports.Add(entity);
        await db.SaveChangesAsync(ct);

        var requestedByName = await db.Users.Where(u => u.Id == actorId)
            .Select(u => u.FullName).FirstAsync(ct);

        return new ReportDto(
            entity.Id,
            entity.Scope,
            entity.Format,
            entity.Status,
            request.Request.CycleStatus,
            entity.DateFrom,
            entity.DateTo,
            entity.DownloadUrl,
            entity.RowCount,
            entity.RequestedAt,
            entity.CompletedAt,
            requestedByName);
    }

    private async Task<int> EstimateRowCountAsync(ReportRequest req, CancellationToken ct) =>
        req.Scope switch
        {
            ReportScope.Cycles => await db.FeedbackCycles.CountAsync(ct),
            ReportScope.Trainers => await db.Trainers.CountAsync(ct),
            ReportScope.Sentiment => await db.FeedbackResponses.CountAsync(ct),
            _ => 0,
        };
}
