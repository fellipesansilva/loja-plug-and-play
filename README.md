# Loja Virtual Plug and Play — Fatias 0 (Fundação), 1 (Catálogo), 1.1 (Forno da Vila v2) e 2 (Compra)

Mockup navegável de e-commerce reutilizável e agnóstico de nicho. Nada específico de cliente ou nicho está no código: tema (tokens), módulos (liga/desliga) e catálogo vêm de **presets** (dados).

Stack: Next.js (App Router) + TypeScript strict, Tailwind CSS 4 mapeado para CSS variables, Zustand (persist em localStorage protegido), Vitest, Playwright. Sem backend e sem chamadas de rede para dados.

**O preset está no endereço**: `/trama/...`, `/forno/...`. Um único build e um único servidor geram e servem todos os presets; cada página já sai do servidor no preset dela. Veja "Preset no endereço".

## Como rodar

```bash
npm install
npm run dev                  # http://localhost:3410  (a raiz / redireciona para /trama)
npm run build && npm start   # build de produção: gera todos os presets
```

Rotas: vitrine em `/<preset>` (ex.: `/trama`, `/forno`) e painel em `/<preset>/painel/produtos`. O botão flutuante **Demo** (canto inferior direito) mostra a loja atual, leva às outras lojas (links internos para `/trama` e `/forno`), reseta os dados e alterna vitrine/painel.

## Como rodar os testes

```bash
npm run lint
npm run typecheck
npm test                 # unitários (Vitest), uma vez
npx playwright install chromium
npm run test:e2e         # E2E (Playwright): faz UM build e sobe UM servidor na porta 3411 (com window.__demoStore)
```

Os E2E rodam em dois projetos do Playwright, um por preset (`trama` e `forno`), contra o mesmo servidor. O `test` de `tests/e2e/helpers.ts` prefixa `page.goto` e `request.get` com o preset do projeto (os specs escrevem `/carrinho` e a requisição vai para `/forno/carrinho`). Cada teste é escrito para uma loja (`openAs(page, TRAMA | FORNO, rota)`) e é pulado no projeto da outra; os testes que valem para qualquer loja rodam nas duas. Endereços completos (`http://localhost:3411/...`) não são alterados: servem para testar redirecionamentos e 404.
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
6. Escolha as fontes dele: coloque os woff2 (latin) em `public/fonts/<apelido>/` e adicione a entrada em `src/fonts/index.ts` (família, arquivo, peso e variável CSS usada nos tokens). Cada página `/<apelido>` declara e pré-carrega só as fontes do seu preset.
7. Defina o `shortId` (apelido do preset, usado como primeiro segmento da URL: `/<shortId>/...`) no `index.ts` do preset. Ele é obrigatório e único.

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

- **Link antigo `?preset=`:** `/?preset=forno` redireciona para `/forno` e `/<caminho>?preset=forno` para `/forno/<caminho>`, mantendo os demais parâmetros (veja "Preset no endereço").
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

## Preset no endereço

O primeiro segmento da URL é o preset (`shortId`): `/trama`, `/forno/produto/pizza-margherita`, `/forno/painel/pedidos`. Todos os presets são gerados no mesmo `npm run build`; não existe variável de build por preset.

