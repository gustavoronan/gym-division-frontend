import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import Modal from "../../components/Modal/Modal";
import {
  ErroEstado,
  ListaSkeleton,
  VazioEstado,
} from "../../components/States/States";
import { useToast } from "../../components/Toast/toastContext";
import TreinoForm from "../../components/TreinoForm/TreinoForm";
import { useExercicios } from "../../hooks/useExercicios";
import { useTreinos } from "../../hooks/useTreinos";
import { treinosApi } from "../../services/api";
import type { Treino, TreinoInput } from "../../types/treino";

const ITENS_VISIVEIS = 4;

export default function Treinos() {
  const { treinos, carregando, erro, recarregar, criar, editar, excluir } =
    useTreinos();
  // A lista atual de exercícios é usada para perguntar "substituir ou adicionar?"
  // e para importar exercícios ao montar um treino novo.
  const { exercicios, carregando: carregandoAtuais } = useExercicios();
  const toast = useToast();
  const navigate = useNavigate();

  const [editando, setEditando] = useState<Treino | "novo" | null>(null);
  const [removendo, setRemovendo] = useState<Treino | null>(null);
  const [escolhendo, setEscolhendo] = useState<Treino | null>(null);
  const [iniciando, setIniciando] = useState(false);

  const iniciar = async (treino: Treino, substituir: boolean) => {
    setEscolhendo(null);
    setIniciando(true);
    try {
      await treinosApi.iniciar(treino.id, substituir);
      toast.sucesso(`${treino.nome} carregado. Bom treino!`);
      navigate("/sessao");
    } catch (e) {
      toast.erro((e as Error).message);
    } finally {
      setIniciando(false);
    }
  };

  const aoClicarIniciar = (treino: Treino) =>
    exercicios.length === 0 ? iniciar(treino, false) : setEscolhendo(treino);

  const salvar = async (dados: TreinoInput) => {
    try {
      if (editando === "novo") {
        await criar(dados);
        toast.sucesso("Treino salvo!");
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
      toast.sucesso("Treino removido.");
      setRemovendo(null);
    } catch (e) {
      toast.erro((e as Error).message);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Meus treinos</h1>
          <p>
            {carregando
              ? "Carregando…"
              : `${treinos.length} ${treinos.length === 1 ? "treino salvo" : "treinos salvos"}`}
          </p>
        </div>
        <button
          className="btn btn--primary btn--icon-text"
          onClick={() => setEditando("novo")}
          disabled={carregando || !!erro}
        >
          <i className="bi bi-plus-lg" /> Novo
        </button>
      </header>

      {carregando ? (
        <ListaSkeleton linhas={3} />
      ) : erro ? (
        <ErroEstado mensagem={erro} onTentar={recarregar} />
      ) : treinos.length === 0 ? (
        <VazioEstado
          icone="bi-collection"
          titulo="Nenhum treino salvo"
          texto="Monte treinos como “Perna A” ou “Superior B” e carregue-os com um toque."
        >
          <button className="btn btn--primary" onClick={() => setEditando("novo")}>
            <i className="bi bi-plus-lg" /> Criar treino
          </button>
        </VazioEstado>
      ) : (
        <ul className="lista">
          {treinos.map((treino) => (
            <li key={treino.id} className="card treino">
              <div className="treino__topo">
                <div className="treino__titulo">
                  <strong>{treino.nome}</strong>
                  <span>
                    {treino.itens.length}{" "}
                    {treino.itens.length === 1 ? "exercício" : "exercícios"}
                  </span>
                </div>
                <div className="exercicio__acoes">
                  <button
                    className="icon-btn"
                    onClick={() => setEditando(treino)}
                    aria-label={`Editar ${treino.nome}`}
                  >
                    <i className="bi bi-pencil" />
                  </button>
                  <button
                    className="icon-btn icon-btn--danger"
                    onClick={() => setRemovendo(treino)}
                    aria-label={`Excluir ${treino.nome}`}
                  >
                    <i className="bi bi-trash3" />
                  </button>
                </div>
              </div>

              <ul className="treino__itens">
                {treino.itens.slice(0, ITENS_VISIVEIS).map((item, i) => (
                  <li key={i}>
                    <span>{item.nome}</span>
                    <em>
                      {item.series} × {item.repeticoes}
                    </em>
                  </li>
                ))}
                {treino.itens.length > ITENS_VISIVEIS && (
                  <li className="treino__mais">
                    +{treino.itens.length - ITENS_VISIVEIS} exercícios
                  </li>
                )}
              </ul>

              <button
                className="btn btn--primary btn--block"
                onClick={() => aoClicarIniciar(treino)}
                disabled={carregandoAtuais || iniciando}
              >
                <i className="bi bi-play-fill" />{" "}
                {iniciando ? "Carregando…" : "Iniciar treino"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {editando && (
        <Modal
          titulo={editando === "novo" ? "Novo treino" : "Editar treino"}
          onFechar={() => setEditando(null)}
        >
          <TreinoForm
            inicial={editando === "novo" ? undefined : editando}
            importaveis={editando === "novo" ? exercicios : undefined}
            textoSalvar={editando === "novo" ? "Salvar treino" : "Salvar alterações"}
            onSalvar={salvar}
            onCancelar={() => setEditando(null)}
          />
        </Modal>
      )}

      {removendo && (
        <ConfirmDialog
          titulo="Excluir treino"
          mensagem={`Excluir o treino "${removendo.nome}"? Seus exercícios atuais não serão afetados.`}
          textoConfirmar="Excluir"
          onConfirmar={confirmarExclusao}
          onCancelar={() => setRemovendo(null)}
        />
      )}

      {escolhendo && (
        <Modal titulo={`Iniciar ${escolhendo.nome}`} onFechar={() => setEscolhendo(null)}>
          <p className="confirm__msg">
            Você já tem {exercicios.length}{" "}
            {exercicios.length === 1 ? "exercício" : "exercícios"} na lista atual. O que
            fazer com {exercicios.length === 1 ? "ele" : "eles"}?
          </p>
          <div className="form__actions form__actions--coluna">
            <button
              className="btn btn--primary"
              onClick={() => iniciar(escolhendo, true)}
            >
              Substituir pelo treino
            </button>
            <button className="btn btn--ghost" onClick={() => iniciar(escolhendo, false)}>
              Manter e adicionar
            </button>
            <button className="btn btn--ghost" onClick={() => setEscolhendo(null)}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
