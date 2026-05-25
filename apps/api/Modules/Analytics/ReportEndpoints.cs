using MediatR;
using HexaLoop.Api.Modules.Analytics.Commands;
using HexaLoop.Api.Modules.Analytics.Contracts;
using HexaLoop.Api.Modules.Analytics.Queries;

namespace HexaLoop.Api.Modules.Analytics;

public static class ReportEndpoints
{
    public static IEndpointRouteBuilder MapReportEndpoints(this IEndpointRouteBuilder app)
    {
        var reports = app.MapGroup("/reports").RequireAuthorization().WithTags("reports");

        reports.MapGet("", async (ISender sender) =>
                Results.Ok(await sender.Send(new ListReportsQuery())))
            .WithName("listReports")
            .Produces<ReportListResponse>(StatusCodes.Status200OK);

        reports.MapPost("", async (ReportRequest body, ISender sender) =>
            {
                var dto = await sender.Send(new TriggerReportCommand(body));
                return Results.Accepted(uri: $"/api/v1/reports", dto);
            })
            .RequireAuthorization("Admin")
            .WithName("triggerReport")
            .Produces<ReportDto>(StatusCodes.Status202Accepted)
            .ProducesProblem(StatusCodes.Status403Forbidden);

        return app;
    }
}
