# AUVP | Parcerias Estratégicas

Versão web, interativa e editável da apresentação **AUVP | Parcerias Estratégicas**.

Os 13 slides do PDF original foram reconstruídos em HTML com os textos **idênticos ao
original** (mesma redação, mesma pontuação, mesmas quebras de linha), na mesma grade de
1440 × 810 px e com a mesma tipografia (Anek Bangla). As fotos entraram como
**placeholders**, para serem substituídas depois, e os campos que no PDF aparecem entre
colchetes (`[Nome da empresa]`, `[diferencial concreto]`, …) viraram **campos editáveis**.

## Como usar

Abra `index.html` no navegador. Para desenvolvimento local, qualquer servidor estático serve:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Não há build, dependências, npm ou framework — é HTML, CSS e JavaScript puro. A fonte está
hospedada no próprio repositório (`assets/fonts/`), então a página funciona offline.

## Preenchendo a proposta

| Campo | Onde aparece |
| --- | --- |
| Nome da empresa / marca | slides 7, 9 (2×), 10 e 11 |
| Diferencial concreto | slide 7 |
| Produto ou linha | slide 7 |
| Membros AUVP Capital (`+x mil`) | slide 6 |

Duas formas de preencher, equivalentes:

1. **Clicando direto no texto do slide** — os campos ficam destacados no modo edição.
2. **Pelo painel “Editar”** (botão na barra inferior ou tecla `E`).

O nome da empresa é digitado **uma vez** e se propaga para todos os slides. Enquanto um
campo está vazio, ele mostra o texto original entre colchetes, exatamente como no PDF.

Tudo é salvo no `localStorage` do navegador — recarregar a página não perde nada. Para levar
o preenchimento para outra máquina, use **Exportar dados (.json)** / **Importar dados (.json)**.

## Trocando as imagens

Cada área tracejada é um placeholder identificado (`Foto — palestra AUVP`, `Imagem — produto
/ conceito`, …). Há duas maneiras de colocar a imagem definitiva:

**Rápida, só no seu navegador:** clique na área (ou arraste o arquivo em cima dela) e escolha
a imagem. Ela fica salva no navegador; imagens grandes são redimensionadas automaticamente
para caber no armazenamento local.

**Definitiva, versionada no repositório:** coloque o arquivo em `assets/img/` e adicione o
atributo `data-src` ao placeholder correspondente em `index.html`:

```html
<div class="ph" data-img="s2-foto" data-label="Foto — palestra AUVP"
     data-src="assets/img/palestra.jpg"
     style="left:0;top:0;width:580px;height:810px"></div>
```

Assim a imagem vale para todo mundo que abrir a página. Um upload feito pelo navegador
continua tendo prioridade sobre o `data-src`; “Remover” volta para a imagem do repositório.

Placeholders disponíveis: `s1-bg`, `s2-foto`, `s3-bg`, `s4-foto`, `s7-foto`, `s8-bg`,
`s10-faixa`, `s11-foto`, `s12-bg`, `s13-foto`.

## Atalhos

| Tecla | Ação |
| --- | --- |
| `→` `←` `Espaço` `PageUp/Down` | navegar entre slides |
| `Home` / `End` | primeiro / último slide |
| `G` | ver todos os slides |
| `E` | painel de campos |
| `P` | modo apresentação (esconde as marcações de edição) |
| `F` | tela cheia |
| `Esc` | fechar painel / grade |

No celular funciona por deslize lateral. No modo apresentação, clicar na metade direita ou
esquerda da tela também avança e volta.

Cada slide tem endereço próprio (`index.html#s=7`), útil para mandar direto o slide certo.

## Exportar em PDF

Botão **Imprimir / salvar PDF** no painel (ou `Ctrl/Cmd + P`). A impressão sai com um slide
por página, em 16:9, sem a interface e sem as marcações de edição.

## Estrutura

```
index.html          os 13 slides, com os textos do PDF
assets/styles.css   layout do palco 1440×810, tipografia e interface
assets/app.js       navegação, campos editáveis, upload de imagens, export/import
assets/fonts.css    Anek Bangla (OFL 1.1), servida localmente
assets/img/         imagens definitivas da apresentação (via data-src)
```

### Sobre a fidelidade ao original

O posicionamento de cada bloco de texto usa as coordenadas extraídas do PDF, com
*leading-trim* para que o topo da caixa da fonte caia exatamente na coordenada original.
Textos com quebras de linha fixas usam `<br>`; os parágrafos que contêm campos editáveis
quebram naturalmente dentro da mesma largura do original, para poderem crescer quando o
nome da empresa for maior que o placeholder.

Nada da redação foi ajustado — incluindo detalhes do original como “autonomia..”,
“Membros atendido pela AUVP Capital” e o duplo espaço em “Acesso facilitado à  [Nome da
empresa]”.
