using MediatR;
using HexaLoop.Api.Modules.Courses.Entities;
using HexaLoop.Api.Modules.Trainers.Contracts;
using HexaLoop.Api.Modules.Trainers.Queries;

namespace HexaLoop.Api.Modules.Trainers;

public static class TrainerEndpoints
{
    public static IEndpointRouteBuilder MapTrainerEndpoints(this IEndpointRouteBuilder app)
    {
        var trainers = app.MapGroup("/trainers").RequireAuthorization("Admin").WithTags("trainers");

        trainers.MapGet("", async (
                TrainerSourcing? engagementType,
                string? domain,
                string? q,
                int? page,
                int? pageSize,
                ISender sender) =>
            {
                var result = await sender.Send(new ListTrainersQuery(
                    engagementType, domain, q, page ?? 1, pageSize ?? 20));
                return Results.Ok(result);
            })
            .WithName("listTrainers")
            .Produces<TrainerPage>(StatusCodes.Status200OK);

        trainers.MapGet("/{trainerId:guid}/scorecard", async (Guid trainerId, ISender sender) =>
            {
                var dto = await sender.Send(new GetTrainerScorecardQuery(trainerId));
                return Results.Ok(dto);
            })
            .WithName("getTrainerScorecard")
            .Produces<TrainerScorecard>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return app;
    }
}
