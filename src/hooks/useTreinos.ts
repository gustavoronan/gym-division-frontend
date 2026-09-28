import { useCallback, useEffect, useState } from "react";
import { treinosApi } from "../services/api";
import type { Treino, TreinoInput } from "../types/treino";

// Mesma ordem do backend (por nome), para o resultado não "pular" ao recarregar.
const ordenar = (lista: Treino[]) =>
  [...lista].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

export function useTreinos() {
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    treinosApi
      .listar()
      .then((dados) => ativo && setTreinos(dados))
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
    setTreinos((lista) => ordenar([...lista, novo]));
  };

  const editar = async (id: number, dados: TreinoInput) => {
    const atualizado = await treinosApi.atualizar(id, dados);
    setTreinos((lista) =>
      ordenar(lista.map((t) => (t.id === id ? atualizado : t))),
    );
  };

  const excluir = async (id: number) => {
    await treinosApi.excluir(id);
    setTreinos((lista) => lista.filter((t) => t.id !== id));
  };

  return { treinos, carregando, erro, recarregar, criar, editar, excluir };
}
