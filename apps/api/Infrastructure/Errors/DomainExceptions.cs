namespace HexaLoop.Api.Infrastructure.Errors;

public abstract class DomainException : Exception
{
    protected DomainException(string title, string detail, int status)
        : base(detail)
    {
        Title = title;
        Detail = detail;
        Status = status;
    }

    public string Title { get; }
    public string Detail { get; }
    public int Status { get; }
    public virtual IReadOnlyDictionary<string, object?> Extensions => _empty;

    private static readonly IReadOnlyDictionary<string, object?> _empty =
        new Dictionary<string, object?>();
}

public sealed class NotFoundException(string resource, object key)
    : DomainException("Not Found", $"{resource} '{key}' was not found.", StatusCodes.Status404NotFound);

public sealed class ConflictException(string detail)
    : DomainException("Conflict", detail, StatusCodes.Status409Conflict);

public sealed class ForbiddenException(string detail)
    : DomainException("Forbidden", detail, StatusCodes.Status403Forbidden);

public sealed class UnauthorizedException(string detail = "Invalid credentials")
    : DomainException("Unauthorized", detail, StatusCodes.Status401Unauthorized);

public sealed class ValidationException : DomainException
{
    public ValidationException(IDictionary<string, string[]> errors)
        : base("Validation Failed", "One or more validation errors occurred.", StatusCodes.Status400BadRequest)
    {
        Errors = errors;
    }

    public IDictionary<string, string[]> Errors { get; }

    public override IReadOnlyDictionary<string, object?> Extensions =>
        new Dictionary<string, object?> { ["errors"] = Errors };
}

public sealed class BelowThresholdException : DomainException
{
    public BelowThresholdException(Guid cycleId, double currentRate, double requiredRate)
        : base(
            "Below Threshold",
            $"Completion rate {currentRate:P0} is below the required {requiredRate:P0}.",
            StatusCodes.Status409Conflict)
    {
        CycleId = cycleId;
        CurrentRate = currentRate;
        RequiredRate = requiredRate;
    }

    public Guid CycleId { get; }
    public double CurrentRate { get; }
    public double RequiredRate { get; }

    public override IReadOnlyDictionary<string, object?> Extensions =>
        new Dictionary<string, object?>
        {
            ["cycleId"] = CycleId,
            ["currentRate"] = CurrentRate,
            ["requiredRate"] = RequiredRate,
        };
}
