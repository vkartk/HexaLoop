using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Modules.Feedback.Entities;
using HexaLoop.Api.Tests.Infra;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HexaLoop.Api.Tests.Cycles;

public sealed class CloseFlowTests(HexaLoopWebApplicationFactory factory) : IClassFixture<HexaLoopWebApplicationFactory>
{
    [Fact]
    public async Task Close_below_threshold_returns_409_with_machine_readable_rates()
    {
        var heroCycleId = await FindOpenCycleAsync(CycleType.MaverickPostTraining);

        var client = factory.AuthenticatedClient("admin@hexaloop.dev", "demo");
        var resp = await client.PostAsync($"/api/v1/cycles/{heroCycleId}/close", content: null);

        resp.StatusCode.Should().Be(HttpStatusCode.Conflict);
        resp.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");

        var problem = await resp.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("status").GetInt32().Should().Be(409);
        problem.GetProperty("cycleId").GetGuid().Should().Be(heroCycleId);
        problem.GetProperty("currentRate").GetDouble().Should().BeLessThan(0.78);
        problem.GetProperty("requiredRate").GetDouble().Should().Be(0.78);
        problem.GetProperty("traceId").GetString().Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Close_at_or_above_threshold_succeeds_and_marks_cycle_closed()
    {
        var cycleId = await SeedFullyResponsiveCycleAsync();

        var client = factory.AuthenticatedClient("admin@hexaloop.dev", "demo");
        var resp = await client.PostAsync($"/api/v1/cycles/{cycleId}/close", content: null);

        resp.StatusCode.Should().Be(HttpStatusCode.OK);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var cycle = await db.FeedbackCycles.AsNoTracking().SingleAsync(c => c.Id == cycleId);
        cycle.Status.Should().Be(CycleStatus.Closed);
        cycle.ClosedAt.Should().NotBeNull();
        cycle.OverrideReason.Should().BeNull();
    }

    private async Task<Guid> FindOpenCycleAsync(CycleType type)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await db.FeedbackCycles
            .Where(c => c.Status == CycleStatus.Open && c.Type == type)
            .Select(c => c.Id)
            .FirstAsync();
    }

    private async Task<Guid> SeedFullyResponsiveCycleAsync()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var cycleId = await FindOpenCycleAsync(CycleType.MaverickPostTraining);
        var drafts = await db.FeedbackResponses
            .Where(r => r.CycleId == cycleId)
            .ToListAsync();

        foreach (var d in drafts.Where(r => r.Status != FeedbackResponseStatus.Submitted))
        {
            d.OverallRating = 4;
            d.Highlights = "auto-filled for test";
            d.Improvements = "auto-filled for test";
            d.Status = FeedbackResponseStatus.Submitted;
            d.SubmittedAt = DateTimeOffset.UtcNow;
            d.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync();
        return cycleId;
    }
}
