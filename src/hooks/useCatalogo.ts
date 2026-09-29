import { useEffect, useState } from "react";
import { carregarCatalogo, type ItemCatalogo } from "../utils/catalogo";

export function useCatalogo(ativo = true) {
  const [catalogo, setCatalogo] = useState<ItemCatalogo[]>([]);

  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    carregarCatalogo()
      .then((c) => vivo && setCatalogo(c))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [ativo]);

  return catalogo;
}

// Busca um item pelo id (ex.: para mostrar o GIF de um exercício já salvo).
export function useItemCatalogo(id: string | undefined) {
  const catalogo = useCatalogo(Boolean(id));
  return id ? catalogo.find((i) => i.id === id) : undefined;
}
