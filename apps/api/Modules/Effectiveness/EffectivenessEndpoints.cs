using MediatR;
using HexaLoop.Api.Modules.Effectiveness.Commands;
using HexaLoop.Api.Modules.Effectiveness.Contracts;
using HexaLoop.Api.Modules.Effectiveness.Queries;

namespace HexaLoop.Api.Modules.Effectiveness;

public static class EffectivenessEndpoints
{
    public static IEndpointRouteBuilder MapEffectivenessEndpoints(this IEndpointRouteBuilder app)
    {
        var eff = app.MapGroup("/effectiveness").RequireAuthorization("Supervisor").WithTags("effectiveness");

        eff.MapGet("/pending", async (ISender sender) =>
                Results.Ok(await sender.Send(new ListPendingEffectivenessQuery())))
            .WithName("listPendingEffectiveness")
            .Produces<EffectivenessQueue>(StatusCodes.Status200OK);

        eff.MapGet("/{cycleId:guid}/{maverickId:guid}", async (
                Guid cycleId, Guid maverickId, ISender sender) =>
            {
                var bundle = await sender.Send(new GetEffectivenessFormQuery(cycleId, maverickId));
                return Results.Ok(bundle);
            })
            .WithName("getEffectivenessForm")
            .Produces<EffectivenessFormBundle>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        eff.MapPut("/{cycleId:guid}/{maverickId:guid}", async (
                Guid cycleId, Guid maverickId, EffectivenessDraftPatch body, ISender sender) =>
            {
                var dto = await sender.Send(new AutosaveEffectivenessCommand(cycleId, maverickId, body));
                return Results.Ok(dto);
            })
            .WithName("autosaveEffectiveness")
            .Produces<EffectivenessDraftDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict);

        eff.MapPost("/{cycleId:guid}/{maverickId:guid}/submit", async (
                Guid cycleId, Guid maverickId, EffectivenessSubmitBody body, ISender sender) =>
            {
                var dto = await sender.Send(new SubmitEffectivenessCommand(cycleId, maverickId, body));
                return Results.Ok(dto);
            })
            .WithName("submitEffectiveness")
            .Produces<EffectivenessDraftDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict);

        return app;
    }
}
