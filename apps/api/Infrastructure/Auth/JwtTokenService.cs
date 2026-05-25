using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using HexaLoop.Api.Infrastructure.Time;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Infrastructure.Auth;

public sealed class JwtTokenService(IOptions<JwtSettings> options, IClock clock) : IJwtTokenService
{
    private readonly JwtSettings _settings = options.Value;

    public (string token, int expiresInSeconds) IssueAccessToken(User user)
    {
        var now = clock.UtcNow.UtcDateTime;
        var expires = now.AddSeconds(_settings.AccessTokenSeconds);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("fullName", user.FullName),
        };

        if (user.EmployeeCode is not null)
        {
            claims.Add(new Claim("employeeCode", user.EmployeeCode));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var jwt = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            notBefore: now,
            expires: expires,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(jwt), _settings.AccessTokenSeconds);
    }

    public string IssueRefreshToken()
    {
        Span<byte> buffer = stackalloc byte[48];
        RandomNumberGenerator.Fill(buffer);
        return Convert.ToBase64String(buffer);
    }

    public string HashRefreshToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }
}