- **Rotas:** `src/app/[preset]/...`. O layout `src/app/[preset]/layout.tsx` é o **único ponto** por onde o preset chega aos componentes: resolve o segmento, entrega o store e o contexto (`PresetProvider`, `usePreset()`) e o tema/fontes. Preset desconhecido (`/orbita`, `/xyz`) é 404 de verdade (status 404, `src/app/not-found.tsx`).
- **Cada página só carrega o que é dela:** o HTML já sai com o tema (`--t-*`), as `@font-face` e o preload das fontes do preset (`src/fonts/index.ts`, arquivos em `public/fonts/<apelido>/`) e as imagens dele. `/forno` não baixa imagem, fonte nem tema da Trama (e vice-versa); há teste E2E de rede para isso. (O JavaScript do cliente ainda contém os dados de todos os presets; só imagens, fontes e tema são por página.)
- **Links internos sempre levam o prefixo:** use `StoreLink` (`src/components/store/StoreLink.tsx`) no lugar de `next/link` e `usePresetRouter()` no lugar de `useRouter`; os dois aplicam `prefixHref` (`src/lib/preset-href.ts`). Escreva `href="/carrinho"` e o link sai `/forno/carrinho`. Um teste E2E confere todos os `<a href="/...">` de cada tipo de página.
- **Raiz e links antigos** (`src/proxy.ts`, funciona na Vercel e em `next start`, redirecionamento 308): `/` → `/trama`; `/?preset=forno` → `/forno`; `/<caminho>?preset=forno` → `/forno/<caminho>` (demais parâmetros mantidos); `/<caminho>` sem preset → `/trama/<caminho>`. O preset padrão vem da configuração (variável de ambiente `DEFAULT_PRESET`, lida em `src/config.ts`; sem ela vale o primeiro preset do registro; valor desconhecido derruba o build).
- **Painel Demo:** a loja atual vem marcada e as outras são links internos para `/<apelido>`.
- **Estado de cada loja:** o `localStorage` usa uma chave por preset (`loja-demo-v1-trama`, `loja-demo-v1-forno`), então carrinho e pedidos de uma loja nunca aparecem na outra, mesmo no mesmo domínio e navegador.
- **Adiado para a versão funcional:** a *loja de cliente* (um preset servido na raiz do domínio, sem prefixo, p.ex. `loja-do-cliente.com/`). Não está implementada; a demonstração atual é sempre `/<preset>/...`.

## Conformidade (F3)

Tudo o que é texto ou dado de loja vem do preset (`config.legal` e `config.policies`); o código só tem a estrutura das telas e a regra da lei (prazos mínimos, mensagens genéricas). `src/presets/validate.ts` valida cada preset ao carregar o registro: **preset incompleto derruba o build/servidor** com o preset e o campo na mensagem.

| Item | Onde | O que o preset precisa informar |
|---|---|---|
| Identificação (H1) | rodapé de toda página da loja | `legal.name`, `legal.document` (CNPJ/CPF), `legal.address`, `legal.email`, `legal.phone` |
| Trocas e devoluções (H2) | `/<preset>/trocas-e-devolucoes` | `policies.regretDays` (**mínimo 7**; menos derruba o build), `regretConditions`, `defect.durability` (`durable`/`nonDurable`) + `defect.days` (**mínimo 90 dias para durável e 30 para não durável**, CDC art. 26; menos derruba o build) + `defect.conditions`, `digital` (obrigatório se houver produto digital; só aparece quando há) |
| Desistir da compra (H3) | `/<preset>/arrependimento` (links no rodapé e na confirmação do pedido) | usa `regretDays` e o contato de `legal` |
| Privacidade (H4) | `/<preset>/privacidade` | `policies.privacy`: `dataCollected`, `purpose`, `retention`, `sharing`, `rights`, `controller` |
| Cookies (H5) | aviso na primeira visita + "Preferências de cookies" no rodapé | `policies.cookies.notice` e `policies.cookies.version` |

