using HexaLoop.Api.Infrastructure.Auth;
using HexaLoop.Api.Modules.Ai.Contracts;

namespace HexaLoop.Api.Modules.Ai;

public static class ChatEndpoints
{
    public static IEndpointRouteBuilder MapChatEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/chat", async (ChatRequest body, IAiService ai, ICurrentUser current, CancellationToken ct) =>
            {
                var reply = await ai.ChatAsync(body, current.Role, ct);
                return Results.Ok(reply);
            })
            .RequireAuthorization()
            .WithTags("chat")
            .WithName("chat")
            .Produces<ChatReply>(StatusCodes.Status200OK);

        return app;
    }
}
