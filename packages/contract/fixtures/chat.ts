import type { components } from '../../../apps/web/src/lib/api/schema.gen';

type Role = components['schemas']['Role'];
type ChatReply = components['schemas']['ChatReply'];
type ChatDataItem = components['schemas']['ChatDataItem'];

const ai = (sourceCount?: number): ChatReply['ai'] => ({
  aiGenerated: true,
  degraded: true,
  generatedAt: new Date().toISOString(),
  ...(sourceCount != null ? { sourceCount } : {}),
});

const reply = (
  content: string,
  opts: { suggestions?: string[]; data?: ChatReply['data']; sourceCount?: number } = {},
): ChatReply => ({
  id: crypto.randomUUID(),
  message: { role: 'assistant', content },
  ai: ai(opts.sourceCount),
  ...(opts.suggestions ? { suggestions: opts.suggestions } : {}),
  ...(opts.data ? { data: opts.data } : {}),
});

const SUGGESTIONS: Record<Role, string[]> = {
  Admin: [
    'Which cycle is at risk?',
    'Top improvement themes this quarter?',
    'How is sentiment trending?',
  ],
  Maverick: [
    'What feedback do I owe?',
    'How do I rate a trainer fairly?',
    'When is my next form due?',
  ],
  Supervisor: [
    'Show my pending evaluations',
    "What's our team readiness trend?",
    'Which Maverick needs follow-up?',
  ],
};

const matches = (text: string, keywords: string[]) =>
  keywords.some((k) => text.includes(k));

/**
 * Routes the user's last message to a canned, role-aware response.
 * This is deliberately rule-based — it's the StubAiService talking, and
 * every reply is tagged `degraded: true`.
 */
