using MediatR;
using HexaLoop.Api.Modules.Notifications.Commands;
using HexaLoop.Api.Modules.Notifications.Contracts;
using HexaLoop.Api.Modules.Notifications.Queries;

namespace HexaLoop.Api.Modules.Notifications;

public static class NotificationEndpoints
{
    public static IEndpointRouteBuilder MapNotificationEndpoints(this IEndpointRouteBuilder app)
    {
        var notifications = app.MapGroup("/notifications").RequireAuthorization().WithTags("notifications");

        notifications.MapGet("", async (bool? unreadOnly, ISender sender) =>
            {
                var result = await sender.Send(new ListNotificationsQuery(unreadOnly ?? false));
                return Results.Ok(result);
            })
            .WithName("listNotifications")
            .Produces<NotificationListResponse>(StatusCodes.Status200OK);

        notifications.MapPost("/{notificationId:guid}/read", async (Guid notificationId, ISender sender) =>
            {
                var dto = await sender.Send(new MarkNotificationReadCommand(notificationId));
                return Results.Ok(dto);
            })
            .WithName("markNotificationRead")
            .Produces<NotificationDto>(StatusCodes.Status200OK)
            .ProducesProblem(StatusCodes.Status404NotFound);

        return app;
    }
}
