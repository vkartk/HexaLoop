using MediatR;
using Microsoft.AspNetCore.Mvc;
using HexaLoop.Api.Modules.Users.Commands;
using HexaLoop.Api.Modules.Users.Contracts;
using HexaLoop.Api.Modules.Users.Queries;

namespace HexaLoop.Api.Modules.Users;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var auth = app.MapGroup("/auth").WithTags("auth");

        auth.MapPost("/login", async (LoginRequest body, ISender sender) =>
            {
                var session = await sender.Send(new LoginCommand(body.Email, body.Password));
                return Results.Ok(session);
            })
            .AllowAnonymous()
            .WithName("login")
            .Produces<AuthSession>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        auth.MapPost("/refresh", async (RefreshRequest body, ISender sender) =>
            {
                var session = await sender.Send(new RefreshCommand(body.RefreshToken));
                return Results.Ok(session);
            })
            .AllowAnonymous()
            .WithName("refresh")
            .Produces<AuthSession>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        auth.MapGet("/me", async (ISender sender) =>
            {
                var me = await sender.Send(new GetMeQuery());
                return Results.Ok(me);
            })
            .RequireAuthorization()
            .WithName("getMe")
            .Produces<UserDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status401Unauthorized);

        return app;
    }
}
