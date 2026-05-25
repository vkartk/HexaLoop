using HexaLoop.Api.Modules.Ai.Contracts;
using HexaLoop.Api.Modules.Feedback.Entities;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Modules.Ai;

/// The AI seam. Modules depend on this interface only — never on the
/// implementation. Today StubAiService is wired in DI; in Phase 2 a single
/// DI line swaps in HttpAiService (Python FastAPI) with zero changes here.
public interface IAiService
{
    Task<AiInsightResult> GenerateInsightsAsync(
        Guid cycleId,
        IEnumerable<FeedbackResponse> responses,
        CancellationToken ct = default);

    Task<NudgeCopy> PersonalizeNudgeAsync(NudgeContext context, CancellationToken ct = default);

    Task<ChatReply> ChatAsync(ChatRequest request, UserRole? role, CancellationToken ct = default);
}
