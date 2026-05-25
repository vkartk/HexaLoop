namespace HexaLoop.Api.Modules.Users.Contracts;

public sealed record LoginRequest(string Email, string Password);

public sealed record RefreshRequest(string RefreshToken);

public sealed record AuthSession(
    string AccessToken,
    string RefreshToken,
    int ExpiresInSeconds,
    UserDto User);
