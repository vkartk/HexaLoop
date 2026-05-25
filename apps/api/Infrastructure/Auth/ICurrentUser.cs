using System.Security.Claims;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Infrastructure.Auth;

public interface ICurrentUser
{
    Guid? Id { get; }
    string? Email { get; }
    UserRole? Role { get; }
    bool IsAuthenticated { get; }
    Guid RequireId();
}

public sealed class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public Guid? Id => TryGetId();

    public string? Email => accessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Email)
        ?? accessor.HttpContext?.User?.FindFirstValue("email");

    public UserRole? Role
    {
        get
        {
            var raw = accessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Role);
            return Enum.TryParse<UserRole>(raw, out var role) ? role : null;
        }
    }

    public bool IsAuthenticated => accessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

    public Guid RequireId() =>
        TryGetId() ?? throw new Errors.UnauthorizedException("Authenticated user required.");

    private Guid? TryGetId()
    {
        var raw = accessor.HttpContext?.User?.FindFirstValue("sub")
            ?? accessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out var id) ? id : null;
    }
}
