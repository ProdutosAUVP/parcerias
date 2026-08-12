# AUVP | Parcerias Estratégicas

Plataforma web da proposta **AUVP | Parcerias Estratégicas**: um site interativo por onde a
proposta é lida e preenchida com os dados da marca parceira — além de uma versão em formato
de apresentação, para reuniões.

Todo o texto vem do PDF original, **sem nenhuma alteração de redação**: mesma escrita, mesma
pontuação, incluindo detalhes como “autonomia..”, “Membros atendido pela AUVP Capital” e o
duplo espaço em “Acesso facilitado à  [Nome da empresa]”. O que mudou foi o formato: em vez
de 13 slides replicados, o conteúdo virou um site com seções, navegação e componentes
animados.

As fotos entram como **placeholders** identificados, para serem trocadas depois, e os campos
que no PDF aparecem entre colchetes viraram **campos editáveis**.

## As duas visões

| Arquivo | O que é |
| --- | --- |
| `index.html` | O site — rolagem por seções, componentes interativos, preenchimento da proposta |
| `apresentacao.html` | A apresentação — os 13 slides do PDF, replicados na grade original de 1440 × 810, para projetar em reunião |

As duas compartilham o mesmo estado: o que você preenche em uma aparece na outra.

## Como rodar

Abra `index.html` no navegador. Para desenvolvimento local, qualquer servidor estático serve:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Sem build, sem dependências, sem framework — HTML, CSS e JavaScript puro. A fonte Anek Bangla
está no próprio repositório, então a página funciona offline.

## O que é interativo

**Navegação** — topo fixo com as seções, indicador da seção atual, barra de progresso da
leitura, menu no celular e rolagem suave. Cada seção tem endereço próprio (`#piloto`,
`#proposta`, …), útil para mandar alguém direto ao ponto.

**Ecossistema** — as cinco verticais (Escola, Capital, Analítica, Corporate, Agro) num
seletor navegável por clique ou pelas setas do teclado, cada uma com a sua foto.

**Nossa proposta de parceria** — os três lados ficam lado a lado, em cards, e cada card abre
e fecha a própria lista.

**Números** — a dobra revela um dado de cada vez: a régua corre, o número conta a partir do
zero e só então entra a explicação, para cada indicador ter o seu momento.

**Projeto-piloto** — os quatro momentos em linha do tempo: a régua corre da esquerda para a
direita e cada marco acende na sequência.

**Responsabilidades** — a lista da empresa parceira corre em duas colunas, para os dois lados
ficarem com blocos de tamanho parecido.

**Animação dos textos** — títulos e frases de destaque entram palavra a palavra, e os blocos
sobem conforme a rolagem. Capa e declarações têm parallax leve nas fotos de fundo. Tudo
respeita `prefers-reduced-motion`; na impressão, o texto volta inteiro para o PDF sair
pesquisável.

## Preenchendo a proposta

| Campo | Onde aparece |
| --- | --- |
| Nome da empresa / marca | Por que essa parceria, Nossa proposta (2×), Projeto-piloto, Próximos passos |
| Diferencial concreto | Por que essa parceria |
| Produto ou linha | Por que essa parceria |
| Membros AUVP Capital (`+x mil`) | Nossa presença em números |

Não há botão nem painel de edição: o próprio texto entre colchetes mostra onde editar.
Clique nele — um clique só — e o placeholder inteiro já vem selecionado, então é só digitar
por cima. O nome da empresa é digitado uma vez e se propaga por todas as seções; enquanto o
campo está vazio, ele mostra o texto original entre colchetes, como no PDF.

Tudo fica salvo no `localStorage`. Para levar o preenchimento adiante:

- **Link pré-preenchido** — a página aceita os campos pela URL
  (`index.html?empresa=Marca&produto=linha%20X`); quem abrir já vê a proposta preenchida.
- **Salvar em PDF** — imprime o site inteiro, sem a interface, com todas as verticais e
  todos os itens da proposta abertos, e sem as áreas de foto ainda vazias.
- **Exportar / importar `.json`** — disponível na apresentação (`apresentacao.html`), que
  mantém o painel completo de campos e imagens.

## Trocando as imagens

