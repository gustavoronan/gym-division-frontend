# Division — Rastreador de Treinos (frontend)

Interface React (Vite + TypeScript) para cadastrar exercícios e marcar o que já foi feito no treino. Consome a API Django/DRF em `/api/exercicios/`.

## Rodando

```bash
npm install
cp .env.example .env   # ajuste VITE_API_URL se a API não estiver em localhost:8000
npm run dev
```

O backend (repositório `division-back`) precisa estar rodando e com as migrations aplicadas (`python manage.py migrate`), com CORS liberado para `http://localhost:5173`.

## Telas

- **Exercícios (`/`)** — lista, busca, cria, edita e exclui exercícios (RF01, RF02, RF04, RF05, RF06).
- **Treinos (`/treinos`)** — presets como “Perna A” ou “Superior B”: cria, edita, exclui e **inicia** um treino, que carrega seus exercícios na lista atual (substituindo ou adicionando aos existentes). Também é possível salvar a lista atual como treino pela tela Exercícios. Usa `/api/treinos/` e `/api/treinos/{id}/iniciar/`.
- **Treinar (`/sessao`)** — lista de check com progresso; toque para marcar/desmarcar (RF03) e botão para reiniciar o treino.

## Estrutura

```
src/
  services/api.ts        cliente HTTP da API
  hooks/useExercicios.ts estado + operações (com atualização otimista no check)
  hooks/useTreinos.ts    presets de treino
  components/            Modal, formulário, confirmação, toasts, anel de progresso…
  pages/                 Dashboard (catálogo) e Sessao (treino)
  index.css              tema e estilos
```

## Deploy (Vercel)

Importe o repositório na Vercel (preset Vite) e defina `VITE_API_URL` com a URL pública da API terminando em `/api`
(ex.: `https://division-api.onrender.com/api`). A variável é lida no build, então alterá-la exige novo deploy.
O `vercel.json` já inclui o fallback de SPA para o React Router. Passo a passo completo (Neon + Render + Vercel) no `DEPLOY.md` do backend.
