"use client";

import { useEffect, useRef, useState } from "react";
import { answerFor } from "@/lib/bot";
import { useDemoStore } from "@/store/demo-store";
import { openWhatsapp } from "./whatsapp-bus";

type Msg = { id: number; from: "bot" | "me"; text: string; offer?: boolean };

/**
 * Atendimento simulado (módulo `bot`): respostas pré-definidas no preset, sem IA e sem chamada externa.
 * Pergunta fora do repertório: resposta fixa de "não sei" com a oferta do WhatsApp.
 */
export default function Bot() {
  const cfg = useDemoStore((s) => s.config.bot);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const next = useRef(1);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [msgs]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!cfg) return null;
  const bot = cfg;

  function push(...m: Omit<Msg, "id">[]) {
    setMsgs((cur) => [...cur, ...m.map((x) => ({ ...x, id: next.current++ }))]);
  }
  function pick(t: { label: string; answer: string }) {
    push({ from: "me", text: t.label }, { from: "bot", text: t.answer });
  }
  function ask(question: string) {
    const q = question.trim();
    if (!q) return;
    const a = answerFor(bot, q);
    push({ from: "me", text: q }, a.kind === "topic" ? { from: "bot", text: a.topic.answer } : { from: "bot", text: bot.fallback, offer: true });
  }

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label={bot.title}
          data-testid="bot-janela"
          className="absolute bottom-full left-0 z-50 mb-sm flex max-h-[min(34rem,60vh)] w-[min(24rem,calc(100vw-2rem))] flex-col rounded-lg border border-border bg-surface shadow-lg"
        >
          <div className="flex items-start justify-between gap-sm border-b border-border p-md">
            <div>
              <p className="font-bold">{bot.title}</p>
              <p data-testid="bot-marca" className="mt-xs inline-block rounded-button border border-border bg-highlight-bg px-3 py-1 text-xs font-bold text-highlight-text">
                {bot.badge}
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={bot.closeLabel} className="inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-border">
              ×
            </button>
          </div>
          <div ref={log} role="log" aria-live="polite" data-testid="bot-conversa" className="flex min-h-40 flex-1 flex-col gap-sm overflow-y-auto p-md">
            <p className="max-w-[85%] rounded-md bg-background p-sm text-sm" data-testid="bot-msg-bot">
              {bot.greeting}
            </p>
            {msgs.map((m) => (
              <div key={m.id} className={m.from === "me" ? "self-end" : ""}>
                <p
                  data-testid={m.from === "me" ? "bot-msg-eu" : "bot-msg-bot"}
                  className={`max-w-[85%] rounded-md p-sm text-sm ${m.from === "me" ? "ml-auto bg-primary text-background" : "bg-background"}`}
                >
                  {m.text}
                </p>
                {m.offer && (
                  <button
                    type="button"
                    data-testid="bot-oferta-whatsapp"
                    onClick={() => {
                      setOpen(false);
                      openWhatsapp();
                    }}
                    className="mt-xs min-h-11 rounded-button border border-text px-md text-sm font-bold"
                  >
                    {bot.whatsappOffer}
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-xs border-t border-border px-md pt-sm">
            {bot.topics.map((t) => (
              <button key={t.id} type="button" data-testid={`bot-tema-${t.id}`} onClick={() => pick(t)} className="min-h-11 rounded-button border border-border px-md text-sm">
                {t.label}
              </button>
            ))}
          </div>
          <form
            className="flex gap-xs p-md"
            onSubmit={(e) => {
              e.preventDefault();
              ask(text);
              setText("");
            }}
          >
            <label htmlFor="bot-pergunta" className="sr-only">
              {bot.inputLabel}
            </label>
            <input
              id="bot-pergunta"
              ref={input}
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoComplete="off"
              placeholder={bot.inputLabel}
              className="h-11 min-w-0 flex-1 rounded-md border border-border bg-background px-md text-base"
            />
            <button type="submit" className="min-h-11 rounded-button bg-primary px-md font-bold text-background">
              {bot.sendLabel}
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        data-testid="bot-botao"
        className="min-h-11 rounded-lg bg-primary px-lg text-sm font-bold text-background shadow-lg"
      >
        {bot.openLabel}
      </button>
    </>
  );
}
