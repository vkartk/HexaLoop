using System.Net.Http.Json;
using FluentAssertions;
using HexaLoop.Api.Infrastructure.Persistence;
using HexaLoop.Api.Modules.Cycles.Entities;
using HexaLoop.Api.Tests.Infra;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HexaLoop.Api.Tests.Feedback;

public sealed class AutosaveIdempotencyTests(HexaLoopWebApplicationFactory factory) : IClassFixture<HexaLoopWebApplicationFactory>
{
    [Fact]
    public async Task PUT_twice_with_same_body_yields_one_row_and_identical_payload()
    {
        var cycleId = await FindOpenCycleAsync();
        var client = factory.AuthenticatedClient("maverick@hexaloop.dev", "demo");
        var body = new
        {
            overallRating = 4,
            highlights = "Loved the labs.",
            improvements = "Pacing felt rushed in module 2.",
        };

        var first = await client.PutAsJsonAsync($"/api/v1/feedback/{cycleId}", body);
        first.IsSuccessStatusCode.Should().BeTrue();
        var firstDraft = await first.Content.ReadFromJsonAsync<FeedbackDraftLite>();

        var second = await client.PutAsJsonAsync($"/api/v1/feedback/{cycleId}", body);
        second.IsSuccessStatusCode.Should().BeTrue();
        var secondDraft = await second.Content.ReadFromJsonAsync<FeedbackDraftLite>();

        firstDraft!.CycleId.Should().Be(secondDraft!.CycleId);
        firstDraft.OverallRating.Should().Be(secondDraft.OverallRating);
        firstDraft.Highlights.Should().Be(secondDraft.Highlights);
        firstDraft.Improvements.Should().Be(secondDraft.Improvements);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var rows = await db.FeedbackResponses
            .Where(r => r.CycleId == cycleId)
            .CountAsync(r => r.Highlights == "Loved the labs.");
        rows.Should().Be(1, "autosaving the same body twice MUST NOT create a second row.");
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

    private sealed record FeedbackDraftLite(
        Guid CycleId,
        int? OverallRating,
        string? Highlights,
        string? Improvements,
        string Status);
}
