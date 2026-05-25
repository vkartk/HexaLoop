namespace HexaLoop.Api.Infrastructure.Auth;

public sealed class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "hexaloop";
    public string Audience { get; set; } = "hexaloop-web";
    public string SigningKey { get; set; } = string.Empty;
    public int AccessTokenSeconds { get; set; } = 900;
    public int RefreshTokenDays { get; set; } = 14;
}
