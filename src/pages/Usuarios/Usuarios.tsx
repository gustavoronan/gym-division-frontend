import { useState } from "react";
import { useAuth } from "../../components/Auth/authContext";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import Modal from "../../components/Modal/Modal";
import { ErroEstado, ListaSkeleton } from "../../components/States/States";
import { useToast } from "../../components/Toast/toastContext";
import UsuarioForm from "../../components/UsuarioForm/UsuarioForm";
import { useUsuarios } from "../../hooks/useUsuarios";
import type { Usuario, UsuarioInput } from "../../types/usuario";

export default function Usuarios() {
  const { usuario: eu } = useAuth();
  const { usuarios, carregando, erro, recarregar, criar, editar, excluir } = useUsuarios();
  const toast = useToast();

  const [editando, setEditando] = useState<Usuario | "novo" | null>(null);
  const [removendo, setRemovendo] = useState<Usuario | null>(null);

  const salvar = async (dados: UsuarioInput) => {
    try {
      if (editando === "novo") {
        await criar(dados);
        toast.sucesso(`Usuário "${dados.username}" criado!`);
      } else if (editando) {
        await editar(editando.id, dados);
        toast.sucesso("Alterações salvas!");
      }
      setEditando(null);
    } catch (e) {
      toast.erro((e as Error).message);
    }
  };

  const confirmarExclusao = async () => {
    if (!removendo) return;
    try {
      await excluir(removendo.id);
      toast.sucesso("Usuário removido.");
      setRemovendo(null);
    } catch (e) {
      toast.erro((e as Error).message);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Usuários</h1>
          <p>
            {carregando
              ? "Carregando…"
              : `${usuarios.length} ${usuarios.length === 1 ? "usuário" : "usuários"}`}
          </p>
        </div>
        <button
          className="btn btn--primary btn--icon-text"
          onClick={() => setEditando("novo")}
          disabled={carregando || !!erro}
        >
          <i className="bi bi-person-plus-fill" /> Novo
        </button>
      </header>

      {carregando ? (
        <ListaSkeleton linhas={3} />
      ) : erro ? (
        <ErroEstado mensagem={erro} onTentar={recarregar} />
      ) : (
        <ul className="lista">
          {usuarios.map((u) => (
            <li key={u.id} className={`card usuario ${u.is_active ? "" : "usuario--inativo"}`}>
              <div className="usuario__info">
                <strong>{u.first_name || u.username}</strong>
                <span>
                  @{u.username}
                  {u.is_staff && <em className="selo">admin</em>}
                  {!u.is_active && <em className="selo selo--off">inativo</em>}
                </span>
              </div>
              <div className="exercicio__acoes">
                <button
                  className="icon-btn"
                  onClick={() => setEditando(u)}
                  aria-label={`Editar ${u.username}`}
                >
                  <i className="bi bi-pencil" />
                </button>
                {u.id !== eu.id && (
                  <button
                    className="icon-btn icon-btn--danger"
                    onClick={() => setRemovendo(u)}
                    aria-label={`Excluir ${u.username}`}
                  >
                    <i className="bi bi-trash3" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editando && (
        <Modal
          titulo={editando === "novo" ? "Novo usuário" : "Editar usuário"}
          onFechar={() => setEditando(null)}
        >
          <UsuarioForm
            inicial={editando === "novo" ? undefined : editando}
            onSalvar={salvar}
            onCancelar={() => setEditando(null)}
          />
        </Modal>
      )}

      {removendo && (
        <ConfirmDialog
          titulo="Excluir usuário?"
          mensagem={`"${removendo.username}" e todos os treinos e exercícios dele serão apagados. Esta ação não pode ser desfeita.`}
          textoConfirmar="Excluir"
          onConfirmar={confirmarExclusao}
          onCancelar={() => setRemovendo(null)}
        />
      )}
    </>
  );
}
