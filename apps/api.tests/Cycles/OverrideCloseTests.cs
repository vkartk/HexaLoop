using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Tests.Infra;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HexaLoop.Api.Tests.Cycles;

public sealed class OverrideCloseTests(HexaLoopWebApplicationFactory factory) : IClassFixture<HexaLoopWebApplicationFactory>
{
    [Fact]
    public async Task Override_close_writes_AuditLog_row_and_persists_reason()
    {
        var cycleId = await FindOpenCycleAsync();

        var client = factory.AuthenticatedClient("admin@hexaloop.dev", "demo");
        var resp = await client.PostAsJsonAsync(
            $"/api/v1/cycles/{cycleId}/override-close",
            new { reason = "Hero cycle stuck at 60% — closing manually to unblock the demo." });

        resp.StatusCode.Should().Be(HttpStatusCode.OK);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var cycle = await db.FeedbackCycles.AsNoTracking().SingleAsync(c => c.Id == cycleId);
        cycle.Status.Should().Be(CycleStatus.OverrideClosed);
        cycle.OverrideReason.Should().NotBeNullOrEmpty();

        var audit = await db.AuditLogs
            .AsNoTracking()
            .Where(a => a.Action == "cycle.override-close" && a.EntityId == cycleId.ToString())
            .OrderByDescending(a => a.CreatedAt)
            .FirstOrDefaultAsync();
        audit.Should().NotBeNull("the override-close MUST write an audit row");
        var meta = JsonDocument.Parse(audit!.MetadataJson).RootElement;
        meta.GetProperty("reason").GetString().Should().StartWith("Hero cycle stuck");
    }

    [Fact]
    public async Task Non_admin_caller_is_forbidden()
    {
        var cycleId = await FindOpenCycleAsync();

        var supervisorClient = factory.AuthenticatedClient("supervisor@hexaloop.dev", "demo");
        var resp = await supervisorClient.PostAsJsonAsync(
            $"/api/v1/cycles/{cycleId}/override-close",
            new { reason = "Supervisor should not be allowed to override-close." });

        resp.StatusCode.Should().BeOneOf(HttpStatusCode.Forbidden, HttpStatusCode.Unauthorized);
    }

    private async Task<Guid> FindOpenCycleAsync()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await db.FeedbackCycles
            .Where(c => c.Status == CycleStatus.Open && c.Type == CycleType.MaverickPostTraining)
            .Select(c => c.Id)
            .FirstAsync();
    }
}
