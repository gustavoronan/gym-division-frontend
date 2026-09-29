# Documentação das alterações

Este documento descreve duas mudanças feitas no projeto **Division**:

1. [Ícone do app (PWA)](#1-ícone-do-app-pwa)
2. [GIFs de execução dos exercícios](#2-gifs-de-execução-dos-exercícios)

Cada mudança traz o que foi feito, como funciona, os arquivos envolvidos e como operar ou reverter.

---

## 1. Ícone do app (PWA)

### Objetivo
Quando o site é adicionado à tela inicial do celular ("instalar app"), deve aparecer o ícone do Division e o app deve abrir em tela cheia, sem a barra do navegador.

### O que foi feito
O ícone reproduz o [favicon.svg](../public/favicon.svg): raio amarelo-limão (`#c4ff3d`) sobre fundo escuro (`#0b0d12`). Os PNGs foram gerados a partir dos mesmos pontos do desenho do SVG.

| Arquivo (em `public/`) | Uso |
|---|---|
| `manifest.webmanifest` | Declara nome, cores, `display: standalone` e a lista de ícones |
| `icon-192.png`, `icon-512.png` | Ícones do Android/Chrome (cantos arredondados) |
| `icon-maskable-512.png` | Ícone "maskable": fundo até a borda e raio reduzido (72%), para o Android recortá-lo em círculo ou outra forma sem cortar o desenho |
| `apple-touch-icon.png` | Ícone do iPhone/iPad (180×180, sem transparência; o iOS arredonda sozinho) |

Em [index.html](../index.html) foram adicionadas as tags: `<link rel="manifest">`, `<link rel="apple-touch-icon">`, `apple-mobile-web-app-capable`, `mobile-web-app-capable` e `apple-mobile-web-app-title`.

### Como instalar no celular
- **Android (Chrome):** menu ⋮ → "Instalar app" / "Adicionar à tela inicial".
- **iPhone (Safari):** Compartilhar → "Adicionar à Tela de Início".

### Observações
- Se o site já tinha sido adicionado antes, remova o atalho antigo e adicione de novo: o celular guarda o ícone velho.
- Não há service worker, então o app **não funciona offline**. O manifest é suficiente para o ícone e o modo tela cheia.

### Como alterar o visual
Edite/regenere os PNGs mantendo os nomes e tamanhos. O `icon-maskable-512.png` deve ter o desenho dentro da "zona segura" (cerca de 80% central).

---

## 2. GIFs de execução dos exercícios

### Objetivo
Mostrar, para cada exercício do treino, um GIF animado de como executá-lo, usando o dataset público
[hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset).

### Sobre o dataset
- 1.324 exercícios, cada um com `id`, `name` (em inglês), `target`, `equipment`, instruções em 10 idiomas (sem português) e um GIF 180×180.
- Os GIFs ficam em `videos/<id>-<media_id>.gif` no repositório e somam **127 MB**.
- **Licença:** os dados são MIT. As **mídias (GIFs) pertencem à Gym visual** e são redistribuídas sob termos próprios (`NOTICE.md` do dataset): manter o crédito **"© Gym visual — https://gymvisual.com/"** e não usar acima de 180×180. Clonar o repositório não concede licença. Para uso comercial/público, leia os termos em <https://gymvisual.com/content/3-terms-and-conditions-of-use> e obtenha licença própria se necessário.

### Visão geral da solução

```
Usuário digita no campo "nome"
        │
        ▼
BuscaExercicio ── busca em ──▶ catalogo.json (lazy, ~196 KB, nomes em PT)
        │  usuário escolhe uma sugestão
        ▼
formulário guarda  nome + exercicio_ref (id do dataset, ex.: "0025")
        │  salvar
        ▼
API Django grava exercicio_ref em Exercicio / TreinoItem
        │
        ▼
Dashboard e Sessão ── GifExercicio ──▶ GIF via CDN jsDelivr (URL montada a partir do id)
```

Decisões de projeto:

- **Vínculo por id, não por nome.** Os nomes do usuário são texto livre ("Supino reto") e o dataset está em inglês; casar por texto seria frágil. O usuário escolhe o exercício numa busca e o app guarda só o `id` (`exercicio_ref`).
- **Vínculo opcional.** Exercícios sem `exercicio_ref` (todos os antigos, ou nome digitado à mão) funcionam como antes, apenas sem GIF.
- **GIFs não entram no repositório nem no build.** São 127 MB; por isso são servidos por CDN (ver [Hospedagem dos GIFs](#hospedagem-dos-gifs)).
- **Catálogo carregado sob demanda.** O JSON é um chunk separado (`import()` dinâmico); só é baixado quando um formulário ou uma miniatura precisa dele.

### Backend (`division-back`)

| Arquivo | Alteração |
|---|---|
| [api/models.py](../../division-back/api/models.py) | Novo campo `exercicio_ref = CharField(max_length=10, blank=True, default='')` em `Exercicio` e em `TreinoItem` |
| `api/migrations/0003_exercicio_ref.py` | Migration que adiciona o campo nas duas tabelas (linhas existentes recebem `''`) |
| [api/serializers.py](../../division-back/api/serializers.py) | `TreinoItemSerializer` passa a expor `exercicio_ref`. `ExercicioSerializer` (`fields='__all__'`) já o inclui automaticamente |
| [api/views.py](../../division-back/api/views.py) | `TreinoIniciarAPIView` copia `exercicio_ref` de cada `TreinoItem` ao criar os `Exercicio` |

Contrato da API: `exercicio_ref` é uma string opcional (`""` = sem GIF) em `/api/exercicios/` e nos `itens` de `/api/treinos/`.

**Deploy:** rode `python manage.py migrate` antes de usar o novo front. Um front novo com back antigo continua funcionando, mas o vínculo não é salvo (o campo é ignorado pela API).

### Frontend (`division-front`)

#### Dados: `src/data/catalogo.json`
Lista com os 1.324 exercícios, ordenada por nome, com apenas o necessário:

```json
{ "id": "0025", "nome": "Supino reto com barra", "en": "barbell bench press",
  "alvo": "Peitoral", "equip": "Barra", "gif": "EIeI8Vf" }
```

- `nome`: tradução para português do Brasil, feita em lote (por modelo de linguagem) a partir do nome em inglês. Foi conferida por amostragem, não linha a linha; corrija diretamente no JSON qualquer termo que prefira. Existem 2 nomes traduzidos repetidos; a busca mostra músculo e equipamento para diferenciá-los.
- `alvo` / `equip`: músculo alvo e equipamento traduzidos por tabela de correspondência.
- `gif`: o `media_id` do dataset; junto com `id` forma o nome do arquivo `<id>-<gif>.gif`.
- Instruções passo a passo do dataset **não** foram incluídas (não existem em português).

#### Utilitário: [src/utils/catalogo.ts](../src/utils/catalogo.ts)
- `carregarCatalogo()`: importa o JSON dinamicamente e guarda a promessa em cache.
- `buscarNoCatalogo(catalogo, consulta, limite = 30)`: normaliza acentos/maiúsculas; todos os termos digitados precisam aparecer no nome em português **ou** no inglês. Retorna até 30 resultados.
- `urlDoGif(item)`: monta `<base>/<id>-<gif>.gif`.
- `CREDITO_GIFS`: texto de atribuição exibido junto ao GIF.

#### Hooks: [src/hooks/useCatalogo.ts](../src/hooks/useCatalogo.ts)
- `useCatalogo(ativo)`: devolve a lista (vazia até carregar; falhas de carregamento são silenciosas).
- `useItemCatalogo(id)`: devolve o item de um `exercicio_ref`, ou `undefined`. Só carrega o catálogo se houver `id`.

#### Componentes
- **`BuscaExercicio`** (`components/BuscaExercicio/`): campo de texto com lista de sugestões (miniatura, nome, músculo · equipamento). Ao escolher, chama `onEscolher(item)`; ao editar o texto, o vínculo **é mantido** até o usuário remover pela etiqueta "GIF vinculado ✕". A escolha usa `onMouseDown` + `preventDefault` para não perder o clique com o `blur` do input.
- **`GifExercicio`** (`components/GifExercicio/`): miniatura 56×56 com botão de play; ao tocar, abre um `Modal` com o GIF ampliado, músculo · equipamento e o crédito da Gym visual. Não renderiza nada se não houver `exercicio_ref`, se o id não existir no catálogo ou se a imagem falhar ao carregar.

#### Telas alteradas
| Arquivo | Alteração |
|---|---|
| `components/ExercicioForm/ExercicioForm.tsx` | Nome passa a usar `BuscaExercicio`; envia `exercicio_ref` |
| `components/TreinoForm/TreinoForm.tsx` | Cada linha usa `BuscaExercicio`; `exercicioRef` faz parte do estado da linha e é enviado nos `itens` |
| `pages/Dashboard/Dashboard.tsx` | Card mostra `GifExercicio` no lugar do ícone quando há vínculo; "Salvar como treino" preserva `exercicio_ref` |
| `pages/Sessao/Sessao.tsx` | Miniatura do GIF ao lado de cada exercício vinculado |
| `types/exercicio.ts` | `Exercicio.exercicio_ref: string`; `ExercicioInput.exercicio_ref?: string` |
| `index.css` | Estilos `.gif-thumb`, `.gif-demo`, `.sessao-item`, `.busca-ex*` |

Na **Sessão**, o card inteiro é um `<button>` (marca como feito). Como um botão não pode conter outro, a miniatura fica **fora** dele, posicionada por CSS (`.sessao-item__gif`), e tocar nela não marca o exercício.

`Treinos.tsx` não foi alterado: o "Importar atuais" já repassa `exercicio_ref` porque os objetos importados o carregam.

### Hospedagem dos GIFs
Configurada em `utils/catalogo.ts` pela variável `VITE_GIF_BASE_URL`:

- **Padrão (sem configurar nada):** CDN jsDelivr apontando para o repositório do dataset **fixado no commit** `7455efae41b330c265e7cd4b78dfa848e7ce5ebd`, para que atualizações ou remoções no repositório original não quebrem o app:
  `https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae.../videos/<id>-<gif>.gif`
- **Hospedagem própria:** copie a pasta `videos/` do dataset para `public/videos/` e defina `VITE_GIF_BASE_URL=/videos` (no `.env` local e nas variáveis do Vercel). Isso adiciona ~127 MB ao repositório/deploy.
- **Só alguns GIFs:** copie apenas os arquivos dos exercícios usados para `public/videos/` e use a mesma variável.

A variável está documentada em `.env.example`.

**Riscos do padrão (CDN):** depende de um serviço de terceiros e do repositório do dataset continuar existindo; com o commit fixado, o jsDelivr costuma manter o cache, mas não há garantia. Se o GIF falhar ao carregar, a miniatura simplesmente não aparece (o app segue funcional).

### Como usar
1. Em **Novo exercício** ou **Novo treino**, comece a digitar o nome (ex.: "supino").
2. Toque numa sugestão: o nome é preenchido e surge a etiqueta "GIF vinculado".
3. Salve. A miniatura aparece no Dashboard e na Sessão; toque nela para ver o GIF ampliado.
4. Para desvincular, toque no ✕ da etiqueta. Você pode editar o nome livremente sem perder o vínculo.

### Atualizar ou manter o catálogo
- **Corrigir um nome/tradução:** edite o campo `nome` em `src/data/catalogo.json`.
- **Atualizar para uma versão nova do dataset:** regenere o JSON a partir de `data/exercises.json` do dataset (campos `id`, `name`, `target`, `equipment` e o `media_id` extraído de `gif_url`), traduza os nomes novos e atualize o hash do commit em `utils/catalogo.ts`. Ids já vinculados só continuam válidos se o dataset mantiver os mesmos ids.

### Limitações conhecidas
- Instruções escritas e traduções de instruções não são exibidas (o dataset não tem português).
- A busca é textual simples (não tolera erros de digitação).
- Não há vínculo retroativo automático: exercícios já cadastrados precisam ser editados para receber um GIF.
- As traduções dos nomes não foram revisadas uma a uma.
- Os testes automatizados do Django não foram executados (dependem de PostgreSQL local); a migration foi gerada com `makemigrations`. O front passou em `tsc -b`, `eslint` e `vite build`; **não houve teste visual no navegador**.

### Como reverter
- **Front:** remova `BuscaExercicio`, `GifExercicio`, `useCatalogo.ts`, `utils/catalogo.ts`, `src/data/catalogo.json` e os estilos adicionados ao fim de `index.css`; restaure os inputs de nome em `ExercicioForm`/`TreinoForm` e o ícone no `Dashboard`/`Sessao`.
- **Back:** `python manage.py migrate api 0002` remove os campos; depois apague `0003_exercicio_ref.py` e as menções a `exercicio_ref` em models/serializers/views.
