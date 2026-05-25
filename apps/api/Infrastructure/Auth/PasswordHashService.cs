using Microsoft.AspNetCore.Identity;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Infrastructure.Auth;

public sealed class PasswordHashService : IPasswordHashService
{
    private readonly PasswordHasher<User> _hasher = new();
    private static readonly User _placeholder = new();

    public string Hash(string password) => _hasher.HashPassword(_placeholder, password);

    public bool Verify(string hash, string password) =>
        _hasher.VerifyHashedPassword(_placeholder, hash, password)
            is PasswordVerificationResult.Success
            or PasswordVerificationResult.SuccessRehashNeeded;
}