export const stubChatReply = (
  role: Role,
  userText: string,
  _context?: { route?: string | null },
): ChatReply => {
  const text = userText.toLowerCase();

  // Role-agnostic small-talk fallbacks first.
  if (matches(text, ['hello', 'hi ', 'hey'])) {
    return reply(
      "Hi! I'm the HexaLoop assistant. Right now I'm running on rules, not a real LLM — so my answers are intentionally limited.",
      { suggestions: SUGGESTIONS[role] },
    );
  }

  if (role === 'Admin') {
    if (matches(text, ['risk', 'threshold', 'below', 'cycle'])) {
      const items: ChatDataItem[] = [
        {
          label: 'Cloud Foundations — Q2 cohort',
          sublabel: '71% completion · below 78% threshold',
          href: '/admin/cycles?status=Open',
        },
        {
          label: 'Cloud Foundations — Q1 supervisor review',
          sublabel: '67% completion · below 78% threshold',
          href: '/admin/cycles?status=Open',
        },
      ];
      return reply(
        'Two open cycles are currently below the 78% completion threshold. They cannot be closed without an override-close (which writes an audit log entry).',
        {
          suggestions: ['How do I override-close a cycle?', 'Show sentiment trend'],
          data: { kind: 'list', title: 'At-risk cycles', items },
          sourceCount: 2,
        },
      );
    }
    if (matches(text, ['theme', 'improve', 'sentiment', 'feedback'])) {
      return reply(
        'Positive sentiment is at 68% across the last 418 responses (up 4 points). The most common improvement requests cluster around hands-on labs, pacing, and real project examples — concentrated in technical courses delivered by external trainers.',
        {
          suggestions: ['Which trainers drive the highest ratings?', 'Show at-risk cycles'],
          sourceCount: 418,
        },
      );
    }
    if (matches(text, ['trainer', 'rating', 'scorecard'])) {
      const items: ChatDataItem[] = [
        { label: 'Dr. Anika Rao', sublabel: 'Internal · 4.6 avg · 92% completion' },
        { label: 'Lukas Bauer', sublabel: 'NorthArrow Consulting · 4.1 avg · 78% completion' },
        { label: 'Sara Mendez', sublabel: 'Internal · 3.9 avg · 71% completion' },
      ];
      return reply(
        'Trainer scorecard summary across the last 90 days. Sara Mendez sits below the 78% completion threshold — worth a check-in before the next cohort.',
        {
          suggestions: ["Why is Sara's completion low?", 'Show at-risk cycles'],
          data: { kind: 'list', title: 'Trainer scorecard', items },
          sourceCount: 28,
        },
      );
    }
    return reply(
      "I can answer questions about cycle health, sentiment themes, and trainer performance. Try one of the suggestions below — they're tuned for L&D admins.",
      { suggestions: SUGGESTIONS.Admin },
    );
  }

  if (role === 'Maverick') {
    if (matches(text, ['pending', 'owe', 'due', 'feedback', 'my'])) {
      const items: ChatDataItem[] = [
        {
          label: 'Cloud Foundations — Module 3',
          sublabel: 'Due in 3 days · not started',
          href: '/feedback/0192e9a8-2c1d-7a30-9c91-1f6f3a47e002',
        },
        {
          label: 'Stakeholder Communication',
          sublabel: 'Due in 1 day · draft saved',
          href: '/feedback/0192e9a8-2c1d-7a30-9c91-1f6f3a47e003',
        },
      ];
      return reply(
        'You have 2 feedback forms pending. Stakeholder Communication is due first.',
        {
          suggestions: ['How do I rate a trainer fairly?', 'What happens after I submit?'],
          data: { kind: 'list', title: 'Pending feedback', items },
        },
      );
    }
    if (matches(text, ['fair', 'rate', 'rating', 'how'])) {
      return reply(
        'Think about what you experienced, not what you expected. A "3" means the course met its stated objectives. Save the 5s for sessions that genuinely exceeded — and the 1s for sessions that fell short of the basics.',
        { suggestions: ['What feedback do I owe?', 'Can I edit a submitted response?'] },
      );
    }
    if (matches(text, ['next', 'when', 'date'])) {
      return reply(
        'Your next form (Stakeholder Communication) is due in about 1 day. The Cloud Foundations module 3 form follows 2 days later.',
        { suggestions: ['What feedback do I owe?'] },
      );
    }
    return reply(
      'I can help you find what feedback you owe, when it is due, and how to rate fairly. Try one of these to get started.',
      { suggestions: SUGGESTIONS.Maverick },
    );
  }

  // Supervisor
  if (matches(text, ['pending', 'evaluation', 'queue', 'show'])) {
    const items: ChatDataItem[] = [
      {
        label: 'Priya Shah — Cloud Foundations',
        sublabel: 'Not started · due in 6 days',
        href: '/supervisor/evaluations',
      },
      {
        label: 'Daniel Okeke — Cloud Foundations',
        sublabel: 'Not started · due in 6 days',
        href: '/supervisor/evaluations',
      },
      {
        label: 'Daniel Okeke — Stakeholder Communication',
        sublabel: 'Draft saved · due in 2 days',
        href: '/supervisor/evaluations',
      },
    ];
    return reply(
      'You have 3 effectiveness evaluations pending. Daniel\'s Stakeholder Communication review is due first.',
      {
        suggestions: ["What's our team readiness trend?", 'Which Maverick needs follow-up?'],
        data: { kind: 'list', title: 'Your queue', items },
      },
    );
  }
  if (matches(text, ['team', 'trend', 'readiness'])) {
    return reply(
      'Team average readiness is 4.0 / 5 across 8 reports, up 2.3 points vs last quarter. Technical competency is the strongest dimension; project performance has the widest spread.',
      {
        suggestions: ['Show my pending evaluations', 'Which Maverick needs follow-up?'],
        sourceCount: 8,
      },
    );
  }
  if (matches(text, ['follow-up', 'follow up', 'attention', 'risk'])) {
    return reply(
      'Daniel Okeke has the highest pending evaluation count (2) and his last submission was 30 days ago. Worth a 1:1 to align on the upcoming cycle.',
      { suggestions: ['Show my pending evaluations'], sourceCount: 8 },
    );
  }
  return reply(
    "I can summarise your queue, your team's readiness trend, or flag Mavericks who need attention. Try one of these to start.",
    { suggestions: SUGGESTIONS.Supervisor },
  );
};

export const suggestionsForRole = (role: Role) => SUGGESTIONS[role];
