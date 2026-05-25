using FluentAssertions;
using HexaLoop.Api.Infrastructure.Time;
using HexaLoop.Api.Modules.Ai;
using HexaLoop.Api.Modules.Ai.Contracts;
using HexaLoop.Api.Modules.Feedback.Entities;
using HexaLoop.Api.Modules.Users.Entities;
using Xunit;

namespace HexaLoop.Api.Tests.Ai;

public sealed class StubAiServiceTests
{
    private readonly IAiService _ai = new StubAiService(new SystemClock());

    [Fact]
    public async Task GenerateInsights_groups_sentiment_by_rating_rule()
    {
        var responses = new[]
        {
            Submit(5, "Best training in months. Loved the hands-on labs."),
            Submit(4, "Labs were the highlight. Trainer was great."),
            Submit(3, "Pace was OK."),
            Submit(2, "Felt rushed."),
            Submit(1, "Pacing was terrible, very rushed."),
        };

        var result = await _ai.GenerateInsightsAsync(Guid.NewGuid(), responses);

        result.Degraded.Should().BeTrue();
        result.SourceCount.Should().Be(5);
        result.SentimentPositive.Should().Be(0.4); // 2 of 5
        result.SentimentNeutral.Should().Be(0.2);  // 1 of 5
        result.SentimentNegative.Should().Be(0.4); // 2 of 5
        result.Summary.Should().NotBeNullOrEmpty();
        result.Recommendations.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GenerateInsights_zero_responses_is_safe()
    {
        var result = await _ai.GenerateInsightsAsync(Guid.NewGuid(), Array.Empty<FeedbackResponse>());

        result.SourceCount.Should().Be(0);
        result.SentimentPositive.Should().Be(0);
        result.Summary.Should().NotBeNullOrEmpty();
        result.Degraded.Should().BeTrue();
    }

    [Fact]
    public async Task Chat_routes_by_keyword_and_returns_degraded_badge()
    {
        var reply = await _ai.ChatAsync(
            new ChatRequest([new ChatMessage("user", "which cycle is at risk?")], null),
            role: UserRole.Admin);

        reply.Message.Role.Should().Be("assistant");
        reply.Message.Content.Should().Contain("threshold");
        reply.Ai.Degraded.Should().BeTrue();
        reply.Ai.AiGenerated.Should().BeTrue();
        reply.Suggestions.Should().NotBeNull();
    }

    private static FeedbackResponse Submit(int rating, string text) => new()
    {
        Id = Guid.NewGuid(),
        CycleId = Guid.Empty,
        MaverickId = Guid.Empty,
        OverallRating = rating,
        Highlights = text,
        Improvements = text,
        Status = FeedbackResponseStatus.Submitted,
        SubmittedAt = DateTimeOffset.UtcNow,
        UpdatedAt = DateTimeOffset.UtcNow,
        CreatedAt = DateTimeOffset.UtcNow,
    };
}
