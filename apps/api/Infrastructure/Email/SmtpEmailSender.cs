using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace HexaLoop.Api.Infrastructure.Email;

public sealed class SmtpEmailSender(
    IOptions<SmtpSettings> options,
    ILogger<SmtpEmailSender> logger) : IEmailSender
{
    private readonly SmtpSettings _settings = options.Value;

    public async Task SendAsync(string toEmail, string toName, string subject, string body, CancellationToken ct = default)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = subject;
        message.Body = new TextPart("plain") { Text = body };

        using var client = new SmtpClient();
        var secureOption = _settings.UseStartTls
            ? SecureSocketOptions.StartTlsWhenAvailable
            : SecureSocketOptions.None;

        await client.ConnectAsync(_settings.Host, _settings.Port, secureOption, ct);

        if (!string.IsNullOrEmpty(_settings.Username))
        {
            await client.AuthenticateAsync(_settings.Username, _settings.Password ?? string.Empty, ct);
        }

        await client.SendAsync(message, ct);
        await client.DisconnectAsync(quit: true, ct);

        logger.LogInformation("Email sent to {Email} subject {Subject}", toEmail, subject);
    }
}
