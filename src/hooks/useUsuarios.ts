import { useCallback, useEffect, useState } from "react";
import { usuariosApi } from "../services/api";
import type { Usuario, UsuarioInput } from "../types/usuario";

const ordenar = (lista: Usuario[]) =>
  [...lista].sort((a, b) => a.username.localeCompare(b.username, "pt-BR"));

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    usuariosApi
      .listar()
      .then((dados) => ativo && setUsuarios(dados))
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

  const criar = async (dados: UsuarioInput) => {
    const novo = await usuariosApi.criar(dados);
    setUsuarios((lista) => ordenar([...lista, novo]));
  };

  const editar = async (id: number, dados: Partial<UsuarioInput>) => {
    const atualizado = await usuariosApi.atualizar(id, dados);
    setUsuarios((lista) => ordenar(lista.map((u) => (u.id === id ? atualizado : u))));
  };

  const excluir = async (id: number) => {
    await usuariosApi.excluir(id);
    setUsuarios((lista) => lista.filter((u) => u.id !== id));
  };

  return { usuarios, carregando, erro, recarregar, criar, editar, excluir };
}