- **Desistir da compra (simulado):** número do pedido + e-mail. Pedido de até `regretDays` dias (contados da data do pedido: a demo não registra a data de recebimento; **na versão funcional a contagem deve partir da data de entrega**, senão a loja recusaria pedidos válidos) ganha protocolo `ARR-AAAAMMDD-XXXXX` e passa para `cancelado` (`Order.regret` guarda protocolo e data). Passou do prazo: informa e mostra o contato para troca por defeito. Pedido inexistente e e-mail diferente dão a **mesma** mensagem (`src/lib/regret.ts`).
- **Cookies:** a escolha (`accepted`/`rejected`, data e versão do texto) fica em `loja-consent-v1-<preset>`; mudar `cookies.version` pergunta de novo. **Ponto de controle:** todo script ou cookie não essencial deve ser renderizado dentro de `<ConsentGate>` (`src/components/consent/ConsentProvider.tsx`), que só monta os filhos depois do "Aceitar". Hoje a loja não carrega nenhum. O aviso é fixo na base da tela; a barra de compra e o botão Demo sobem junto com ele via `transform` (que não conta como deslocamento de layout), por isso o CLS continua 0.
- **Checkout (H6):** obrigatórios só nome, e-mail, celular (menos em pedido 100% digital), CPF (nota fiscal), endereço (só com entrega) e dados do cartão (só no cartão). "Quero receber ofertas" vem desmarcada e, marcada, grava `marketingConsentAt` no pedido.

### Fontes e licenças

As fontes são hospedadas em `public/fonts/<preset>/` (woff2 latin, de Google Fonts), todas sob a SIL Open Font License 1.1. O texto da licença de cada uma está ao lado do arquivo.

| Fonte | Usada em | Copyright | Licença |
|---|---|---|---|
| Bodoni Moda | Trama (títulos) | 2020 The Bodoni Moda Project Authors | OFL 1.1 — `public/fonts/trama/OFL-bodoni-moda.txt` |
| Bricolage Grotesque | Forno (títulos) | 2022 The Bricolage Grotesque Project Authors | OFL 1.1 — `public/fonts/forno/OFL-bricolage-grotesque.txt` |
| Manrope | Trama e Forno (texto) | 2018 The Manrope Project Authors | OFL 1.1 — `public/fonts/trama/OFL-manrope.txt` e `public/fonts/forno/OFL-manrope.txt` |
| Barlow Condensed | Arca (títulos) | 2017 The Barlow Project Authors | OFL 1.1 — `public/fonts/arca/OFL-barlow-condensed.txt` |
| Barlow | Arca (texto) | 2017 The Barlow Project Authors | OFL 1.1 — `public/fonts/arca/OFL-barlow.txt` |

## Painel de operação (F4)

Em `/<preset>/painel`, sem login na demo: faixa fixa "Painel de demonstração" em todas as telas e `noindex` em todas as páginas. Os dados são os do preset e ficam no `localStorage` da loja (por preset). Configurações (tema e módulos) é da F5 e segue como placeholder. O código do painel só é carregado nas rotas do painel (`src/components/painel/`); a loja não importa nada de lá.

- **Pedidos:** lista do mais recente ao mais antigo (exemplos do preset + feitos na demo), com filtro por status e busca por número ou cliente; detalhe com itens (variações e adicionais), valores, entrega, pagamento (bandeira e 4 últimos dígitos, nunca o número), cliente com CPF mascarado, consentimento de marketing com data, histórico de status e protocolo do arrependimento.
- **Status:** só as próximas etapas válidas (`src/lib/order-status.ts`): aguardando pagamento → pago → em separação → enviado → entregue; pedido só digital vai de pago direto para entregue; cancelar até antes de entregue, com confirmação. Cada mudança entra em `Order.history` (data e hora). Em pedido de retirada, "enviado" usa `config.pickup.readyLabel` do preset (Forno: "Pronto para retirada"). A confirmação do pedido na loja mostra o status atual.
- **Produtos:** lista com foto, preço, estoque e situação, com busca por nome ou SKU. O formulário é **gerado a partir do preset**: um campo por atributo descritivo e uma variação por combinação dos eixos. As definições de `config.attributeDefs` com `variant: true` (Trama: tamanho e cor; Forno: porção) são os eixos de variação; as demais são atributos descritivos. Preço em formato BR (`19,90`, gravado em centavos), SKU único (inclusive entre variações), estoque inteiro. `Product.active === false` tira da loja (lista, busca, home e página do produto); estoque zero aparece como esgotado. Imagens: arquivo JPG, PNG ou WebP até 1 MB (guardado no navegador como data URL) ou imagem do preset. Se o navegador recusar gravar (armazenamento cheio), o painel mostra um aviso fixo e a tela continua funcionando (`safeStorage.hasWriteFailed`).
- **Importação CSV:** botão para baixar o modelo do preset (colunas `sku, nome, preco, estoque, categoria, descricao` + uma coluna por atributo do preset). Aceita `;` ou `,`, UTF-8 com ou sem BOM (arquivo que não for UTF-8 é lido como Windows-1252, com aviso), preço em formato BR (também `19.90`), `categoria` pelo slug ou nome. A prévia mostra criados, atualizados (pelo SKU) e linhas com erro (número da linha e motivo); confirmar importa só as válidas. Arquivo vazio, colunas obrigatórias ausentes ou mais de 500 linhas: nada é importado. Produto criado pela importação ganha imagem de substituição (SVG do preset). Arquivos de teste: `tests/fixtures/csv/`.
- **Estado salvo:** a versão do formato passou de 5 para 6 (histórico de status, produto ativo/inativo, rótulo de retirada). A migração mantém pedidos (ganham histórico), catálogo, carrinho e cupons; a config volta a ser a do preset, preservando o nome e o tema editados (`migrateState`, com teste).

