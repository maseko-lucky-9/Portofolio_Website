/**
 * Recruiter chat widget — launcher + non-modal panel, talking to POST /api/chat.
 *
 * Deliberately a plain <div> rather than the Radix Dialog/Sheet primitives that are
 * already in src/components/ui. Not a bundle-size decision (Dialog's heavy deps are
 * already in radix-vendor via dropdown-menu): Radix Dialog is modal by default —
 * focus trap, aria-modal, scroll lock, outside-click dismiss. A chat panel must let
 * the visitor keep reading and scrolling the page underneath, so we would be passing
 * modal={false} and then fighting FocusScope for behaviour a <div> gives for free.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { personalData } from "@/data/personal";

type Msg = { role: "user" | "assistant"; content: string };

const MAX_CHARS = 500;
const MAX_HISTORY = 6;

const SUGGESTIONS = [
  "What's his Kubernetes background?",
  "Does he have fintech experience?",
  "Is he available for contract work?",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [live, setLive] = useState(""); // in-flight assistant text
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [draft, setDraft] = useState("");

  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Escape closes and returns focus to the launcher. No focus trap — the panel is
  // intentionally non-modal, so tabbing out to the page is correct behaviour.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    inputRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [msgs, live]);

  const send = useCallback(
    async (text: string) => {
      const q = text.trim().slice(0, MAX_CHARS);
      if (!q || busy) return;

      const next = [...msgs, { role: "user" as const, content: q }];
      setMsgs(next);
      setDraft("");
      setErr("");
      setLive("");
      setBusy(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: next.slice(-MAX_HISTORY) }),
        });

        if (!res.ok || !res.body) {
          const j = (await res.json().catch(() => ({}))) as { message?: string };
          setErr(j.message ?? `Something went wrong. Email ${personalData.email}.`);
          return;
        }

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let out = "";

        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          // Keep the trailing partial frame: Workers AI splits JSON mid-object across
          // TCP chunks, and dropping it silently loses tokens in a way that reads as
          // a model bug rather than a parsing bug.
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              out += (JSON.parse(payload) as { response?: string }).response ?? "";
              setLive(out);
            } catch {
              /* frame split across chunks — the buffer retries it next pass */
            }
          }
        }

        if (out) setMsgs((m) => [...m, { role: "assistant", content: out }]);
        else setErr(`The assistant stopped early. Email ${personalData.email}.`);
      } catch {
        setErr(`Couldn't reach the assistant. Email ${personalData.email}.`);
      } finally {
        setLive("");
        setBusy(false);
      }
    },
    [busy, msgs],
  );

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-label="Ask about Thulani's experience"
        className="fixed bottom-6 right-6 z-[70] w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
        style={{
          boxShadow: "var(--shadow-lg)",
          transition: "transform var(--duration-fast) var(--ease-spring)",
        }}
      >
        {open ? <X size={22} /> : <MessageSquare size={22} />}
      </button>

      {open && (
        <div
          id="chat-panel"
          role="dialog"
          aria-label="Ask about Thulani's experience"
          className="glass-card fixed z-[70] flex flex-col overflow-hidden right-0 bottom-0 sm:right-6 sm:bottom-24"
          style={{
            // min() rather than a sm: breakpoint utility: one inline value covers
            // full-bleed mobile and a 380 px desktop panel, and costs zero CSS bytes
            // (arbitrary Tailwind values like sm:w-[380px] emit escaped selectors
            // that gzip poorly, and the CSS budget has only ~4.8 KB of headroom).
            width: "min(100vw, 380px)",
            height: "min(80dvh, 560px)",
            boxShadow: "var(--shadow-lg)",
            // dvh above, not vh, so the iOS keyboard doesn't push the composer
            // off-screen; safe-area keeps it clear of the home indicator.
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "oklch(var(--border) / 0.6)" }}
          >
            <span className="text-sm font-semibold">Ask about Thulani</span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                launcherRef.current?.focus();
              }}
              aria-label="Close chat"
              className="text-muted-foreground"
            >
              <X size={18} />
            </button>
          </div>

          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            // Lenis (SmoothScroll.tsx) preventDefaults every wheel event and virtual-scrolls
            // the document, so without this opt-out the log never scrolls at all. Scoped
            // here rather than flipping Lenis's global allowNestedScroll, which would change
            // wheel handling for every scrollable and add an ancestor walk per event.
            data-lenis-prevent
            // overscroll-contain is the other half: data-lenis-prevent only makes Lenis
            // stand down, so at the log's scroll boundary the wheel chained to the document
            // and jumped the page behind the panel — and as a native scroll, not a smoothed
            // one. Together they keep the wheel inside the LOG at any scroll position.
            // Scoped to the log, not the panel: wheeling over the header or composer still
            // scrolls the page, which is pre-existing and fine for a non-modal panel.
            className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-4 flex flex-col gap-3"
          >
            {msgs.length === 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  I answer questions about Thulani's experience, skills and availability.
                </p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="self-start text-left text-sm bg-muted text-foreground rounded-2xl px-4 py-2"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {msgs.map((m, i) => (
              <p
                key={i}
                className={`${
                  m.role === "user"
                    ? "self-end bg-primary text-primary-foreground"
                    : "self-start bg-muted text-foreground"
                } rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words`}
                style={{ maxWidth: "85%" }}
              >
                {m.content}
              </p>
            ))}

            {/* Rendered OUTSIDE the live region: streaming tokens into aria-live makes
                a screen reader re-read the whole answer on every chunk. The finished
                text is appended to msgs above, which announces once. */}
            {live && (
              <p
                aria-hidden="true"
                className="self-start bg-muted text-foreground rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words"
                style={{ maxWidth: "85%" }}
              >
                {live}
              </p>
            )}

            {busy && !live && <p className="text-xs text-muted-foreground">Thinking…</p>}
            {err && <p className="text-sm text-muted-foreground">{err}</p>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
            className="flex items-end gap-2 p-3 border-t"
            style={{ borderColor: "oklch(var(--border) / 0.6)" }}
          >
            <Textarea
              ref={inputRef}
              rows={1}
              value={draft}
              maxLength={MAX_CHARS}
              enterKeyHint="send"
              placeholder="Ask a question…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(draft);
                }
              }}
              className="min-h-0 h-10 py-2 resize-none"
            />
            <Button type="submit" size="icon" disabled={busy || !draft.trim()} aria-label="Send">
              <Send size={16} />
            </Button>
          </form>

          <p className="px-4 pb-3 text-xs text-muted-foreground">
            AI assistant — it can be wrong. Please don't share personal details.
          </p>
        </div>
      )}
    </>
  );
}
