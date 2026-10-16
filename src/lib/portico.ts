/** Logo do configurador: PNG, JPG ou SVG de até 5 MB. Na demo só o nome do arquivo é guardado; o conteúdo nunca é lido nem enviado. */
export const LOGO_MAX_BYTES = 5 * 1024 * 1024;
export const LOGO_ACCEPT = ".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml";
export const LOGO_ERRO = "Formato aceito: PNG, JPG ou SVG, de até 5 MB.";

const LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];
const LOGO_EXT = /\.(png|jpe?g|svg)$/i;

/** Mensagem de erro do arquivo de logo, ou null se está ok. */
export function logoProblem(file: { name: string; type: string; size: number }): string | null {
  const typeOk = file.type === "" ? LOGO_EXT.test(file.name) : LOGO_TYPES.includes(file.type) && LOGO_EXT.test(file.name);
  if (!typeOk || file.size > LOGO_MAX_BYTES) return LOGO_ERRO;
  return null;
}

/** Observação do item: `6 × 4 m · cor Azul · texto "Minha marca"` ou `6 × 4 m · cor Azul · logo logo.png`. */
export function observacaoPortico(input: { medidas: string; cor: string; texto: string; logoNome: string | null }): string {
  const marca = input.logoNome ? `logo ${input.logoNome}` : `texto "${input.texto.trim()}"`;
  return `${input.medidas} · cor ${input.cor} · ${marca}`;
}

/** Cor do texto sobre a cor da paleta: "claro" (fundo da loja) sobre cor escura, "escuro" (texto da loja) sobre cor clara. */
export function textoSobre(hex: string): "claro" | "escuro" {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "claro";
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? "escuro" : "claro";
}
