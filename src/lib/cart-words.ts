export type CartWords = {
  /** "Carrinho" / "Sacola" (título de tela). */
  name: string;
  lower: string;
  /** "o carrinho" / "a sacola". */
  the: string;
  /** "ao carrinho" / "à sacola". */
  to: string;
  /** "Adicionar ao carrinho" / "Adicionar à sacola". */
  add: string;
  /** "Adicionado ao carrinho" / "Adicionado à sacola". */
  added: string;
  /** "Ver carrinho" / "Ver sacola". */
  view: string;
  /** "Voltar para o carrinho" / "Voltar para a sacola". */
  back: string;
  /** "Seu carrinho está vazio" / "Sua sacola está vazia". */
  empty: string;
  /** Aviso na linha do item sem estoque ou inativo. */
  unavailable: string;
  /** "Só restam 2". */
  only: (left: number) => string;
  /** "Para finalizar, resolva no carrinho: X (Indisponível), Y (Só restam 2)." */
  blocked: (items: string[]) => string;
};

/** Textos do carrinho a partir do rótulo e do gênero definidos no preset (nada de "carrinho" fixo no código). */
export function cartWords(label: string = "Carrinho", gender: "m" | "f" = "m"): CartWords {
  const lower = label.toLowerCase();
  const f = gender === "f";
  const to = f ? `à ${lower}` : `ao ${lower}`;
  const the = f ? `a ${lower}` : `o ${lower}`;
  return {
    name: label,
    lower,
    the,
    to,
    add: `Adicionar ${to}`,
    added: `Adicionado ${to}`,
    view: `Ver ${lower}`,
    back: `Voltar para ${the}`,
    empty: f ? `Sua ${lower} está vazia` : `Seu ${lower} está vazio`,
    unavailable: "Indisponível",
    only: (left) => `Só ${left === 1 ? "resta" : "restam"} ${left}`,
    blocked: (items) => `Para finalizar, resolva ${f ? "na" : "no"} ${lower}: ${items.join("; ")}.`,
  };
}
