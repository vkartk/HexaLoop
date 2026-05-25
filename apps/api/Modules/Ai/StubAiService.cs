using System.Text.RegularExpressions;
using HexaLoop.Api.Infrastructure.Ids;
using HexaLoop.Api.Infrastructure.Time;
using HexaLoop.Api.Modules.Ai.Contracts;
using HexaLoop.Api.Modules.Feedback.Entities;
using HexaLoop.Api.Modules.Users.Entities;

namespace HexaLoop.Api.Modules.Ai;

/// Day-one rule-based stub. Same interface as the future HttpAiService.
/// Always sets degraded=true so the UI labels values subtly.
public sealed class StubAiService(IClock clock) : IAiService
{
    private static readonly HashSet<string> Stopwords = new(StringComparer.OrdinalIgnoreCase)
    {
        "the","and","for","with","this","that","they","very","were","have","has","but","just","into",
        "from","than","then","more","much","some","such","our","you","your","not","was","are","its",
        "their","there","what","when","which","while","also","like","felt","good","bad","ok","okay",
        "really","quite","still","most","made","make","make","get","got","be","is","of","in","on","to","a","an","i",
    };

    public Task<AiInsightResult> GenerateInsightsAsync(
        Guid cycleId,
        IEnumerable<FeedbackResponse> responses,
        CancellationToken ct = default)
    {
        var submitted = responses
            .Where(r => r.Status == FeedbackResponseStatus.Submitted && r.OverallRating != null)
            .ToList();

        var total = submitted.Count;
        var positive = submitted.Count(r => r.OverallRating >= 4);
        var neutral = submitted.Count(r => r.OverallRating == 3);
        var negative = submitted.Count(r => r.OverallRating <= 2);

        double pP = total == 0 ? 0 : Math.Round(positive / (double)total, 4);
        double pN = total == 0 ? 0 : Math.Round(neutral / (double)total, 4);
        double pNeg = total == 0 ? 0 : Math.Round(negative / (double)total, 4);

        var themes = ExtractThemes(submitted);

        string summary;
        if (total == 0)
        {
            summary = "No submitted feedback yet. Insights will appear once responses arrive.";
        }
        else
        {
            var avg = submitted.Average(r => r.OverallRating!.Value);
            summary = $"Across {total} submitted response{(total == 1 ? "" : "s")}, the average rating is " +
                $"{avg:0.0}/5 with {pP:P0} positive and {pNeg:P0} negative sentiment. " +
                (themes.Count > 0
                    ? $"Recurring themes include {string.Join(", ", themes.Take(3))}."
                    : "No strong recurring themes detected yet.");
        }

        var recommendations = new List<string>();
        if (pNeg >= 0.20) recommendations.Add("Reach out to maverick(s) who rated 1-2 with a personalized follow-up.");
        if (total > 0 && themes.Any(t => t.Contains("pace", StringComparison.OrdinalIgnoreCase)
            || t.Contains("rushed", StringComparison.OrdinalIgnoreCase)))
        {
            recommendations.Add("Consider trimming module 2 content next run — pacing is a recurring complaint.");
        }
        if (recommendations.Count == 0 && total > 0)
        {
            recommendations.Add("Share positive highlights with the trainer; no critical issues detected.");
        }

        return Task.FromResult(new AiInsightResult(
            pP, pN, pNeg, themes, summary, recommendations, total, Degraded: true));
    }

    public Task<NudgeCopy> PersonalizeNudgeAsync(NudgeContext context, CancellationToken ct = default)
    {
        var daysLeft = (int)Math.Max(0, Math.Round((context.DueAt - clock.UtcNow).TotalDays));
        var subject = daysLeft <= 1
            ? $"Reminder: {context.CourseName} feedback due tomorrow"
            : $"Reminder: {context.CourseName} feedback due in {daysLeft} days";

        var body =
            $"Hi {context.FullName.Split(' ').FirstOrDefault() ?? "there"},\n\n" +
            $"This is a friendly nudge to complete your feedback for \"{context.CourseName}\"" +
            (context.TrainerName is null ? "" : $" with {context.TrainerName}") + ". " +
            "Most people finish in under a minute. Thanks for helping us improve every cohort.\n\n" +
            "— The HexaLoop team";

        return Task.FromResult(new NudgeCopy(subject, body, Degraded: true));
    }

    public Task<ChatReply> ChatAsync(ChatRequest request, UserRole? role, CancellationToken ct = default)
    {
        var lastUserMessage = request.Messages.LastOrDefault(m => m.Role == "user")?.Content ?? string.Empty;
        var lower = lastUserMessage.ToLowerInvariant();

        string reply;
        IReadOnlyList<string>? suggestions;
        ChatData? data = null;

        if (lower.Contains("at risk") || lower.Contains("threshold") || lower.Contains("below"))
        {
            reply = "Cycles below threshold are flagged in red on the admin dashboard. The current hero cycle is roughly 60% complete — well below the 78% threshold and a candidate for either reminder escalation or an Admin override-close.";
            suggestions = ["Show me the alerts", "Open override-close flow", "Send reminders"];
        }
        else if (role == UserRole.Maverick && (lower.Contains("pending") || lower.Contains("due")))
        {
            reply = "Your pending feedback items are on the Maverick dashboard. Drafts auto-save as you type — you don't need to submit in one go.";
            suggestions = ["Open my pending feedback", "What's my streak?"];
        }
        else if (role == UserRole.Supervisor && (lower.Contains("queue") || lower.Contains("evaluations")))
        {
            reply = "Your evaluation queue lives at /supervisor/evaluations. Items are sorted by due date — the most urgent appears first.";
            suggestions = ["Show overdue items", "Mark draft as done"];
        }
        else if (lower.Contains("trainer"))
        {
            reply = "Trainer scorecards rank by average rating across sessions. Numbers come from completed Maverick feedback only.";
            suggestions = ["Top trainer this quarter", "Trainer below 3.5"];
        }
        else
        {
            reply = "I'm the HexaLoop assistant. I can summarize cycle health, point you at pending work, or help draft a nudge. What would you like to look at?";
            suggestions = ["Which cycles are at risk?", "Show me alerts", "Where are my pending items?"];
        }

        return Task.FromResult(new ChatReply(
            UuidV7.New(),
            new ChatMessage("assistant", reply),
            suggestions,
            data,
            new AiBadge(true, true, clock.UtcNow, null)));
    }

    private static List<string> ExtractThemes(IEnumerable<FeedbackResponse> responses)
    {
        var bag = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var pattern = new Regex(@"[a-zA-Z]{4,}", RegexOptions.Compiled);

        foreach (var r in responses)
        {
            var text = (r.Highlights ?? string.Empty) + " " + (r.Improvements ?? string.Empty);
            foreach (Match m in pattern.Matches(text))
            {
                var word = m.Value.ToLowerInvariant();
                if (Stopwords.Contains(word)) continue;
                bag[word] = bag.GetValueOrDefault(word) + 1;
            }
        }

        return bag
            .Where(kv => kv.Value >= 2)
            .OrderByDescending(kv => kv.Value)
            .ThenBy(kv => kv.Key)
            .Take(5)
            .Select(kv => CapitalizeFirst(kv.Key))
            .ToList();
    }

    private static string CapitalizeFirst(string s) =>
        s.Length == 0 ? s : char.ToUpperInvariant(s[0]) + s[1..];
}
