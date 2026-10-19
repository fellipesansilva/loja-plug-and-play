import type { Course } from "@/domain/types";

/**
 * Conteúdo dos cursos da Faísca, por id de produto. Instrutores e aulas são fictícios, escritos para a demonstração:
 * cada aula tem a capa "Aula de demonstração" e o texto abaixo (sem vídeo). A carga horária do curso é a soma das durações.
 */
const FICTICIA = "Instrutora fictícia, criada para a demonstração da plataforma.";
const FICTICIO = "Instrutor fictício, criado para a demonstração da plataforma.";

export const courses: Record<string, Course> = {
  "fs-001": {
    instructor: "Helena Marques",
    instructorNote: FICTICIA,
    lessons: [
      {
        id: "luz",
        title: "A luz muda tudo",
        minutes: 18,
        text: [
          "Antes de pensar no celular, pense na luz. Uma foto boa quase sempre nasce de uma luz boa: macia, vinda de um lado e sem sombras duras no rosto ou no objeto.",
          "Nesta aula você aprende a ler a luz de uma janela, do fim da tarde e de um dia nublado, e a mudar de posição em vez de mexer em filtros depois.",
        ],
      },
      {
        id: "enquadramento",
        title: "Enquadramento e regra dos terços",
        minutes: 15,
        text: [
          "Dividir a tela em nove partes ajuda a decidir onde colocar o assunto. Em vez de centralizar tudo, experimente deixar o olhar ou o horizonte em uma das linhas.",
          "Veja como linhas, caminhos e cercas conduzem o olhar até o assunto, e como aproximar-se com os pés melhora mais do que usar o zoom digital.",
        ],
      },
      {
        id: "ajustes",
        title: "Foco, exposição e HDR",
        minutes: 20,
        text: [
          "Tocar na tela define o foco e também a exposição. Arrastar o ponto para cima ou para baixo clareia ou escurece a cena antes do clique, e isso salva fotos de céu estourado.",
          "Entenda quando ligar o HDR, por que fotos em movimento pedem mais luz e como travar foco e exposição para fotografar em sequência.",
        ],
      },
      {
        id: "composicao",
        title: "Composição de retrato e de paisagem",
        minutes: 22,
        text: [
          "Retratos pedem proximidade e fundo limpo; paisagens pedem camadas: um primeiro plano, um meio e um fundo. Compare as duas ideias com os mesmos assuntos.",
          "Treino da aula: fotografe a mesma cena de três alturas diferentes (olho, quadril e chão) e escolha a que conta melhor a história.",
        ],
      },
      {
        id: "edicao",
        title: "Edição leve no próprio celular",
        minutes: 24,
        text: [
          "Editar é corrigir, não disfarçar. Comece pelo corte e pelo alinhamento do horizonte, depois ajuste brilho, contraste e temperatura em pequenas doses.",
          "Mostramos uma ordem simples de edição que cabe em dois minutos e mantém as cores naturais, sem aquele aspecto de filtro pesado.",
        ],
      },
      {
        id: "projeto",
        title: "Projeto final: uma série de cinco fotos",
        minutes: 28,
        text: [
          "Para fechar, escolha um tema do seu dia (a rua onde mora, o café da manhã, as mãos de alguém) e fotografe cinco imagens que funcionem juntas.",
          "Revise o que aprendeu: luz, enquadramento, foco, composição e edição. Escolha a melhor da série e escreva uma frase sobre o que você quis mostrar.",
        ],
      },
    ],
  },
  "fs-002": {
    instructor: "Caio Bastos",
    instructorNote: FICTICIO,
    lessons: [
      {
        id: "materiais",
        title: "Materiais que você realmente precisa",
        minutes: 12,
        text: [
          "Um lápis 2B, uma borracha macia, uma caneta de ponta fina e um caderno de papel liso bastam para começar. Materiais caros não ensinam a desenhar.",
          "Veja como segurar o lápis para soltar o pulso e como organizar a mesa para desenhar por quinze minutos por dia sem preparo nenhum.",
        ],
      },
      {
        id: "formas",
        title: "Formas básicas e proporção",
        minutes: 20,
        text: [
          "Quase tudo pode ser construído com círculos, quadrados e triângulos. Treine desenhar cada forma em tamanhos diferentes antes de passar para objetos.",
          "Aprenda a medir proporções com o lápis na mão esticada e a comparar larguras e alturas antes de traçar a linha definitiva.",
        ],
      },
      {
        id: "luz-e-sombra",
        title: "Luz e sombra com hachuras",
        minutes: 22,
        text: [
          "Sombra é uma sequência de tons: do claro ao escuro, em degraus. Treine a escala de cinco tons e as hachuras cruzadas em quadrados pequenos.",
          "Aplique a escala em uma esfera: escolha de onde vem a luz, marque o ponto mais claro e escureça com calma o lado oposto.",
        ],
      },
      {
        id: "perspectiva",
        title: "Perspectiva com um ponto de fuga",
        minutes: 24,
        text: [
          "Linhas paralelas que se afastam parecem se encontrar no horizonte. Marque o ponto de fuga e construa uma rua simples com casas do mesmo tamanho.",
          "Depois, repita sem régua. O objetivo não é perfeição, é entender por que os objetos distantes ficam menores.",
        ],
      },
      {
        id: "observacao",
        title: "Desenhar o que você vê",
        minutes: 26,
        text: [
          "Escolha um objeto da sua casa, gire-o até achar um ângulo interessante e desenhe por vinte minutos sem apagar. Erros fazem parte do traço.",
          "Compare o desenho com o objeto de tempos em tempos e corrija o que mais se afasta: a silhueta, depois os detalhes.",
        ],
      },
      {
        id: "projeto",
        title: "Projeto final: uma página de estudos",
        minutes: 30,
        text: [
          "Monte uma página com quatro estudos pequenos do mesmo tema, como folhas, xícaras ou sapatos, usando formas, sombra e perspectiva.",
          "Datar a página é um bom hábito: daqui a três meses você compara com um novo estudo e vê o seu progresso.",
        ],
      },
    ],
  },
  "fs-003": {
    instructor: "Lívia Duarte",
    instructorNote: FICTICIA,
    lessons: [
      {
        id: "conhecendo",
        title: "Conhecendo o violão e afinando",
        minutes: 16,
        text: [
          "Cada corda tem um nome e um som: mi, si, sol, ré, lá, mi, da mais fina para a mais grossa. Aprenda a nomear as cordas e a afinar por um aplicativo ou afinador.",
          "Veja também como sentar, onde apoiar o braço e como segurar o violão sem tensionar o ombro.",
        ],
      },
      {
        id: "primeiros-acordes",
        title: "Primeiros acordes: Mi menor e Lá menor",
        minutes: 22,
        text: [
          "Dois acordes com poucos dedos já permitem tocar muita coisa. Posicione os dedos perto do traste, sem encostar nas cordas vizinhas, e toque uma corda de cada vez para testar.",
          "Treino: alterne os dois acordes devagar, contando quatro tempos em cada um. Velocidade vem depois da clareza do som.",
        ],
      },
      {
        id: "ritmo",
        title: "Ritmo e batida básica",
        minutes: 20,
        text: [
          "A mão direita faz a música andar. Comece com batidas para baixo em quatro tempos e depois acrescente a batida para cima entre elas.",
          "Use um metrônomo bem lento e conte em voz alta. Quando o ritmo ficar automático, a mão esquerda passa a trocar de acorde sem parar.",
        ],
      },
      {
        id: "mais-acordes",
        title: "Dó, Sol e Ré: o trio da maioria das canções",
        minutes: 24,
        text: [
          "Com três acordes maiores você toca dezenas de canções populares. Aprenda cada formato separadamente e, depois, as trocas dois a dois.",
          "Dica: troque de acorde antes do tempo forte e mantenha o dedo guia perto das cordas para ganhar segurança.",
        ],
      },
      {
        id: "primeira-musica",
        title: "Tocando sua primeira música",
        minutes: 26,
        text: [
          "Escolha uma canção simples e lenta, com no máximo quatro acordes. Escreva a sequência no caderno e toque com a batida que você já domina.",
          "Grave um áudio de si mesmo: ouvir a gravação ajuda a perceber onde o ritmo escorrega e onde a troca de acorde demora.",
        ],
      },
      {
        id: "pratica",
        title: "Como organizar a prática semanal",
        minutes: 18,
        text: [
          "Vinte minutos por dia rendem mais que duas horas no fim de semana. Divida o tempo em afinação, troca de acordes, ritmo e uma música.",
          "Monte um plano de sete dias e marque o que cumpriu. No fim da semana, escolha uma meta pequena para a seguinte.",
        ],
      },
    ],
  },
  "fs-004": {
    instructor: "Rafael Tavares",
    instructorNote: FICTICIO,
    lessons: [
      {
        id: "o-que-e",
        title: "O que é programar (e o que não é)",
        minutes: 14,
        text: [
          "Programar é escrever instruções claras para que um computador execute uma tarefa. Não exige matemática avançada: exige organizar o pensamento em passos.",
          "Nesta aula você descreve, em português, os passos para fazer um café e percebe por que cada detalhe importa quando a máquina não adivinha nada.",
        ],
      },
      {
        id: "variaveis",
        title: "Variáveis e tipos de dado",
        minutes: 20,
        text: [
          "Uma variável é uma caixa com nome onde guardamos um valor: um número, um texto, verdadeiro ou falso. O nome ajuda a entender o código depois.",
          "Pratique criando variáveis para o seu nome, a sua idade e o preço de um produto, e calculando o total de uma compra pequena.",
        ],
      },
      {
        id: "condicoes",
        title: "Decisões: se isto, então aquilo",
        minutes: 22,
        text: [
          "Condições permitem que o programa escolha um caminho. Pergunte se a idade é maior que dezoito, se a senha confere, se há saldo suficiente.",
          "Combine perguntas com e, ou e não, e treine desenhando o fluxo no papel antes de escrever qualquer linha.",
        ],
      },
      {
        id: "repeticoes",
        title: "Repetições: laços sem copiar e colar",
        minutes: 24,
        text: [
          "Quando uma tarefa se repete, use um laço. Contar de um a dez, somar uma lista de preços e percorrer nomes são exemplos de repetição.",
          "Veja a diferença entre repetir um número de vezes e repetir até que uma condição aconteça, e como evitar laços que nunca terminam.",
        ],
      },
      {
        id: "funcoes",
        title: "Funções: dar nome a um pedaço de lógica",
        minutes: 22,
        text: [
          "Uma função agrupa passos que você usa várias vezes, recebe valores de entrada e devolve um resultado. É a base para organizar programas maiores.",
          "Transforme o cálculo de desconto em uma função e use-a para vários produtos, sem reescrever a conta.",
        ],
      },
      {
        id: "projeto",
        title: "Projeto final: uma calculadora de gorjeta",
        minutes: 28,
        text: [
          "Junte tudo: o programa pergunta o valor da conta e a porcentagem, calcula a gorjeta, divide entre as pessoas e mostra o resultado formatado.",
          "Teste com valores estranhos (zero, negativo, texto) e acrescente mensagens de erro claras. Esse cuidado é o que separa um exercício de um programa útil.",
        ],
      },
    ],
  },
  "fs-005": {
    instructor: "Marcos Vieira",
    instructorNote: FICTICIO,
    lessons: [
      {
        id: "organizar",
        title: "Organizar os dados antes de calcular",
        minutes: 16,
        text: [
          "Uma boa planilha começa por uma tabela limpa: uma linha para cada registro, uma coluna para cada informação e um cabeçalho que diz o que há em cada uma.",
          "Evite células mescladas e linhas em branco no meio dos dados. Elas parecem organizar, mas atrapalham filtros, somas e tabelas dinâmicas.",
        ],
      },
      {
        id: "formulas",
        title: "Fórmulas essenciais: soma, média e SE",
        minutes: 22,
        text: [
          "Comece pelas fórmulas que resolvem metade dos problemas do dia a dia: SOMA, MÉDIA, MÍNIMO, MÁXIMO e SE. Entenda como cada uma lê o intervalo de células.",
          "Treino: monte uma tabela de gastos do mês e use SE para marcar o que passou do orçamento de cada categoria.",
        ],
      },
      {
        id: "referencias",
        title: "Referências relativas e absolutas",
        minutes: 18,
        text: [
          "Ao arrastar uma fórmula, as referências mudam junto. O cifrão trava a coluna, a linha ou as duas, e é o truque que evita erros em cálculos de percentual.",
          "Pratique com uma tabela de preços e um único campo de desconto, usando a referência absoluta para aplicar o percentual a todas as linhas.",
        ],
      },
      {
        id: "procv",
        title: "Buscar informações com PROCV e XLOOKUP",
        minutes: 24,
        text: [
          "Procurar um valor em outra tabela é uma das tarefas mais comuns. Veja como a busca funciona e quando prefira a função mais nova, que não depende da ordem das colunas.",
          "Monte um cadastro de produtos e uma lista de vendas e traga automaticamente o preço de cada item.",
        ],
      },
      {
        id: "graficos",
        title: "Gráficos que se entendem em cinco segundos",
        minutes: 20,
        text: [
          "Um bom gráfico responde a uma pergunta. Escolha colunas para comparar, linhas para evolução no tempo e evite gráficos de pizza com muitas fatias.",
          "Remova o que não ajuda: grades demais, 3D e cores sem função. Título e rótulos devem dizer o que o leitor precisa notar.",
        ],
      },
      {
        id: "automatizar",
        title: "Automatize a rotina com tabelas e filtros",
        minutes: 26,
        text: [
          "Transformar o intervalo em tabela faz as fórmulas crescerem com os dados. Filtros e segmentações permitem olhar um mês ou um cliente sem copiar nada.",
          "Finalize montando um painel simples com total do mês, maior gasto e um gráfico, que se atualiza quando você cola dados novos.",
        ],
      },
    ],
  },
  "fs-006": {
    instructor: "Beatriz Lemos",
    instructorNote: FICTICIA,
    lessons: [
      {
        id: "diagnostico",
        title: "Diagnóstico: para onde o dinheiro vai",
        minutes: 18,
        text: [
          "Antes de cortar gastos, veja o retrato real. Reúna extratos e faturas de três meses e separe o que é fixo, o que é variável e o que foi impulso.",
          "O objetivo desta aula não é culpar ninguém: é ter números honestos para decidir com calma.",
        ],
      },
      {
        id: "orcamento",
        title: "Um orçamento que cabe na vida real",
        minutes: 22,
        text: [
          "Divida a renda em três grupos: necessidades, desejos e futuro. Os percentuais variam, mas o hábito de decidir antes de gastar é o que funciona.",
          "Monte o seu primeiro orçamento mensal e reserve uma pequena folga para imprevistos: sem ela, qualquer planejamento quebra na primeira surpresa.",
        ],
      },
      {
        id: "reserva",
        title: "Reserva de emergência, passo a passo",
        minutes: 20,
        text: [
          "A reserva evita que um imprevisto vire dívida. A meta clássica é guardar de três a seis meses do custo de vida, mas o primeiro marco pode ser um mês.",
          "Aprenda a definir um valor automático por mês e a escolher onde deixar o dinheiro: acessível, seguro e sem surpresas de tarifa.",
        ],
      },
      {
        id: "dividas",
        title: "Como sair do rotativo e das dívidas caras",
        minutes: 24,
        text: [
          "Dívidas com juros altos, como cartão rotativo e cheque especial, vêm primeiro. Liste todas com valor, taxa e parcela e escolha uma ordem de pagamento.",
          "Veja como negociar: peça a taxa efetiva, compare a proposta com o custo atual e só feche o que cabe no orçamento do mês.",
        ],
      },
      {
        id: "metas",
        title: "Metas de curto, médio e longo prazo",
        minutes: 18,
        text: [
          "Metas têm valor, prazo e uma razão. Uma viagem em um ano, a troca do notebook em seis meses e a aposentadoria em décadas pedem estratégias diferentes.",
          "Calcule quanto guardar por mês para cada meta e veja o que precisa mudar no orçamento para que ela caiba.",
        ],
      },
      {
        id: "habito",
        title: "Criar o hábito: revisão de dez minutos por semana",
        minutes: 15,
        text: [
          "O que mantém as finanças em ordem é a rotina, não a planilha perfeita. Reserve dez minutos por semana para conferir gastos e ajustar o rumo.",
          "Fechamos o curso com um roteiro de revisão simples e um modelo de acompanhamento para colar na geladeira ou no celular.",
        ],
      },
    ],
  },
  "fs-007": {
    instructor: "Thiago Rocha",
    instructorNote: FICTICIO,
    lessons: [
      {
        id: "apresentacoes",
        title: "Apresentações e primeiras conversas",
        minutes: 15,
        text: [
          "Cumprimentar, dizer o seu nome e perguntar como a pessoa está abre qualquer conversa. Pratique frases como \"Nice to meet you\" e \"Where are you from?\".",
          "Repita em voz alta, no ritmo do áudio de demonstração, e preste atenção em como as palavras se ligam umas às outras.",
        ],
      },
      {
        id: "aeroporto",
        title: "No aeroporto: check-in, bagagem e embarque",
        minutes: 20,
        text: [
          "Estas são as frases que você vai ouvir e dizer: \"Window or aisle?\", \"Do you have any bags to check?\", \"Which gate is it?\". Aprenda o vocabulário em contexto.",
          "Faça o exercício de ligar a pergunta à resposta mais natural e treine pedir ajuda quando não entender alguma coisa.",
        ],
      },
      {
        id: "hotel",
        title: "Hotel: reserva, chegada e pedidos",
        minutes: 18,
        text: [
          "Confirmar uma reserva, pedir um quarto mais silencioso, perguntar o horário do café da manhã e do check-out são situações que se repetem em qualquer cidade.",
          "A aula traz modelos de frases educadas e as formas mais comuns de pedir algo: \"Could I have...\" e \"Would it be possible to...\".",
        ],
      },
      {
        id: "restaurante",
        title: "Restaurantes e cafés",
        minutes: 20,
        text: [
          "Pedir uma mesa, ler o cardápio, falar de alergias e pedir a conta. Vocabulário de comida e de quantidades, com as frases que os garçons mais usam.",
          "Treine perguntar \"What do you recommend?\" e responder com educação quando o prato não for o que você esperava.",
        ],
      },
      {
        id: "direcoes",
        title: "Pedir e entender direções",
        minutes: 22,
        text: [
          "Esquerda, direita, em frente, na esquina, ao lado de: o vocabulário de direção é curto e muito repetido. Aprenda a entendê-lo com mapas simples.",
          "Quando não entender, peça para repetir mais devagar: \"Could you say that again, please?\" é uma das frases mais úteis de toda viagem.",
        ],
      },
      {
        id: "emergencias",
        title: "Imprevistos e emergências",
        minutes: 18,
        text: [
          "Perder a bagagem, precisar de uma farmácia, avisar sobre um problema de saúde: frases curtas e claras fazem toda a diferença quando você está nervoso.",
          "Fechamos o curso com um roteiro de cinco frases para guardar no celular e um desafio: descrever o seu dia de viagem ideal em inglês.",
        ],
      },
    ],
  },
};
