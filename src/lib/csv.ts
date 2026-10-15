export type CsvRow = { /** Linha do arquivo onde o registro começa (1 = cabeçalho). */ line: number; cells: string[] };
export type CsvParse = { delimiter: ";" | ","; rows: CsvRow[] };

/** Tira o BOM do UTF-8 (planilhas do Excel "CSV UTF-8" começam com ele). */
export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** Separador pelo cabeçalho: o que aparece mais fora de aspas na primeira linha (empate vale ";", o padrão do Excel em português). */
export function detectDelimiter(text: string): ";" | "," {
  let semi = 0;
  let comma = 0;
  let quoted = false;
  for (const ch of text) {
    if (ch === '"') quoted = !quoted;
    else if (!quoted && (ch === "\n" || ch === "\r")) break;
    else if (!quoted && ch === ";") semi++;
    else if (!quoted && ch === ",") comma++;
  }
  return comma > semi ? "," : ";";
}

/**
 * CSV simples (RFC 4180): campos entre aspas, "" como aspas literais, quebra de linha dentro de aspas, CRLF/LF/CR.
 * Linhas totalmente vazias são descartadas; `line` guarda o número da linha no arquivo para as mensagens de erro.
 */
export function parseCsv(input: string): CsvParse {
  const text = stripBom(input);
  const delimiter = detectDelimiter(text);
  const rows: CsvRow[] = [];
  let cells: string[] = [];
  let field = "";
  let quoted = false;
  let line = 1;
  let startLine = 1;
  let i = 0;

  const endField = () => {
    cells.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    if (cells.some((c) => c.trim() !== "")) rows.push({ line: startLine, cells });
    cells = [];
  };

  while (i < text.length) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else {
        if (ch === "\n") line++;
        field += ch;
      }
    } else if (ch === '"' && field === "") {
      quoted = true;
    } else if (ch === delimiter) {
      endField();
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endRow();
      line++;
      startLine = line;
    } else {
      field += ch;
    }
    i++;
  }
  if (field !== "" || cells.length > 0) endRow();
  return { delimiter, rows };
}

/** Texto de um arquivo: UTF-8 (com ou sem BOM); se não for UTF-8 válido (Excel "CSV" antigo), lê como Windows-1252. */
export function decodeCsvBytes(bytes: Uint8Array): { text: string; fallback: boolean } {
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(bytes), fallback: false };
  } catch {
    return { text: new TextDecoder("windows-1252").decode(bytes), fallback: true };
  }
}

/** Escreve um campo para CSV com ";" como separador. */
export function csvCell(value: string): string {
  return /[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