## Modo orçamento (loja Arca em `/arca`)

Fabricante sob medida não vende com preço fixo: recebe pedidos de orçamento. O módulo `modules.orcamento: { enabled }` vale para a **loja inteira** e o preset fictício **Arca Infláveis** (`/arca`) o usa. Trama e Forno não mudam.

- **Sem preço em lugar nenhum:** cards, produto, busca, destaques, ordenação por preço, painel e (se houvesse) dados estruturados. O produto vira "Adicionar ao orçamento" (texto em `config.quote.addLabel`); os demais textos da lista seguem o esquema do `cartWords` (`config.quote.listLabel` = "Lista de orçamento", `listGender` = "f").
- **Sem venda:** carrinho, checkout, frete, cupom, Pix, cartão, boleto e parcelamento não existem. `validatePreset` **derruba o build** se um preset em orçamento tiver qualquer desses módulos ligado (a mensagem diz qual). As rotas `/arca/carrinho`, `/checkout`, `/pedido/…`, `/arrependimento` e `/trocas-e-devolucoes` dão **404**; `/arca/painel/pedidos` também (o menu mostra "Orçamentos"). Em Trama e Forno, `/orcamento`, `/condicoes-comerciais` e `/painel/orcamentos` dão 404. A guarda é `requireMode` (`src/lib/quote-mode.ts`).
- **Lista de orçamento** (`/<preset>/orcamento`): itens com quantidade, observação de até 500 caracteres (medidas, cor, aplicação) e remover; contador no cabeçalho; guardada no `localStorage` do preset (`loja-demo-v1-arca`).
- **Envio:** formulário com nome, empresa (opcional), e-mail, WhatsApp, cidade e UF de entrega, aplicação (opções de `config.quote.applications`) e mensagem; aviso de uso dos dados com link para a privacidade e **sem** caixa de "concordo". Enviar gera o protocolo `ORC-AAAAMMDD-XXXXX` (simulado), grava a solicitação (itens e contato), esvazia a lista e mostra a confirmação. "Enviar pelo WhatsApp": com `whatsapp.isReal` **falso** (a demo) abre uma janela com a mensagem pronta (itens, quantidades, observações) e o botão "Copiar", sem abrir conversa nem ter link para o `wa.me`; com `isReal` verdadeiro abre o `wa.me` com a mensagem.
- **Painel:** "Orçamentos" lista as solicitações (da mais recente à mais antiga; filtro por status; busca por protocolo, nome ou empresa) e o detalhe mostra contato, itens com observações e histórico. Status: nova → em análise → orçamento enviado → ganho; "perdido" pode ser marcado de nova, em análise ou orçamento enviado, com confirmação. Produto e importação CSV têm preço e estoque **opcionais** (vazio = sem preço).
- **Condições comerciais** (`/<preset>/condicoes-comerciais`, no lugar de Trocas e devoluções): prazo de produção e frete vêm de `policies.commercial`; a garantia vem de `policies.defect` (a validação do prazo de defeito do CDC continua valendo). A validação de arrependimento **não se aplica** a preset em orçamento (`regretDays` pode ficar ausente).
- **Preset Arca:** 2 categorias ("Indústria e agro" e "Eventos e marketing") e 10 produtos com nomes genéricos do nicho, descrições escritas para o projeto, ficha técnica em tabela (`attributes`) e aplicações em etiquetas (`Product.applications`), 5 solicitações de exemplo em status variados (`src/presets/arca-inflaveis/quotes.ts`). Dados legais fictícios e textos marcados como de demonstração.
- **Imagens:** não há fotos. As imagens são **ilustrações originais em SVG** (`public/images/presets/arca-inflaveis/`), na paleta do preset, porque nenhuma foto de licença comercial com crédito mostrava os produtos do nicho. Quando o cliente tiver fotos, elas entram no lugar. Detalhes em `IMAGE_CREDITS.md`.
- **Estado salvo:** a versão do formato passou de 6 para 7 (lista e solicitações de orçamento). A migração aceita a v5 e a v6.

