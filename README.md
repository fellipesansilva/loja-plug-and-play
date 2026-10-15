# Loja Virtual Plug and Play — Fatias 0 (Fundação), 1 (Catálogo), 1.1 (Forno da Vila v2) e 2 (Compra)

Mockup navegável de e-commerce reutilizável e agnóstico de nicho. Nada específico de cliente ou nicho está no código: tema (tokens), módulos (liga/desliga) e catálogo vêm de **presets** (dados).

Stack: Next.js (App Router) + TypeScript strict, Tailwind CSS 4 mapeado para CSS variables, Zustand (persist em localStorage protegido), Vitest, Playwright. Sem backend e sem chamadas de rede para dados.

**Cada preset é uma loja (um build estático) própria**: o preset é definido no build, não troca em tempo de execução. Veja "Um build por preset".

## Como rodar

```bash
npm install
npm run dev                  # Trama em http://localhost:3410
npm run dev -- --preset=forno   # Forno da Vila
npm run build && npm start   # build de produção (Trama, ou o preset escolhido: veja abaixo)
```

Rotas: vitrine em `/` e painel em `/painel/produtos`. O botão flutuante **Demo** (canto inferior direito) mostra a loja atual, leva às outras lojas (links configurados), reseta os dados e alterna vitrine/painel.

## Como rodar os testes

```bash
npm run lint
npm run typecheck
npm test                 # unitários (Vitest), uma vez por preset (trama e forno)
npm run test:unit        # unitários só com o preset padrão
npx playwright install chromium
npm run test:e2e         # E2E (Playwright): faz 3 builds e sobe os servidores nas portas 3411 (Trama), 3412 (Forno) e 3413 (produção pura)
```

Os E2E rodam em dois projetos do Playwright, um por preset (`trama` e `forno`). Cada teste é escrito para uma loja (`openAs(page, TRAMA | FORNO, rota)` em `tests/e2e/helpers.ts`) e é pulado no build da outra; os testes que valem para qualquer loja rodam nas duas.
Se o Chromium baixado pelo Playwright não abrir na sua máquina, use um navegador instalado:
`PW_CHANNEL=chrome npm run test:e2e` (ou `msedge`). No PowerShell: `$env:PW_CHANNEL="chrome"; npm run test:e2e`.

## Arquitetura em uma página

- `src/domain/types.ts` — contrato de dados (`StoreConfig`, `ThemeTokens`, `Modules`, `Product`, `Order`, `Preset`…).
- `src/presets/` — um diretório por preset + `index.ts` (registro). Valores de cor, fonte e raio **só** existem aqui e em `src/theme`.
- `src/theme/` — `ThemeProvider` aplica os tokens do store como variáveis `--t-*` em `:root`; `theme.css` as mapeia para utilitários do Tailwind (`bg-primary`, `rounded-md`, `font-heading`, `p-md`…).
- `src/store/` — `demo-store.ts` (config, produtos, pedidos e carrinho do preset deste build; `reset`) e `safe-storage.ts` (localStorage com fallback em memória).
- `src/components/` e `src/app/` — nunca contêm cor/fonte literal (garantido por `src/no-hardcode.test.ts`).
- Imagens: placeholders SVG gerados localmente em `/placeholder` (sem imagens de terceiros).

## Como adicionar um novo preset

1. Crie `src/presets/<meu-preset>/` com `config.ts` (nome, legal fictício, tema, módulos, políticas), `products.ts` (categorias e produtos), `orders.ts`, `coupons.ts`, `sample.csv` e `index.ts` exportando um `Preset` (copie `forno-da-vila/index.ts`).
2. Use os helpers de `src/presets/helpers.ts` (`product`, `gridVariants`, `order`, `orderItem`, `attrs`).
3. Registre em `src/presets/index.ts` (array `presets`).
4. Atenda às contagens: 16–20 produtos em ≥ 3 categorias, ≥ 4 com variações, 1 sem estoque, 8 pedidos cobrindo os 6 status, 1 cupom válido, SKUs únicos, 1 CSV de exemplo.
5. Inclua o id no mapa `expectedFreeShipping` de `src/presets/presets.test.ts` e rode `npm test`.

Os dados legais devem ser fictícios e claramente de demonstração.
6. Escolha as fontes dele: crie `src/fonts/<nome>.ts` (copie `forno.ts`) e registre o id e o apelido em `src/fonts/select.ts`. Cada build carrega só as fontes do seu preset.
7. Defina o `shortId` (apelido usado em `NEXT_PUBLIC_PRESET`, na URL de demonstração e no `?preset=` antigo) no `index.ts` do preset.

