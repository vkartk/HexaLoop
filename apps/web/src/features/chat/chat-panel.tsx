import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronRight,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { AiBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useChatStore } from '@/stores/chat-store';
import { useSendChat } from './use-chat';
import { suggestionsForRole } from '@hexaloop/contract/fixtures';
import type { components } from '@/lib/api/schema.gen';

type ChatReply = components['schemas']['ChatReply'];

export const ChatPanel = () => {
  const user = useAuthStore((s) => s.user);
  const { open, setOpen, messages, pending, error, clear } = useChatStore();
  const location = useLocation();
  const send = useSendChat();
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Latest reply drives the suggestion chips when present.
  const latestSuggestions = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m?.kind === 'assistant') return m.reply.suggestions ?? [];
    }
    return user ? suggestionsForRole(user.role) : [];
  }, [messages, user]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, pending]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  if (!user) return null;

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setDraft('');
    send.mutate({ content: trimmed, route: location.pathname });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(draft);
    }
  };

  return createPortal(
    <div
      aria-hidden={!open}
      className={cn(
        'fixed inset-0 z-40 transition-opacity duration-200',
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <button
        type="button"
        aria-label="Close assistant"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-black/30"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="HexaLoop assistant"
        className={cn(
          'absolute inset-y-0 right-0 flex w-full flex-col bg-surface shadow-card transition-transform duration-200',
          'md:w-[420px]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="flex items-center justify-between border-b-hairline border-border px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ai-50 text-ai-600">
              <Sparkles className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">Ask HexaLoop</p>
              <p className="truncate text-[11px] text-ink-subtle">
                Stub assistant · {user.role.toLowerCase()} view
              </p>
            </div>
            <AiBadge degraded className="ml-1" />
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clear}
                aria-label="Clear conversation"
                title="Clear conversation"
                className="rounded p-1.5 text-ink-subtle hover:bg-surface-alt hover:text-ink focus-ring"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded p-1.5 text-ink-subtle hover:bg-surface-alt hover:text-ink focus-ring"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </header>

        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && <EmptyHint role={user.role} />}
          <ul className="flex flex-col gap-3">
            {messages.map((m) =>
              m.kind === 'user' ? (
                <UserBubble key={m.id} content={m.content} />
              ) : (
                <AssistantBubble key={m.id} reply={m.reply} />
              ),
            )}
          </ul>
          {pending && <ThinkingBubble />}
          {error && (
            <div
              role="alert"
              className="mt-3 rounded-md border-hairline border-red-100 bg-red-50 px-3 py-2 text-[12px] text-red-700"
            >
              {error}
            </div>
          )}
        </div>

        {latestSuggestions.length > 0 && (
          <div className="border-t-hairline border-border bg-surface-alt px-4 py-2">
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-ink-subtle">
              Try asking
            </p>
            <div className="flex flex-wrap gap-1.5">
              {latestSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  disabled={pending}
                  className="rounded-full border-hairline border-border bg-surface px-3 py-1 text-[12px] text-ink-muted hover:border-ai-200 hover:bg-ai-50 hover:text-ai-600 focus-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(draft);
          }}
          className="border-t-hairline border-border px-4 py-3"
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Ask anything about your training programme…"
              className="min-h-[40px] max-h-32 flex-1 resize-y rounded-md border-hairline border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus-ring focus-visible:border-brand"
            />
            <Button
              type="submit"
              size="md"
              disabled={pending || draft.trim().length === 0}
              aria-label="Send"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
            </Button>
          </div>
          <p className="mt-1.5 text-[11px] text-ink-subtle">
            Enter to send · Shift+Enter for a new line
          </p>
        </form>
      </aside>
    </div>,
    document.body,
  );
};

const EmptyHint = ({ role }: { role: components['schemas']['Role'] }) => (
  <div className="flex flex-col items-center gap-2 py-8 text-center">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ai-50 text-ai-600">
      <Sparkles className="h-5 w-5" aria-hidden />
    </div>
    <p className="text-sm font-medium text-ink">Hi — I'm the HexaLoop assistant.</p>
    <p className="max-w-[280px] text-[12px] text-ink-muted">
      I can summarise your {role.toLowerCase()} view, point at things that need attention, and link
      to the right page. Replies are basic estimates while I'm running on rules.
    </p>
  </div>
);

const UserBubble = ({ content }: { content: string }) => (
  <li className="flex justify-end">
    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-brand px-3 py-2 text-[13px] text-white">
      {content}
    </div>
  </li>
);

const AssistantBubble = ({ reply }: { reply: ChatReply }) => (
  <li className="flex">
    <div className="flex max-w-[92%] flex-col gap-2">
      <div className="rounded-2xl rounded-bl-md border-hairline border-border bg-surface-alt px-3 py-2 text-[13px] text-ink">
        <p className="whitespace-pre-wrap leading-relaxed">{reply.message.content}</p>
        {reply.data && reply.data.items.length > 0 && (
          <DataList data={reply.data} />
        )}
        <div className="mt-2 flex items-center gap-2 border-t-hairline border-border pt-2 text-[11px] text-ink-subtle">
          <AiBadge degraded={reply.ai.degraded} />
          {reply.ai.sourceCount != null && <span>Based on {reply.ai.sourceCount} sources</span>}
          <button
            type="button"
            className="ml-auto font-medium text-ai-600 hover:underline focus-ring rounded"
          >
            View source
          </button>
        </div>
      </div>
    </div>
  </li>
);

const DataList = ({ data }: { data: NonNullable<ChatReply['data']> }) => {
  const { setOpen } = useChatStore();
  return (
    <div className="mt-3">
      {data.title && (
        <p className="mb-1 text-[11px] uppercase tracking-wide text-ink-subtle">{data.title}</p>
      )}
      <ul className="divide-y divide-border rounded-md border-hairline border-border bg-surface">
        {data.items.map((item, i) => {
          const body = (
            <div className="flex items-center gap-2 px-3 py-2 text-[12px]">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{item.label}</p>
                {item.sublabel && (
                  <p className="truncate text-[11px] text-ink-subtle">{item.sublabel}</p>
                )}
              </div>
              {item.href && <ChevronRight className="h-3.5 w-3.5 text-ink-subtle" aria-hidden />}
            </div>
          );
          return (
            <li key={`${item.label}-${i}`}>
              {item.href ? (
                <Link
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className="block hover:bg-surface-alt focus-ring"
                >
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const ThinkingBubble = () => (
  <div className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-muted" aria-live="polite">
    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
    Thinking…
  </div>
);