### Como criar outro preset em orçamento

Ligue `modules.orcamento`, desligue os módulos de venda, preencha `config.quote` (rótulo, gênero, botão, introdução, aplicações e WhatsApp), `policies.commercial` e `policies.defect`, e use `price: 0` nos produtos. Os testes genéricos de preset (16 a 20 produtos, pedidos, cupom, imagens com crédito) valem para presets de venda; os de orçamento estão em `src/presets/arca.test.ts`.

## Estado e persistência

O estado é salvo em `localStorage` (chave por preset, `loja-demo-v1-<apelido>`). Se o storage estiver indisponível ou lançar exceção, a demo funciona normalmente, só sem persistir (fallback em memória). O formato é versionado (`STORAGE_VERSION`): estado salvo em versão antiga, ou de outro preset, é descartado. O carrinho (`cart`) é persistido e zerado ao resetar. O store é criado por preset (`createDemoStore`) e hidratado no cliente depois de montar; o script inline `early-theme-script.ts` reaplica antes da primeira pintura os tokens de tema salvos desta loja (a página nunca é escondida). Em tempo de execução o store fica exposto em `window.__demoStore` para testes e depuração (só fora de produção ou com `NEXT_PUBLIC_EXPOSE_STORE=1`).

## Publicação (Vercel)

Um único projeto da Vercel, com o repositório e a branch `main`: framework Next.js, diretório raiz e comandos padrão. Todos os presets saem do mesmo deploy (`/trama`, `/forno`). Variáveis opcionais: `DEFAULT_PRESET` (para onde vai a raiz `/`). Não defina `NEXT_PUBLIC_EXPOSE_STORE` em produção. Se o projeto antigo ainda tiver `NEXT_PUBLIC_PRESET` ou `NEXT_PUBLIC_DEMO_URLS`, remova: não são mais lidas.

## Portas e convenções

- Este projeto **não usa a porta 3000** (reservada a outro projeto na máquina de desenvolvimento): `npm run dev`/`npm start` usam **3410**; o E2E usa **3411** (um servidor, com `window.__demoStore`). O E2E não reaproveita servidores já abertos: se a porta estiver ocupada, falha em vez de usar o servidor alheio.
- Valores monetários são **inteiros em centavos** (`18990` = R$ 189,90); a exibição passa sempre por `formatBRL` (`src/lib/money.ts`). O `sample.csv` usa reais com vírgula/ponto e será convertido por `parseBRLToCents` na importação.
- `window.__demoStore` só existe fora de produção ou com `NEXT_PUBLIC_EXPOSE_STORE=1` (usado só no build de teste do E2E).
