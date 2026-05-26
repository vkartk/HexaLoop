using MediatR;
using HexaLoop.Api.Modules.People.Contracts;
using HexaLoop.Api.Modules.People.Queries;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Modules.People;

public static class PeopleEndpoints
{
    public static IEndpointRouteBuilder MapPeopleEndpoints(this IEndpointRouteBuilder app)
    {
        var people = app.MapGroup("/people").RequireAuthorization("Admin").WithTags("people");

        people.MapGet("", async (
                UserRole? role,
                PersonStatus? status,
                string? q,
                int? page,
                int? pageSize,
                ISender sender) =>
            {
                var result = await sender.Send(new ListPeopleQuery(
                    role, status, q, page ?? 1, pageSize ?? 25));
                return Results.Ok(result);
            })
            .WithName("listPeople")
            .Produces<PeoplePage>(StatusCodes.Status200OK);

        return app;
    }
}
