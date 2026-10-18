import type { Modules, Preset, StoreConfig, ThemeChoices } from "@/domain/types";
import { contrastIssues, type ContrastIssue } from "@/theme/contrast";

/** Chave da configuração salva no painel, uma por preset (ex.: `loja-config-v1-forno`). Separada do estado de demonstração (`loja-demo-v1-*`). */
export function configKeyFor(slug: string): string {
  return `loja-config-v1-${slug}`;
}

/**
 * Versão do formato salvo. v1 era só o tema por cor (`theme.primary` e `theme.accent` como valores hexadecimais); v2 guarda o tema por
 * id da paleta aprovada, com fontes, e acrescenta módulos, dados da loja, políticas e a publicação.
 */
export const CONFIG_VERSION = 2;

/** Limites de demonstração das regras de venda editáveis no painel (não são limites legais). */
export const RULE_LIMITS = {
  pixPercent: { min: 0, max: 30 },
  /** Em centavos. */
  freeShippingMin: { min: 100, max: 1_000_000_00 },
} as const;

export type ThemeIds = { primary: string; accent: string; headingFont: string; bodyFont: string };

export type StoreOverrides = {
  version: typeof CONFIG_VERSION;
  /** Ids da paleta aprovada do preset (ThemeChoices). */
  theme?: ThemeIds;
  /** Módulos completos (inclui o percentual do Pix, o valor do frete grátis e as parcelas). */
  modules?: Modules;
  /** Dados da loja (rascunho): campos vazios não vão para a vitrine. */
  loja?: { name: string; legalName: string; document: string; address: string; email: string; phone: string };
  /** Prazo de troca por defeito, em dias (CDC, art. 26). */
  policies?: { defectDays?: number };
  /** Preenchido ao publicar (simulado: nada sai do navegador). */
  publicada: { at: string } | null;
};

