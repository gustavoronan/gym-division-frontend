import { useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import ExercicioForm from "../../components/ExercicioForm/ExercicioForm";
import Modal from "../../components/Modal/Modal";
import {
  ErroEstado,
  ListaSkeleton,
  VazioEstado,
} from "../../components/States/States";
import { useToast } from "../../components/Toast/toastContext";
import TreinoForm from "../../components/TreinoForm/TreinoForm";
import { useExercicios } from "../../hooks/useExercicios";
import { treinosApi } from "../../services/api";
import type { Exercicio, ExercicioInput } from "../../types/exercicio";
import type { TreinoInput } from "../../types/treino";
import { formatarDataCurta } from "../../utils/data";

const LIMITE_BUSCA = 5;

export default function Dashboard() {
  const { exercicios, carregando, erro, recarregar, criar, editar, excluir } =
    useExercicios();
  const toast = useToast();

  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<Exercicio | "novo" | null>(null);
  const [removendo, setRemovendo] = useState<Exercicio | null>(null);
  const [salvandoTreino, setSalvandoTreino] = useState(false);

  const termo = busca.trim().toLowerCase();
  const visiveis = termo
    ? exercicios.filter((e) => e.nome.toLowerCase().includes(termo))
    : exercicios;

  const salvar = async (dados: ExercicioInput) => {
    try {
      if (editando === "novo") {
        await criar(dados);
        toast.sucesso("Exercício adicionado!");
      } else if (editando) {
        await editar(editando.id, dados);
        toast.sucesso("Alterações salvas!");
      }
      setEditando(null);
    } catch (e) {
      toast.erro((e as Error).message);
    }
  };

  const salvarComoTreino = async (dados: TreinoInput) => {
    try {
      await treinosApi.criar(dados);
      toast.sucesso(`Treino "${dados.nome}" salvo!`);
      setSalvandoTreino(false);
    } catch (e) {
      toast.erro((e as Error).message);
    }
  };

  const confirmarExclusao = async () => {
    if (!removendo) return;
    try {
      await excluir(removendo.id);
      toast.sucesso("Exercício removido.");
      setRemovendo(null);
    } catch (e) {
      toast.erro((e as Error).message);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Meus exercícios</h1>
          <p>
            {carregando
              ? "Carregando…"
              : `${exercicios.length} ${exercicios.length === 1 ? "exercício cadastrado" : "exercícios cadastrados"}`}
          </p>
        </div>
        <button
          className="btn btn--primary btn--icon-text"
          onClick={() => setEditando("novo")}
        >
          <i className="bi bi-plus-lg" /> Novo
        </button>
      </header>

      {exercicios.length >= LIMITE_BUSCA && (
        <label className="search">
          <i className="bi bi-search" />
          <input
            type="search"
            value={busca}
            placeholder="Buscar exercício"
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>
      )}

      {carregando ? (
        <ListaSkeleton />
      ) : erro ? (
        <ErroEstado mensagem={erro} onTentar={recarregar} />
      ) : exercicios.length === 0 ? (
        <VazioEstado
          icone="bi-lightning-charge"
          titulo="Nenhum exercício ainda"
          texto="Cadastre seu primeiro exercício para montar o treino."
        >
          <button className="btn btn--primary" onClick={() => setEditando("novo")}>
            <i className="bi bi-plus-lg" /> Adicionar exercício
          </button>
        </VazioEstado>
      ) : visiveis.length === 0 ? (
        <VazioEstado
          icone="bi-search"
          titulo="Nada encontrado"
          texto={`Nenhum exercício corresponde a "${busca.trim()}".`}
        />
      ) : (
        <ul className="lista">
          {visiveis.map((exercicio) => (
            <li key={exercicio.id} className="card exercicio">
              <div className="exercicio__icone">
                <i className="bi bi-lightning-charge-fill" />
              </div>
              <div className="exercicio__info">
                <strong>{exercicio.nome}</strong>
                <span>
                  {exercicio.series} × {exercicio.repeticoes} ·{" "}
                  {formatarDataCurta(exercicio.data)}
                </span>
              </div>
              <div className="exercicio__acoes">
                <button
                  className="icon-btn"
                  onClick={() => setEditando(exercicio)}
                  aria-label={`Editar ${exercicio.nome}`}
                >
                  <i className="bi bi-pencil" />
                </button>
                <button
                  className="icon-btn icon-btn--danger"
                  onClick={() => setRemovendo(exercicio)}
                  aria-label={`Excluir ${exercicio.nome}`}
                >
                  <i className="bi bi-trash3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!carregando && !erro && exercicios.length > 0 && (
        <button
          className="btn btn--ghost btn--block"
          onClick={() => setSalvandoTreino(true)}
        >
          <i className="bi bi-bookmark-plus" /> Salvar como treino
        </button>
      )}

      {salvandoTreino && (
        <Modal titulo="Salvar como treino" onFechar={() => setSalvandoTreino(false)}>
          <TreinoForm
            inicial={{
              nome: "",
              itens: exercicios.map(({ nome, series, repeticoes }) => ({
                nome,
                series,
                repeticoes,
              })),
            }}
            textoSalvar="Salvar treino"
            onSalvar={salvarComoTreino}
            onCancelar={() => setSalvandoTreino(false)}
          />
        </Modal>
      )}

      {editando && (
        <Modal
          titulo={editando === "novo" ? "Novo exercício" : "Editar exercício"}
          onFechar={() => setEditando(null)}
        >
          <ExercicioForm
            inicial={editando === "novo" ? undefined : editando}
            onSalvar={salvar}
            onCancelar={() => setEditando(null)}
          />
        </Modal>
      )}

      {removendo && (
        <ConfirmDialog
          titulo="Excluir exercício"
          mensagem={`Tem certeza que deseja excluir "${removendo.nome}"? Essa ação não pode ser desfeita.`}
          textoConfirmar="Excluir"
          onConfirmar={confirmarExclusao}
          onCancelar={() => setRemovendo(null)}
        />
      )}
    </>
  );
}
