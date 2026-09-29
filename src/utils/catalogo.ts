export interface ItemCatalogo {
  id: string;
  nome: string;
  en: string;
  alvo: string;
  equip: string;
  gif: string;
}

// Os GIFs (© Gym visual) não ficam no build: são servidos por um CDN público a partir
// do repositório do dataset, fixado num commit. Para hospedar você mesmo, copie a pasta
// `videos/` para `public/` e defina VITE_GIF_BASE_URL=/videos.
const GIF_BASE_URL = (
  import.meta.env.VITE_GIF_BASE_URL ??
  "https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@7455efae41b330c265e7cd4b78dfa848e7ce5ebd/videos"
).replace(/\/$/, "");

export const CREDITO_GIFS = "© Gym visual — https://gymvisual.com/";

export const urlDoGif = (item: Pick<ItemCatalogo, "id" | "gif">) =>
  `${GIF_BASE_URL}/${item.id}-${item.gif}.gif`;

// O catálogo tem ~200 KB: só é baixado quando alguma tela precisa dele.
let cache: Promise<ItemCatalogo[]> | null = null;

export function carregarCatalogo(): Promise<ItemCatalogo[]> {
  cache ??= import("../data/catalogo.json").then((m) => m.default as ItemCatalogo[]);
  return cache;
}

const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

// Todos os termos digitados precisam aparecer no nome (em português ou inglês).
export function buscarNoCatalogo(catalogo: ItemCatalogo[], consulta: string, limite = 30) {
  const termos = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (termos.length === 0) return [];
  const achados: ItemCatalogo[] = [];
  for (const item of catalogo) {
    const alvo = normalizar(`${item.nome} ${item.en}`);
    if (termos.every((t) => alvo.includes(t))) {
      achados.push(item);
      if (achados.length >= limite) break;
    }
  }
  return achados;
}