## Como adicionar um bloco de home a um preset

A home é montada por `config.homeBlocks` (em `src/presets/<preset>/config.ts`): a **ordem do array é a ordem na página** e `enabled: false` esconde o bloco.
Tipos existentes (`HomeBlock` em `src/domain/types.ts`): `banner` (`variant: "full"` ou `"card"`, com selo e segundo botão opcionais), `categories`, `chips` (atalhos em pílula; `href` `#id` rola até o bloco), `spotlight` (card grande de um produto), `featured` e `shippingProgress` (barra de frete grátis, só aparece com itens no carrinho). Para criar um bloco novo de um tipo existente, basta acrescentar um item
com `id` único (ex.: um segundo `featured` com outros `productIds`). Para um **tipo** novo: (1) adicione a variante em `HomeBlock`, (2) crie o componente em
`src/components/store/HomeBlocks.tsx` e trate-o no `switch` de `HomeBlocks` (o TypeScript acusa o caso esquecido). O teste de presets valida que categorias e produtos citados existem.

## Como escolher a variante de listagem e de produto

Em `config.layout` do preset:

- `listing: "grid"` (cards em grade) ou `"menu"` (cardápio: cartão branco com nome, descrição curta, preço e selos à esquerda, miniatura e botão "+" à direita). Vale para o bloco de destaques da home, a categoria (que ganha chips de categoria) e a busca.
  O "+" adiciona direto ao carrinho; se o produto tiver variação, leva à página do produto.
- `product: "classic"` (galeria na proporção do produto, botão "Adicionar ao carrinho") ou `"sheet"` (foto de ponta a ponta, folha de conteúdo, seletor de quantidade e barra fixa "Adicionar · total").
- Opcionais: `wordmark: { text, accent }` (logo em texto com um caractere de destaque colorido, ex.: o ponto de "forno.da vila") e `pickup: { leadTime }` (prazo da retirada na faixa de aviso).
- Tokens do tema usados por essas variantes: `colors.highlightBg/highlightText` (selos), `colors.footerBg/footerText`, `radii.xl` (banner em card), `radii.sheet` (folha do produto), `fonts.headingTracking` e `logo.accent`.

## Como cadastrar adicionais e selos num produto

No produto do preset: `addons: [{ id, label, price }]` (preço em centavos) e `badges: ["Nº 1 da semana"]`. Os adicionais aparecem em "Turbine seu pedido", em checkboxes com o preço à direita, e são somados ao preço da linha.
O carrinho guarda linhas `{ lineId, productId, variantId?, addonIds, qty }`; `lineId` = produto + variante + adicionais ordenados (`src/lib/cart.ts`): a mesma combinação soma a quantidade e outra combinação vira linha nova. A tela do carrinho é da F2.
Marque um atributo com `summary: true` em `attributeDefs` para ele aparecer como linha de resumo (muted) sob a descrição na página em folha.

## Como adicionar um atributo a um preset

1. Dê o atributo aos produtos (`attrs({ chave: ["Rótulo", "valor"] })`) e/ou às variantes (`attributes: { chave: "valor" }`).
2. Declare-o em `config.attributeDefs`: `{ key, label, selector: "pill" | "swatch" | "list", filterable, highlight }`.
   - `filterable: true` gera o filtro na categoria (só com os valores existentes); `highlight: true` vira selo no card.
   - `selector` define o seletor de variação na página do produto; `swatch` pede `swatches: { valor: "#cor" }`.
3. O teste de presets falha se algum atributo usado não tiver definição ou se faltar cor para um valor de `swatch`.

Outros dados da vitrine vindos do preset: `seo` (modelo de título e descrição), `layout` (busca em ícone ou barra, tile de categoria), `shipping` (opções e cobertura do frete simulado),
`modules.parcelamento.minInstallment` (parcela mínima, padrão R$ 20,00) e `policies.regret` (aviso de arrependimento do produto).

## Armadilhas de estilo

- **Não use `max-w-xl` nem `max-w-md`** (nem outras classes `max-w-*` / `w-*` de tamanho nomeado que coincidam com os tokens de espaçamento `xs`, `sm`, `md`, `lg`, `xl`):
  eles colidem com `--spacing-md` / `--spacing-xl` do tema e resolvem para valores minúsculos (o texto do banner chegou a quebrar uma palavra por linha).
  Use valores explícitos, como `max-w-[36rem]`, ou as escalas numéricas (`max-w-5xl` não colide).


Hoje todas são placeholders SVG locais (`/placeholder`). Fotos reais vão em `public/images/presets/<preset>/` (WebP, ≤ 1600 px, ≤ 200 KB) e **precisam** constar em `IMAGE_CREDITS.md` (teste de presets).

