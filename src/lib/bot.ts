import type { BotConfig, BotTopic } from "@/domain/types";

/** Minúsculas, sem acento e sem pontuação: "Qual o PRAZO?" → "qual o prazo". */
export function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type BotAnswer = { kind: "topic"; topic: BotTopic } | { kind: "fallback" };

/**
 * Resposta pré-definida do preset: o primeiro tema (na ordem do preset) que tem uma palavra-chave dentro da pergunta.
 * Palavra-chave de mais de uma palavra ("troca e devolucao") vale se a frase inteira aparece. Sem IA e sem chamada externa.
 */
export function answerFor(bot: BotConfig, question: string): BotAnswer {
  const q = ` ${normalizeQuestion(question)} `;
  if (q.trim() === "") return { kind: "fallback" };
  for (const topic of bot.topics) {
    if (topic.keywords.some((k) => q.includes(` ${normalizeQuestion(k)}`))) return { kind: "topic", topic };
  }
  return { kind: "fallback" };
}
