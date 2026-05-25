using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Infrastructure.Auth;

public interface IJwtTokenService
{
    (string token, int expiresInSeconds) IssueAccessToken(User user);
    string IssueRefreshToken();
    string HashRefreshToken(string token);
}
