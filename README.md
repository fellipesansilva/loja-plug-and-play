# Loja Virtual Plug and Play — Fatia 0 (Fundação)

Mockup navegável de e-commerce reutilizável e agnóstico de nicho. Nada específico de cliente ou nicho está no código: tema (tokens), módulos (liga/desliga) e catálogo vêm de **presets** (dados).

Stack: Next.js (App Router) + TypeScript strict, Tailwind CSS 4 mapeado para CSS variables, Zustand (persist em localStorage protegido), Vitest, Playwright. Sem backend e sem chamadas de rede para dados.

## Como rodar

```bash
npm install
npm run dev      # http://localhost:3410
npm run build && npm start
```

Rotas: vitrine em `/` e painel em `/painel/produtos`. O botão flutuante **Demo** (canto inferior direito) troca o preset, reseta os dados e alterna vitrine/painel.

## Como rodar os testes

```bash
npm run lint
npm run typecheck
npm test                 # unitários (Vitest)
npx playwright install chromium
npm run test:e2e         # E2E (Playwright): faz build e sobe servidores nas portas 3411 e 3412
```

Se o Chromium baixado pelo Playwright não abrir na sua máquina, use um navegador instalado:
`PW_CHANNEL=chrome npm run test:e2e` (ou `msedge`). No PowerShell: `$env:PW_CHANNEL="chrome"; npm run test:e2e`.

## Arquitetura em uma página

- `src/domain/types.ts` — contrato de dados (`StoreConfig`, `ThemeTokens`, `Modules`, `Product`, `Order`, `Preset`…).
- `src/presets/` — um diretório por preset + `index.ts` (registro). Valores de cor, fonte e raio **só** existem aqui e em `src/theme`.
- `src/theme/` — `ThemeProvider` aplica os tokens do store como variáveis `--t-*` em `:root`; `theme.css` as mapeia para utilitários do Tailwind (`bg-primary`, `rounded-md`, `font-heading`, `p-md`…).
- `src/store/` — `demo-store.ts` (preset ativo, config, produtos, pedidos; `applyPreset`, `reset`) e `safe-storage.ts` (localStorage com fallback em memória).
- `src/components/` e `src/app/` — nunca contêm cor/fonte literal (garantido por `src/no-hardcode.test.ts`).
- Imagens: placeholders SVG gerados localmente em `/placeholder` (sem imagens de terceiros).

## Como adicionar um novo preset

1. Crie `src/presets/<meu-preset>/` com `config.ts` (nome, legal fictício, tema, módulos, políticas), `products.ts` (categorias e produtos), `orders.ts`, `coupons.ts`, `sample.csv` e `index.ts` exportando um `Preset` (copie `forno-da-vila/index.ts`).
2. Use os helpers de `src/presets/helpers.ts` (`product`, `gridVariants`, `order`, `orderItem`, `attrs`).
3. Registre em `src/presets/index.ts` (array `presets`).
4. Atenda às contagens: 16–20 produtos em ≥ 3 categorias, ≥ 4 com variações, 1 sem estoque, 8 pedidos cobrindo os 6 status, 1 cupom válido, SKUs únicos, 1 CSV de exemplo.
5. Inclua o id no mapa `expectedFreeShipping` de `src/presets/presets.test.ts` e rode `npm test`.

Os dados legais devem ser fictícios e claramente de demonstração.

## Estado e persistência

O estado é salvo em `localStorage` (chave `loja-demo-v1`). Se o storage estiver indisponível ou lançar exceção, a demo funciona normalmente, só sem persistir (fallback em memória). Em tempo de execução o store fica exposto em `window.__demoStore` para testes e depuração.

## Publicação (Vercel)

Importe o repositório na Vercel (framework Next.js detectado automaticamente, sem variáveis de ambiente). Cada push na branch principal gera um novo deploy de produção.

## Portas e convenções

- Este projeto **não usa a porta 3000** (reservada a outro projeto na máquina de desenvolvimento): `npm run dev`/`npm start` usam **3410**; o E2E usa **3411** (build com `window.__demoStore`) e **3412** (build de produção sem a flag). O E2E não reaproveita servidores já abertos: se a porta estiver ocupada, falha em vez de usar o servidor alheio.
- Valores monetários são **inteiros em centavos** (`18990` = R$ 189,90); a exibição passa sempre por `formatBRL` (`src/lib/money.ts`). O `sample.csv` usa reais com vírgula/ponto e será convertido por `parseBRLToCents` na importação.
- `window.__demoStore` só existe fora de produção ou com `NEXT_PUBLIC_EXPOSE_STORE=1` (usado só no build de teste do E2E).
