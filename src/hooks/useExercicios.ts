import { useCallback, useEffect, useState } from "react";
import { exerciciosApi } from "../services/api";
import type { Exercicio, ExercicioInput } from "../types/exercicio";

export function useExercicios() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    exerciciosApi
      .listar()
      .then((dados) => ativo && setExercicios(dados))
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

  const substituir = (atualizado: Exercicio) =>
    setExercicios((lista) =>
      lista.map((e) => (e.id === atualizado.id ? atualizado : e)),
    );

  const criar = async (dados: ExercicioInput) => {
    const novo = await exerciciosApi.criar(dados);
    setExercicios((lista) => [...lista, novo]);
  };

  const editar = async (id: number, dados: ExercicioInput) => {
    substituir(await exerciciosApi.atualizar(id, dados));
  };

  const excluir = async (id: number) => {
    await exerciciosApi.excluir(id);
    setExercicios((lista) => lista.filter((e) => e.id !== id));
  };

  // Atualização otimista: a UI responde na hora e volta atrás se a API falhar.
  const definirConcluido = async (id: number, concluido: boolean) => {
    const marcar = (valor: boolean) =>
      setExercicios((lista) =>
        lista.map((e) => (e.id === id ? { ...e, concluido: valor } : e)),
      );
    marcar(concluido);
    try {
      await exerciciosApi.atualizar(id, { concluido });
    } catch (e) {
      marcar(!concluido);
      throw e;
    }
  };

  const reiniciar = async () => {
    const feitos = exercicios.filter((e) => e.concluido);
    setExercicios((lista) => lista.map((e) => ({ ...e, concluido: false })));
    const resultados = await Promise.allSettled(
      feitos.map((e) => exerciciosApi.atualizar(e.id, { concluido: false })),
    );
    const falhas = feitos.filter((_, i) => resultados[i].status === "rejected");
    if (falhas.length > 0) {
      const ids = new Set(falhas.map((e) => e.id));
      setExercicios((lista) =>
        lista.map((e) => (ids.has(e.id) ? { ...e, concluido: true } : e)),
      );
      throw new Error("Não foi possível reiniciar todos os exercícios.");
    }
  };

  return {
    exercicios,
    carregando,
    erro,
    recarregar,
    criar,
    editar,
    excluir,
    definirConcluido,
    reiniciar,
  };
}
