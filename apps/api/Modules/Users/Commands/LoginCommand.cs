using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using HexaLoop.Api.Infrastructure.Auth;
using HexaLoop.Api.Infrastructure.Errors;
using HexaLoop.Api.Infrastructure.Ids;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Infrastructure.Time;
using HexaLoop.Api.Modules.Users.Contracts;
using HexaLoop.Api.Modules.Users.Entities;
using Microsoft.Extensions.Options;

namespace HexaLoop.Api.Modules.Users.Commands;

public sealed record LoginCommand(string Email, string Password) : IRequest<AuthSession>;

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public sealed class LoginCommandHandler(
    AppDbContext db,
    IPasswordHashService passwords,
    IJwtTokenService tokens,
    IOptions<JwtSettings> jwtOptions,
    IClock clock) : IRequestHandler<LoginCommand, AuthSession>
{
    public async Task<AuthSession> Handle(LoginCommand request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == email, ct)
            ?? throw new UnauthorizedException();

        if (!user.IsActive || !passwords.Verify(user.PasswordHash, request.Password))
        {
            throw new UnauthorizedException();
        }

        var (access, expiresIn) = tokens.IssueAccessToken(user);
        var refresh = tokens.IssueRefreshToken();
        var refreshHash = tokens.HashRefreshToken(refresh);
        var now = clock.UtcNow;

        db.RefreshTokens.Add(new RefreshToken
        {
            Id = UuidV7.New(),
            UserId = user.Id,
            TokenHash = refreshHash,
            ExpiresAt = now.AddDays(jwtOptions.Value.RefreshTokenDays),
            CreatedAt = now,
        });

        await db.SaveChangesAsync(ct);

        return new AuthSession(access, refresh, expiresIn, UserDto.From(user));
    }
}