No site as fotos são apenas conteúdo — não são áreas editáveis. Só os trechos entre colchetes
recebem clique. Para enviar imagem pelo navegador, use a apresentação (`apresentacao.html`),
que mantém o painel; no site, as imagens vêm do repositório.

Cada área ainda sem foto aparece como um placeholder identificado (`Foto — palestra AUVP`,
`Foto — dominós`, …). Para definir a imagem, coloque o arquivo em `assets/img/` e adicione o
atributo `data-src` ao placeholder correspondente:

```html
<div class="ph ph-tall" data-img="s2-foto" data-label="Foto — palestra AUVP"
     data-src="assets/img/palestra.jpg"></div>
```

O `data-src` também aceita URL externa. Todas as fotos são exibidas em preto e branco
(`filter: grayscale(1)`), como no material original, e se uma URL não carregar o placeholder
volta a aparecer no lugar do bloco vazio.

Já definidas:

| Onde | Imagem |
| --- | --- |
| Capa | `assets/img/web/galera-summit.webp` |
| Quem somos | `assets/img/web/palestrante-raul.webp` |
| Somos a maior escola de investimentos do Brasil | `assets/img/web/palestra-01.webp` |
| AUVP Escola / AUVP Capital | cdn.asupernova.com.br (URL) |
| AUVP Analítica | media.licdn.com (URL) |
| AUVP Agro | `assets/img/web/agro.webp` |
| Por que essa parceria faz sentido | `assets/img/web/trofeu-summit.webp` |
| A marca ganha visibilidade qualificada | livecoins.com.br (URL) |
| Projeto-piloto | `assets/img/web/olhos-summit.webp` |

As demais seguem como placeholder.

### Peso das imagens

As fotos do site são servidas de `assets/img/web/`: versões WebP redimensionadas dos originais
que estão em `assets/img/`, que ficam intactos. Juntas, as originais somam cerca de 11,7 MB —
só a de “olhos summit” tem 5,7 MB — e as versões web somam 0,7 MB. Para trocar uma foto,
coloque o arquivo em `assets/img/`, gere a versão web e aponte o `data-src` para ela.

As fotos das verticais que ficam em abas escondidas são pré-carregadas assim que a página
abre: sem isso o navegador só busca a imagem quando a aba aparece, e a foto piscava vazia na
primeira vez que se clicava na vertical. O logo horizontal (`assets/AUVP - HORIZONTAL BRANCO
(1).svg`) está embutido como símbolo SVG no topo e no rodapé, com `fill: currentColor`, então
ele acompanha o fundo: branco sobre as dobras escuras, preto sobre o papel.

Identificadores no site: `s1-bg`, `s2-foto`, `s3-bg`, `s7-foto`, `s8-bg`, `s10-faixa`,
`s11-foto`, `s12-bg`, `s13-foto` e `eco-escola`, `eco-capital`, `eco-analitica`,
`eco-corporate`, `eco-agro`.

## Atalhos da apresentação

A apresentação mantém o painel de preenchimento (tecla `E`), útil para exportar e importar
dados e para enviar imagens.

| Tecla | Ação |
| --- | --- |
| `→` `←` `Espaço` | navegar entre slides |
| `Home` / `End` | primeiro / último slide |
| `G` | ver todos os slides |
| `E` | painel de campos |
| `P` | modo apresentação (esconde as marcações de edição) |
| `F` | tela cheia |

## Estrutura

```
index.html          o site
apresentacao.html   os 13 slides do PDF, na grade original
assets/site.css     design do site
assets/site.js      rolagem, animações, seções, abas e contadores
assets/deck.css     layout do palco 1440×810
assets/deck.js      navegação dos slides
assets/shared.css   campos editáveis, placeholders de imagem e avisos
assets/state.js     estado compartilhado e persistência local
assets/fonts.css    Anek Bangla (OFL 1.1), servida localmente
assets/img/         imagens definitivas (via data-src)
```

### Duas observações sobre a adaptação

O PDF repete o título “Nosso ecossistema” em dois slides seguidos (a introdução e as cinco
verticais); no site isso é uma seção só, com o título uma vez. E “Responsabilidades” aparece
antes de “Próximos passos”, para a página terminar no convite, não na lista de tarefas.
Nenhuma frase foi reescrita, encurtada ou acrescentada ao conteúdo da proposta.
