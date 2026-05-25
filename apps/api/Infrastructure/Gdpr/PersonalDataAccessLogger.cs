using Serilog.Context;
using HexaLoop.Api.Infrastructure.Auth;

namespace HexaLoop.Api.Infrastructure.Gdpr;

/// Emits a structured "PersonalDataAccess" Serilog event whenever an authenticated
/// request hits any of the personal-data endpoints. Lightweight stand-in for the
/// proper audit table — sufficient for GDPR posture in dev; ship to SIEM in prod.
public sealed class PersonalDataAccessLogger(
    RequestDelegate next,
    ILogger<PersonalDataAccessLogger> logger)
{
    private static readonly string[] PersonalDataPrefixes =
    {
        "/api/v1/auth/me",
        "/api/v1/feedback/",
        "/api/v1/effectiveness/",
        "/api/v1/dashboard/maverick",
        "/api/v1/dashboard/supervisor",
    };

    public async Task InvokeAsync(HttpContext context, ICurrentUser current)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        var matches = PersonalDataPrefixes.Any(prefix =>
            path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase));

        if (matches && current.IsAuthenticated && current.Id is { } userId)
        {
            using (LogContext.PushProperty("event", "PersonalDataAccess"))
            using (LogContext.PushProperty("actorId", userId))
            using (LogContext.PushProperty("actorRole", current.Role))
            using (LogContext.PushProperty("path", path))
            using (LogContext.PushProperty("method", context.Request.Method))
            {
                logger.LogInformation(
                    "PersonalDataAccess {Method} {Path} by {ActorId}",
                    context.Request.Method, path, userId);
            }
        }

        await next(context);
    }
}
