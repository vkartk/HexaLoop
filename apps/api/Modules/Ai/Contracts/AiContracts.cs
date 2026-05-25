using HexaLoop.Api.Modules.Feedback.Entities;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Modules.Ai.Contracts;

public sealed record AiInsightResult(
    double SentimentPositive,
    double SentimentNeutral,
    double SentimentNegative,
    IReadOnlyList<string> TopThemes,
    string Summary,
    IReadOnlyList<string> Recommendations,
    int SourceCount,
    bool Degraded);

public sealed record NudgeContext(
    Guid UserId,
    string FullName,
    string CourseName,
    string? TrainerName,
    DateTimeOffset DueAt);

public sealed record NudgeCopy(string Subject, string Body, bool Degraded);

public sealed record ChatRequest(IReadOnlyList<ChatMessage> Messages, ChatContext? Context);

public sealed record ChatMessage(string Role, string Content);

public sealed record ChatContext(string? Route);

public sealed record ChatReply(
    Guid Id,
    ChatMessage Message,
    IReadOnlyList<string>? Suggestions,
    ChatData? Data,
    AiBadge Ai);

public sealed record ChatData(string Kind, string? Title, IReadOnlyList<ChatDataItem> Items);

public sealed record ChatDataItem(string Label, string? Sublabel, string? Href);