## Compra: carrinho, checkout e confirmação (F2)

Tudo simulado: nenhum pagamento, frete ou e-mail real. Rotas `/carrinho`, `/checkout` (3 etapas: Identificação, Entrega, Pagamento) e `/pedido/<id>`.
O total vem de um único cálculo (`src/lib/totals.ts`): subtotal − cupom − desconto Pix (só no Pix, sobre o valor após o cupom, nunca sobre o frete) + frete, em centavos.
O frete grátis compara o **subtotal do carrinho** (só itens físicos). O pedido é gravado em `store.orders`, o carrinho é zerado, e na tela de confirmação o botão Demo ganha "Simular pagamento aprovado".

- **Link antigo `?preset=`:** como cada preset é uma loja própria, `?preset=forno` na loja da Trama redireciona para a URL da loja do Forno (de `NEXT_PUBLIC_DEMO_URLS`, mantendo caminho, demais parâmetros e âncora). Sem URL configurada, ou para o próprio preset, o parâmetro é ignorado.
- **Ligar o desconto no Pix:** em `config.modules` do preset, `descontoPix: { enabled: true, percent: 5 }`. A linha "No Pix: R$ X" aparece no card, na página do produto, no carrinho e no pagamento.
- **Criar cupons:** em `src/presets/<preset>/coupons.ts`: `{ code, type: "percent" | "fixed", value, minValue?, active, expiresAt? }`. `percent` usa o número (10 = 10%); `fixed` e `minValue` em centavos. O código não diferencia maiúsculas; o campo só aparece com `modules.cupom: true`.
- **Produto digital:** `type: "digital"` no produto. Sem estoque (sempre disponível), sem calculadora de frete na página, não conta para o frete grátis; carrinho só com digitais pula a etapa de entrega e a confirmação diz "O acesso será enviado para {e-mail}". Nenhum preset tem produto digital ainda (os testes usam fixture).
- **Nomes do preset:** `cartLabel` ("Carrinho" ou "Sacola") com `cartGender` (`"m"` ou `"f"`, para "ao carrinho" / "à sacola") e `orderPrefix` ("TS" gera TS-1009). Todo texto do carrinho sai de `cartWords` (`src/lib/cart-words.ts`): não escreva "carrinho" ou "sacola" direto nos componentes (um teste E2E confere as telas dos dois presets).
- **Cartão (simulado):** só `4111 1111 1111 1111` é aprovado. O pedido guarda apenas bandeira e últimos 4 dígitos; número completo e CVV nunca são gravados. Formas de pagamento: Pix sempre; cartão com `modules.cartao: { enabled: true }`; boleto com `boleto` ligado. As parcelas só aparecem com `parcelamento` ligado; sem ele o cartão é à vista (1x).
- **LGPD:** a identificação pede só nome, e-mail, celular e CPF (para a nota fiscal); a caixa de marketing vem desmarcada. O CPF é validado com o número completo, mas só a forma mascarada (`***.***.***-12`) é gravada no pedido; o número completo não é persistido em lugar nenhum.
- **Estoque:** na demo o pedido não baixa o estoque (a baixa fica para a versão funcional).

## Banner principal responsivo

O banner da home (`homeBlocks`, tipo `banner`) usa `image.sources`: um recorte de celular (3:4, `max-width: 767px`, larguras 480/640/768/960) e um de desktop (16:9, `min-width: 768px`, larguras 1280/1920), cada um em AVIF e WebP, renderizados em um `<picture>` (`ResponsiveBanner`). `sizes` descreve a largura exibida (faixa de ponta a ponta ou card com margem). O `src` do banner é só o arquivo de reserva.
Como o HTML do servidor já é do preset do build, o banner é só o `<picture>` do HTML, com `<img fetchpriority="high" loading="eager">`: o navegador o descobre ao ler o HTML, escolhe um único arquivo por `sizes` e densidade da tela, e não há preload injetado por script.
Os arquivos são gerados na curadoria de imagens (WebP/AVIF ≤ 200 KB) e creditados pelo `banner.webp` em `IMAGE_CREDITS.md`. Para trocar a foto do banner, gere de novo os recortes e preencha `sources`; o teste de presets confere que os arquivos existem.

## Imagens

