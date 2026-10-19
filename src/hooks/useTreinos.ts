import { useCallback, useEffect, useState } from "react";
import { treinosApi } from "../services/api";
import type { Treino, TreinoInput } from "../types/treino";

// 1=Segunda, 2=Terça, ..., 6=Sábado, 0=Domingo
const DIAS_PADRAO_SEMANA = [1, 2, 3, 4, 5, 6, 0];

export const diaScore = (dia: number) => (dia === 0 ? 7 : dia);

export const menorDiaScore = (t: Treino) => {
  if (!Array.isArray(t.dias_semana) || t.dias_semana.length === 0) return 99;
  return Math.min(...t.dias_semana.map(diaScore));
};

export const ordenarPorDia = (lista: Treino[]) => {
  let ordemSalva: number[] = [];
  try {
    const raw = localStorage.getItem("treinos_ordem");
    if (raw) ordemSalva = JSON.parse(raw);
  } catch {}

  return [...lista].sort((a, b) => {
    const scoreA = menorDiaScore(a);
    const scoreB = menorDiaScore(b);

    if (scoreA !== scoreB) return scoreA - scoreB;

    const idxA = ordemSalva.indexOf(a.id);
    const idxB = ordemSalva.indexOf(b.id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;

    return a.nome.localeCompare(b.nome, "pt-BR");
  });
};

export function calcularDiasSlots(treinos: Treino[]): number[][] {
  const slots: number[][] = [];
  const diasUsados = new Set<number>();

  for (const t of treinos) {
    if (Array.isArray(t.dias_semana) && t.dias_semana.length > 0) {
      slots.push([...t.dias_semana]);
      t.dias_semana.forEach((d) => diasUsados.add(d));
    } else {
      slots.push([]);
    }
  }

  let proxIdx = 0;
  for (let i = 0; i < slots.length; i++) {
    if (slots[i].length === 0) {
      while (proxIdx < DIAS_PADRAO_SEMANA.length && diasUsados.has(DIAS_PADRAO_SEMANA[proxIdx])) {
        proxIdx++;
      }
      const dia =
        proxIdx < DIAS_PADRAO_SEMANA.length
          ? DIAS_PADRAO_SEMANA[proxIdx]
          : DIAS_PADRAO_SEMANA[i % DIAS_PADRAO_SEMANA.length];
      slots[i] = [dia];
      diasUsados.add(dia);
      proxIdx++;
    }
  }

  return slots;
}

export function useTreinos() {
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    treinosApi
      .listar()
      .then((dados) => ativo && setTreinos(ordenarPorDia(dados)))
      .catch((e: Error) => ativo && setErro(e.message))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  const recarregar = useCallback(() => {
    setErro(null);
    setCarregando(true);
    setTentativa((t) => t + 1);
  }, []);

  const criar = async (dados: TreinoInput) => {
    const novo = await treinosApi.criar(dados);
    setTreinos((lista) => ordenarPorDia([...lista, novo]));
  };

  const editar = async (id: number, dados: TreinoInput) => {
    const atualizado = await treinosApi.atualizar(id, dados);
    setTreinos((lista) =>
      ordenarPorDia(lista.map((t) => (t.id === id ? atualizado : t))),
    );
  };

  const excluir = async (id: number) => {
    await treinosApi.excluir(id);
    setTreinos((lista) => lista.filter((t) => t.id !== id));
  };

  const reordenar = async (origemIndex: number, destinoIndex: number): Promise<Treino[]> => {
    if (
      origemIndex === destinoIndex ||
      origemIndex < 0 ||
      destinoIndex < 0 ||
      origemIndex >= treinos.length ||
      destinoIndex >= treinos.length
    ) {
      return treinos;
    }

    const diasSlots = calcularDiasSlots(treinos);

    const novaLista = [...treinos];
    const [removido] = novaLista.splice(origemIndex, 1);
    novaLista.splice(destinoIndex, 0, removido);

    const treinosAtualizados = novaLista.map((treino, idx) => ({
      ...treino,
      dias_semana: diasSlots[idx] ?? [],
    }));

    try {
      localStorage.setItem("treinos_ordem", JSON.stringify(treinosAtualizados.map((t) => t.id)));
    } catch {}

    setTreinos(treinosAtualizados);

    const alterados = treinosAtualizados.filter((tNovo) => {
      const tAntigo = treinos.find((t) => t.id === tNovo.id);
      if (!tAntigo) return false;
      const diasAntigos = (tAntigo.dias_semana ?? []).slice().sort().join(",");
      const diasNovos = (tNovo.dias_semana ?? []).slice().sort().join(",");
      return diasAntigos !== diasNovos;
    });

    if (alterados.length > 0) {
      try {
        await Promise.all(
          alterados.map((t) => treinosApi.atualizarDias(t.id, t.dias_semana ?? []))
        );
      } catch {
        // Fallback para PUT completo se PATCH falhar
        await Promise.all(
          alterados.map((t) =>
            treinosApi.atualizar(t.id, {
              nome: t.nome,
              dias_semana: t.dias_semana ?? [],
              itens: t.itens,
            })
          )
        );
      }
    }

    return treinosAtualizados;
  };

  return { treinos, carregando, erro, recarregar, criar, editar, excluir, reordenar };
}
