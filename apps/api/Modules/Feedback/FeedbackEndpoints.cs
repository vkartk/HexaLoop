using MediatR;
using HexaLoop.Api.Modules.Feedback.Commands;
using HexaLoop.Api.Modules.Feedback.Contracts;
using HexaLoop.Api.Modules.Feedback.Queries;

namespace HexaLoop.Api.Modules.Feedback;

public static class FeedbackEndpoints
{
    public static IEndpointRouteBuilder MapFeedbackEndpoints(this IEndpointRouteBuilder app)
    {
        var fb = app.MapGroup("/feedback").RequireAuthorization("Maverick").WithTags("feedback");

        fb.MapGet("/{cycleId:guid}", async (Guid cycleId, ISender sender) =>
            {
                var bundle = await sender.Send(new GetFeedbackFormQuery(cycleId));
                return Results.Ok(bundle);
            })
            .WithName("getFeedbackForm")
            .Produces<FeedbackFormBundle>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        fb.MapPut("/{cycleId:guid}", async (Guid cycleId, FeedbackDraftPatch body, ISender sender) =>
            {
                var draft = await sender.Send(new AutosaveFeedbackCommand(cycleId, body));
                return Results.Ok(draft);
            })
            .WithName("autosaveFeedback")
            .Produces<FeedbackDraftDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict);

        fb.MapPost("/{cycleId:guid}/submit", async (Guid cycleId, FeedbackSubmitBody body, ISender sender) =>
            {
                var draft = await sender.Send(new SubmitFeedbackCommand(cycleId, body));
                return Results.Ok(draft);
            })
            .WithName("submitFeedback")
            .Produces<FeedbackDraftDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status409Conflict);

        return app;
    }
}