export function emptyOverrides(): StoreOverrides {
  return { version: CONFIG_VERSION, publicada: null };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

/**
 * Lê a configuração salva (qualquer versão) e devolve a atual, ou null se o formato não é aproveitável (versão futura, lixo).
 * v1 → v2: as cores hexadecimais viram o id da opção aprovada que tem o mesmo valor (cor que não está na paleta é descartada);
 * fontes, módulos, dados da loja e políticas não existiam na v1 e ficam sem alteração; `publicada` começa vazio.
 */
export function migrateOverrides(raw: unknown, choices: ThemeChoices | undefined): StoreOverrides | null {
  if (!isRecord(raw)) return null;
  const version = raw.version;
  if (version === CONFIG_VERSION) {
    const out = emptyOverrides();
    const t = raw.theme;
    if (isRecord(t) && ["primary", "accent", "headingFont", "bodyFont"].every((k) => typeof t[k] === "string")) out.theme = t as ThemeIds;
    if (isRecord(raw.modules)) out.modules = raw.modules as Modules;
    if (isRecord(raw.loja)) out.loja = raw.loja as StoreOverrides["loja"];
    if (isRecord(raw.policies)) out.policies = raw.policies as StoreOverrides["policies"];
    if (isRecord(raw.publicada) && typeof raw.publicada.at === "string") out.publicada = { at: raw.publicada.at };
    return out;
  }
  if (version === 1) {
    const out = emptyOverrides();
    const theme = isRecord(raw.theme) ? raw.theme : null;
    const find = (list: { id: string; value: string }[] | undefined, hex: string | undefined) => list?.find((c) => c.value.toLowerCase() === hex?.toLowerCase())?.id;
    const primary = find(choices?.primary, str(theme?.primary));
    const accent = find(choices?.accent, str(theme?.accent));
    if (choices && (primary || accent)) {
      out.theme = {
        primary: primary ?? choices.primary[0].id,
        accent: accent ?? choices.accent[0].id,
        headingFont: choices.fonts.heading[0].id,
        bodyFont: choices.fonts.body[0].id,
      };
    }
    return out;
  }
  return null;
}

/** Tema escolhido (ids) resolvido para valores. Ids que não estão na paleta aprovada são ignorados (cai na primeira opção, a do preset). */
export function resolveTheme(choices: ThemeChoices, theme: ThemeIds) {
  const pick = <T extends { id: string }>(list: T[], id: string) => list.find((c) => c.id === id) ?? list[0];
  return {
    primary: pick(choices.primary, theme.primary),
    accent: pick(choices.accent, theme.accent),
    heading: pick(choices.fonts.heading, theme.headingFont),
    body: pick(choices.fonts.body, theme.bodyFont),
  };
}

/** Tema padrão do preset, em ids da paleta aprovada (o que aparece marcado quando nada foi salvo). */
export function defaultThemeIds(base: StoreConfig): ThemeIds {
  const c = base.themeChoices;
  if (!c) throw new Error("O preset não define themeChoices.");
  const byValue = (list: { id: string; value: string }[], v: string) => (list.find((x) => x.value.toLowerCase() === v.toLowerCase()) ?? list[0]).id;
  return {
    primary: byValue(c.primary, base.theme.colors.primary),
    accent: byValue(c.accent, base.theme.colors.secondary),
    headingFont: byValue(c.fonts.heading, base.theme.fonts.heading),
    bodyFont: byValue(c.fonts.body, base.theme.fonts.body),
  };
}

/**
 * Tema da loja com as escolhas aplicadas sobre o do preset (`base`). Os tokens que, no preset, repetem a cor principal ou a de destaque
 * (faixa de aviso, selos) acompanham a escolha.
 */
export function themeWithChoice(base: StoreConfig, theme: ThemeIds): StoreConfig["theme"] {
  const choices = base.themeChoices;
  if (!choices) return base.theme;
  const r = resolveTheme(choices, theme);
  const colors = { ...base.theme.colors };
  const basePrimary = base.theme.colors.primary.toLowerCase();
  const baseAccent = base.theme.colors.secondary.toLowerCase();
  for (const key of Object.keys(colors) as (keyof typeof colors)[]) {
    const v = base.theme.colors[key].toLowerCase();
    if (v === basePrimary) colors[key] = r.primary.value;
    else if (v === baseAccent) colors[key] = r.accent.value;
  }
  return { ...base.theme, colors, fonts: { ...base.theme.fonts, heading: r.heading.value, body: r.body.value } };
}

/** Pares de texto e fundo abaixo de 4,5:1 no tema escolhido. */
export function themeContrastIssues(base: StoreConfig, theme: ThemeIds): ContrastIssue[] {
  if (!base.themeChoices) return [];
  return contrastIssues(themeWithChoice(base, theme).colors, base.themeChoices.contrastPairs);
}

export const COLOR_LABELS: Record<string, string> = {
  primary: "cor principal",
  secondary: "cor de destaque",
  background: "fundo da loja",
  text: "texto",
  announcementBg: "faixa de aviso",
  announcementText: "texto da faixa de aviso",
  highlightBg: "selos de destaque",
  highlightText: "texto dos selos",
};

/** Motivo legível de um par reprovado, para a tela do tema. */
export function describeContrastIssue(i: ContrastIssue): string {
  const f = COLOR_LABELS[i.fg] ?? i.fg;
  const b = COLOR_LABELS[i.bg] ?? i.bg;
  return `Contraste de ${i.ratio.toFixed(2).replace(".", ",")}:1 entre ${f} e ${b}; o mínimo é ${String(i.min).replace(".", ",")}:1.`;
}

const filled = (s: string | undefined) => (s ?? "").trim().length > 0;

/**
 * Configuração da loja com a configuração salva aplicada sobre `current` (a do estado) e `preset` (a base: de onde vêm a paleta
 * aprovada e os valores padrão). `strict`: campos de identificação vazios continuam vazios (usado para validar a publicação);
 * sem `strict`, o campo vazio mantém o valor anterior e a vitrine nunca mostra uma identificação em branco.
 */
export function applyOverrides(preset: Preset, current: StoreConfig, ov: StoreOverrides, opts: { strict?: boolean } = {}): StoreConfig {
  const next: StoreConfig = structuredClone(current);
  if (ov.theme && preset.config.themeChoices) next.theme = themeWithChoice(preset.config, ov.theme);
  if (ov.modules) next.modules = structuredClone(ov.modules);
  if (ov.loja) {
    const l = ov.loja;
    const keep = (v: string, old: string) => (opts.strict || filled(v) ? v : old);
    next.name = keep(l.name, next.name);
    next.legal = {
      name: keep(l.legalName, next.legal.name),
      document: keep(l.document, next.legal.document),
      address: keep(l.address, next.legal.address),
      email: keep(l.email, next.legal.email),
      phone: keep(l.phone, next.legal.phone),
    };
  }
  if (ov.policies?.defectDays !== undefined) next.policies.defect = { ...next.policies.defect, days: ov.policies.defectDays };
  return next;
}
