namespace HexaLoop.Api.Infrastructure.Email;

public sealed class SmtpSettings
{
    public const string SectionName = "Smtp";

    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 1025;
    public string FromAddress { get; set; } = "no-reply@hexaloop.dev";
    public string FromName { get; set; } = "HexaLoop";
    public bool UseStartTls { get; set; }
    public string? Username { get; set; }
    public string? Password { get; set; }
}
