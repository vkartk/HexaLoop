using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using HexaLoop.Api.Infrastructure.Auth;
using HexaLoop.Api.Infrastructure.Errors;
using HexaLoop.Api.Infrastructure.Ids;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Infrastructure.Time;
using HexaLoop.Api.Modules.Users.Contracts;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Modules.Users.Commands;

public sealed record RefreshCommand(string RefreshToken) : IRequest<AuthSession>;

public sealed class RefreshCommandValidator : AbstractValidator<RefreshCommand>
{
    public RefreshCommandValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}

public sealed class RefreshCommandHandler(
    AppDbContext db,
    IJwtTokenService tokens,
    IOptions<JwtSettings> jwtOptions,
    IClock clock) : IRequestHandler<RefreshCommand, AuthSession>
{
    public async Task<AuthSession> Handle(RefreshCommand request, CancellationToken ct)
    {
        var hash = tokens.HashRefreshToken(request.RefreshToken);
        var now = clock.UtcNow;

        var existing = await db.RefreshTokens
            .Include(rt => rt.User)
            .SingleOrDefaultAsync(rt => rt.TokenHash == hash, ct);

        if (existing is null || existing.User is null || !existing.IsActive(now) || !existing.User.IsActive)
        {
            throw new UnauthorizedException("Refresh token invalid or expired.");
        }

        // Rotate: revoke old, issue new.
        existing.RevokedAt = now;

        var (access, expiresIn) = tokens.IssueAccessToken(existing.User);
        var newRefresh = tokens.IssueRefreshToken();

        db.RefreshTokens.Add(new RefreshToken
        {
            Id = UuidV7.New(),
            UserId = existing.UserId,
            TokenHash = tokens.HashRefreshToken(newRefresh),
            ExpiresAt = now.AddDays(jwtOptions.Value.RefreshTokenDays),
            CreatedAt = now,
        });

        await db.SaveChangesAsync(ct);
        return new AuthSession(access, newRefresh, expiresIn, UserDto.From(existing.User));
    }
}
