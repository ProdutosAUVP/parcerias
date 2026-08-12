# AUVP | Parcerias Estratégicas

Plataforma web da proposta **AUVP | Parcerias Estratégicas**: um site interativo por onde a
proposta é lida, preenchida com os dados da marca parceira e acompanhada até o piloto entrar
no ar — além de uma versão em formato de apresentação, para reuniões.

Todo o texto vem do PDF original, **sem nenhuma alteração de redação**: mesma escrita, mesma
pontuação, incluindo detalhes como “autonomia..”, “Membros atendido pela AUVP Capital” e o
duplo espaço em “Acesso facilitado à  [Nome da empresa]”. O que mudou foi o formato: em vez
de 13 slides replicados, o conteúdo virou um site com seções, navegação, componentes
interativos e acompanhamento de progresso.

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
seletor navegável por clique ou pelas setas do teclado, em vez de cinco blocos soltos.

**Números** — os indicadores aparecem com contagem animada quando entram na tela.

**Responsabilidades e Próximos passos** — viraram listas marcáveis, com contador de progresso
por bloco (`2/4 concluídos`). Serve para acompanhar o combinado ao longo da negociação; as
marcações ficam salvas no navegador.

**Projeto-piloto** — os quatro momentos do piloto em linha do tempo numerada.

**Capa e declarações** — fotos de fundo com parallax leve e revelação dos blocos conforme a
rolagem. Tudo respeita `prefers-reduced-motion`.

## Preenchendo a proposta

| Campo | Onde aparece |
| --- | --- |
| Nome da empresa / marca | Por que essa parceria, Nossa proposta (2×), Projeto-piloto, Próximos passos |
| Diferencial concreto | Por que essa parceria |
| Produto ou linha | Por que essa parceria |
| Membros AUVP Capital (`+x mil`) | Nossa presença em números |

Duas formas equivalentes: clicar direto no trecho sublinhado da página, ou abrir
**Preencher proposta** no topo. O nome da empresa é digitado uma vez e se propaga por todas
as seções. Enquanto um campo está vazio, ele mostra o texto original entre colchetes, como no
PDF.

Tudo fica salvo no `localStorage`. Para levar o preenchimento adiante há três caminhos:

- **Copiar link preenchido** — gera uma URL com os campos (`?empresa=...&produto=...`);
  quem abrir já vê a proposta preenchida.
- **Exportar / importar `.json`** — leva o preenchimento, as imagens e as marcações para
  outra máquina.
- **Salvar em PDF** — imprime o site inteiro, sem a interface, com todas as verticais
  abertas e sem as áreas de foto ainda vazias.

## Trocando as imagens

Cada área tracejada é um placeholder identificado (`Foto — palestra AUVP`, `Imagem — produto
/ conceito`, …). Duas maneiras de colocar a imagem definitiva:

**Rápida, só no seu navegador:** clique na área (ou arraste o arquivo em cima dela). Imagens
grandes são redimensionadas automaticamente para caber no armazenamento local.

**Definitiva, versionada no repositório:** coloque o arquivo em `assets/img/` e adicione o
atributo `data-src` ao placeholder correspondente:

```html
<div class="ph ph-tall" data-img="s2-foto" data-label="Foto — palestra AUVP"
     data-src="assets/img/palestra.jpg"></div>
```

Assim a imagem vale para todo mundo que abrir a página. Um upload feito pelo navegador
continua tendo prioridade sobre o `data-src`; “Remover” volta para a imagem do repositório.

Placeholders: `s1-bg`, `s2-foto`, `s3-bg`, `s4-foto`, `s7-foto`, `s8-bg`, `s10-faixa`,
`s11-foto`, `s12-bg`, `s13-foto` — os mesmos identificadores nas duas visões, então a imagem
enviada aparece no site e na apresentação.

## Atalhos da apresentação

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
assets/site.js      rolagem, seções, abas, contadores, painel
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
