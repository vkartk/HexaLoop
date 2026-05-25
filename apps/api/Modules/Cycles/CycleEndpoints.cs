using MediatR;
using HexaLoop.Api.Modules.Cycles.Commands;
using HexaLoop.Api.Modules.Cycles.Contracts;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Cycles.Queries;

namespace HexaLoop.Api.Modules.Cycles;

public static class CycleEndpoints
{
    public static IEndpointRouteBuilder MapCycleEndpoints(this IEndpointRouteBuilder app)
    {
        var cycles = app.MapGroup("/cycles").RequireAuthorization("Admin").WithTags("cycles");

        cycles.MapGet("", async (
                CycleStatus? status,
                CycleType? type,
                string? q,
                int? page,
                int? pageSize,
                ISender sender) =>
            {
                var result = await sender.Send(new ListCyclesQuery(
                    status, type, q, page ?? 1, pageSize ?? 20));
                return Results.Ok(result);
            })
            .WithName("listCycles")
            .Produces<CyclePage>(StatusCodes.Status200OK);

        cycles.MapPost("/{cycleId:guid}/close", async (Guid cycleId, ISender sender) =>
            {
                var dto = await sender.Send(new CloseCycleCommand(cycleId));
                return Results.Ok(dto);
            })
            .WithName("closeCycle")
            .Produces<CycleDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status404NotFound);

        cycles.MapGet("/{cycleId:guid}/insights", async (Guid cycleId, ISender sender) =>
            {
                var insights = await sender.Send(new GetCycleInsightsQuery(cycleId));
                return Results.Ok(insights);
            })
            .WithName("getCycleInsights")
            .Produces<CycleInsightsResponse>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        cycles.MapPost("/{cycleId:guid}/override-close", async (
                Guid cycleId, OverrideCloseRequest body, ISender sender) =>
            {
                var dto = await sender.Send(new OverrideCloseCycleCommand(cycleId, body.Reason));
                return Results.Ok(dto);
            })
            .WithName("overrideCloseCycle")
            .Produces<CycleDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status409Conflict);

        return app;
    }
}