As fotos dos dois presets são do Unsplash (as do Forno v2 seguem a direção: close-up ou 45°, vapor, queijo esticando, calda escorrendo, luz natural quente, sem pessoas nem marcas) (licença gratuita), em `public/images/presets/<preset>/` (WebP, ≤ 1600 px, ≤ 200 KB), referenciadas em `src/presets/<preset>/images.ts`
e **creditadas em `IMAGE_CREDITS.md`** (arquivo, URL, autor, licença). O texto alternativo descreve o que a foto mostra. Preset novo sem fotos cai nos placeholders SVG de `/placeholder`.
O teste de presets exige que toda imagem de arquivo exista em `public/` e conste no `IMAGE_CREDITS.md`.

## Um build por preset

Cada preset vira um **build estático próprio** (uma loja, como a de um cliente). O preset vem da variável de build `NEXT_PUBLIC_PRESET` (apelido ou id: `trama`, `forno`, `trama-studio`, `forno-da-vila`). Sem a variável vale a Trama; um valor desconhecido derruba o build (para não publicar a loja errada). Por isso o store, o tema, as fontes e o HTML do servidor já nascem no preset: não existe mais troca em tempo de execução, esconder da página nem preload injetado.

**Gerar a loja de um preset**

```bash
PRESET=forno npm run build                 # Linux/macOS
$env:PRESET="forno"; npm run build         # PowerShell
npm run build -- --preset=forno            # qualquer sistema
npm run build:trama | npm run build:forno  # atalhos
npm start                                  # serve o build (porta 3410)
```

**URLs das lojas (painel Demo e link antigo):** `NEXT_PUBLIC_DEMO_URLS` é um JSON com a URL de cada loja, o mesmo nos dois projetos:
`{"trama":"https://loja-trama.exemplo","forno":"https://loja-forno.exemplo"}`. No painel Demo a loja atual aparece marcada e as outras são links para essas URLs (sem URL configurada o item fica desabilitado). Entradas inválidas são ignoradas.

**Publicar na Vercel: um projeto por preset, o mesmo repositório (branch `main`)**

| Projeto | `NEXT_PUBLIC_PRESET` | `NEXT_PUBLIC_DEMO_URLS` | Comando de build |
|---|---|---|---|
| Trama | `trama` | JSON com as duas URLs | `npm run build` (padrão) |
| Forno | `forno` | o mesmo JSON | `npm run build` (padrão) |

Framework Next.js, diretório raiz e saída padrão. Não defina `NEXT_PUBLIC_EXPOSE_STORE` em produção. Cada push na `main` publica os dois projetos.

**Estado de cada loja:** o `localStorage` usa uma chave por preset (`loja-demo-v1-trama`, `loja-demo-v1-forno`), então carrinho e pedidos de uma loja nunca aparecem na outra, mesmo no mesmo domínio (testes locais).

**Por que a página não pisca mais:** antes o HTML do servidor era sempre da Trama e o preset salvo só entrava na hidratação (o store lia o `localStorage` depois de montar), o que exigia esconder a página e injetar preload por script. Com um build por preset o HTML já sai com a loja certa.

## Estado e persistência

O estado é salvo em `localStorage` (chave por preset, `loja-demo-v1-<preset>`). Se o storage estiver indisponível ou lançar exceção, a demo funciona normalmente, só sem persistir (fallback em memória). O formato é versionado (`STORAGE_VERSION`): estado salvo em versão antiga é descartado. O carrinho (`cart`) é persistido e zerado ao resetar. O script inline `early-theme-script.ts` reaplica antes da primeira pintura os tokens de tema salvos desta loja. Em tempo de execução o store fica exposto em `window.__demoStore` para testes e depuração (só fora de produção ou com `NEXT_PUBLIC_EXPOSE_STORE=1`).

## Publicação (Vercel)

Veja "Um build por preset": um projeto da Vercel por preset, com `NEXT_PUBLIC_PRESET` e `NEXT_PUBLIC_DEMO_URLS`.

## Portas e convenções

- Este projeto **não usa a porta 3000** (reservada a outro projeto na máquina de desenvolvimento): `npm run dev`/`npm start` usam **3410**; o E2E usa **3411** (build da Trama) e **3412** (build do Forno), ambos com `window.__demoStore`, e **3413** (build de produção sem a flag). O E2E não reaproveita servidores já abertos: se a porta estiver ocupada, falha em vez de usar o servidor alheio.
- Valores monetários são **inteiros em centavos** (`18990` = R$ 189,90); a exibição passa sempre por `formatBRL` (`src/lib/money.ts`). O `sample.csv` usa reais com vírgula/ponto e será convertido por `parseBRLToCents` na importação.
- `window.__demoStore` só existe fora de produção ou com `NEXT_PUBLIC_EXPOSE_STORE=1` (usado só no build de teste do E2E).
