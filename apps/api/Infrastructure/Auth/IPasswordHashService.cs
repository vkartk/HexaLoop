namespace HexaLoop.Api.Infrastructure.Auth;

public interface IPasswordHashService
{
    string Hash(string password);
    bool Verify(string hash, string password);
}
