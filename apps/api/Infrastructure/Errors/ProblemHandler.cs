using System.Diagnostics;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace HexaLoop.Api.Infrastructure.Errors;

public static class ProblemHandler
{
    public static IServiceCollection AddDomainProblemDetails(this IServiceCollection services)
    {
        services.AddProblemDetails(options =>
        {
            options.CustomizeProblemDetails = ctx =>
            {
                ctx.ProblemDetails.Type ??= "about:blank";
                ctx.ProblemDetails.Extensions["traceId"] =
                    Activity.Current?.Id ?? ctx.HttpContext.TraceIdentifier;
            };
        });

        services.AddExceptionHandler<DomainExceptionHandler>();
        return services;
    }
}

public sealed class DomainExceptionHandler(
    IProblemDetailsService problemDetails,
    ILogger<DomainExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is not DomainException domain)
        {
            logger.LogError(exception, "Unhandled exception");
            return false;
        }

        var problem = new ProblemDetails
        {
            Type = "about:blank",
            Title = domain.Title,
            Status = domain.Status,
            Detail = domain.Detail,
        };

        foreach (var (key, value) in domain.Extensions)
        {
            problem.Extensions[key] = value;
        }

        problem.Extensions["traceId"] =
            Activity.Current?.Id ?? httpContext.TraceIdentifier;

        httpContext.Response.StatusCode = domain.Status;
        httpContext.Response.ContentType = "application/problem+json";

        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problem,
        });
    }
}
