using MediatR;
using HexaLoop.Api.Modules.Analytics.Contracts;
using HexaLoop.Api.Modules.Analytics.Queries;

namespace HexaLoop.Api.Modules.Analytics;

public static class DashboardEndpoints
{
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var dash = app.MapGroup("/dashboard").RequireAuthorization().WithTags("dashboard");

        dash.MapGet("/admin", async (ISender sender) =>
                Results.Ok(await sender.Send(new GetAdminDashboardQuery())))
            .RequireAuthorization("Admin")
            .WithName("getAdminDashboard")
            .Produces<AdminDashboard>(StatusCodes.Status200OK);

        dash.MapGet("/maverick", async (ISender sender) =>
                Results.Ok(await sender.Send(new GetMaverickDashboardQuery())))
            .RequireAuthorization("Maverick")
            .WithName("getMaverickDashboard")
            .Produces<MaverickDashboard>(StatusCodes.Status200OK);

        dash.MapGet("/supervisor", async (ISender sender) =>
                Results.Ok(await sender.Send(new GetSupervisorDashboardQuery())))
            .RequireAuthorization("Supervisor")
            .WithName("getSupervisorDashboard")
            .Produces<SupervisorDashboard>(StatusCodes.Status200OK);

        return app;
    }
}
