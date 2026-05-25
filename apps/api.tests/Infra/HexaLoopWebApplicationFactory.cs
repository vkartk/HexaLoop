using System.Net.Http.Headers;
using System.Net.Http.Json;
using HexaLoop.Api.Infrastructure.Auth;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Modules.Users.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Testcontainers.PostgreSql;
using Xunit;

namespace HexaLoop.Api.Tests.Infra;

public sealed class HexaLoopWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("hexaloop_tests")
        .WithUsername("hexaloop")
        .WithPassword("hexaloop")
        .Build();

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
    }

    public new async Task DisposeAsync()
    {
        await _postgres.DisposeAsync();
        await base.DisposeAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = _postgres.GetConnectionString(),
                ["Jwt:SigningKey"] = "test-signing-key-test-signing-key-32+chars",
                ["Jwt:Issuer"] = "hexaloop-tests",
                ["Jwt:Audience"] = "hexaloop-tests-web",
                ["Smtp:Host"] = "localhost",
                ["Smtp:Port"] = "1025",
            });
        });

        builder.ConfigureServices(services =>
        {
            // Disable hosted services for fast, deterministic tests.
            var hosted = services.Where(d => d.ServiceType == typeof(IHostedService)).ToList();
            foreach (var d in hosted)
            {
                services.Remove(d);
            }
        });
    }

    public HttpClient AuthenticatedClient(string email, string password)
    {
        var client = CreateClient();
        var loginResp = client.PostAsJsonAsync("/api/v1/auth/login",
            new { email, password }).GetAwaiter().GetResult();
        loginResp.EnsureSuccessStatusCode();
        var session = loginResp.Content.ReadFromJsonAsync<AuthSessionDto>().GetAwaiter().GetResult()!;
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", session.AccessToken);
        return client;
    }

    public async Task<User> GetAdminAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await db.Users.FirstAsync(u => u.Role == UserRole.Admin);
    }

    public sealed record AuthSessionDto(string AccessToken, string RefreshToken, int ExpiresInSeconds);
}
