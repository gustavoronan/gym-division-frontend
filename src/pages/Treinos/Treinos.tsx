import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import Modal from "../../components/Modal/Modal";
import QRCodeModal from "../../components/QRCodeModal/QRCodeModal";
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

const DIAS_LABELS: Record<number, string> = {
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
  0: "Dom",
};

const NOMES_DIAS: Record<number, string> = {
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
  0: "Domingo",
};

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
  const [compartilhando, setCompartilhando] = useState<{
    treino: Treino;
    codigo: string;
  } | null>(null);
  const [gerandoCodigo, setGerandoCodigo] = useState<number | null>(null);

  const hojeDia = new Date().getDay(); // 0=Dom, 1=Seg...
  const nomeHoje = NOMES_DIAS[hojeDia];

  const sugeridoHoje = useMemo(() => {
    return treinos.find((t) => Array.isArray(t.dias_semana) && t.dias_semana.includes(hojeDia));
  }, [treinos, hojeDia]);

  const abrirCompartilhar = async (treino: Treino) => {
    if (treino.codigo_compartilhamento) {
      setCompartilhando({ treino, codigo: treino.codigo_compartilhamento });
      return;
    }
    setGerandoCodigo(treino.id);
    try {
      const res = await treinosApi.compartilhar(treino.id);
      treino.codigo_compartilhamento = res.codigo;
      setCompartilhando({ treino, codigo: res.codigo });
    } catch (e) {
      toast.erro((e as Error).message);
    } finally {
      setGerandoCodigo(null);
    }
  };

  const iniciar = async (treino: Treino, substituir: boolean) => {
    setEscolhendo(null);
    setIniciando(true);
    try {
      await treinosApi.iniciar(treino.id, substituir);
      localStorage.setItem("treino_iniciado_em", new Date().toISOString());
      toast.sucesso(`${treino.nome} iniciado. Bom treino!`);
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

      {/* Sugestão flexível para o dia de hoje */}
      {!carregando && !erro && sugeridoHoje && (
        <section className="card banner-sugestao">
          <div className="banner-sugestao__icone">
            <i className="bi bi-calendar-check" />
          </div>
          <div className="banner-sugestao__conteudo">
            <span className="banner-sugestao__tag">
              💡 Sugestão para hoje ({nomeHoje})
            </span>
            <strong>{sugeridoHoje.nome}</strong>
            <p>
              {sugeridoHoje.itens.length} exercícios planejados. Ocorreu imprevisto?
              Fique à vontade para escolher outro treino abaixo!
            </p>
            <div className="banner-sugestao__acoes">
              <button
                className="btn btn--primary btn--sm"
                onClick={() => aoClicarIniciar(sugeridoHoje)}
                disabled={carregandoAtuais || iniciando}
              >
                <i className="bi bi-play-fill" /> Iniciar sugerido
              </button>
            </div>
          </div>
        </section>
      )}

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
          {treinos.map((treino) => {
            const ehHoje =
              Array.isArray(treino.dias_semana) && treino.dias_semana.includes(hojeDia);
            return (
              <li key={treino.id} className="card treino">
                <div className="treino__topo">
                  <div className="treino__titulo">
                    <div className="treino__titulo-linha">
                      <strong>{treino.nome}</strong>
                      {ehHoje && <span className="selo">Hoje</span>}
                    </div>
                    <span>
                      {treino.itens.length}{" "}
                      {treino.itens.length === 1 ? "exercício" : "exercícios"}
                    </span>
                  </div>
                  <div className="exercicio__acoes">
                    <button
                      className="icon-btn"
                      onClick={() => abrirCompartilhar(treino)}
                      disabled={gerandoCodigo === treino.id}
                      aria-label={`Compartilhar ${treino.nome} por link ou QR Code`}
                      title="Compartilhar treino (Link / QR Code)"
                    >
                      <i className={gerandoCodigo === treino.id ? "bi bi-arrow-repeat spin" : "bi bi-qr-code"} />
                    </button>
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

                {/* Dias sugeridos da semana */}
                {Array.isArray(treino.dias_semana) && treino.dias_semana.length > 0 && (
                  <div className="treino__dias-badge">
                    <i className="bi bi-calendar-week" />
                    <span>
                      {treino.dias_semana
                        .slice()
                        .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
                        .map((d) => DIAS_LABELS[d] ?? d)
                        .join(", ")}
                    </span>
                  </div>
                )}

                <ul className="treino__itens">
                  {treino.itens.slice(0, ITENS_VISIVEIS).map((item, i) => (
                    <li key={i}>
                      <span>{item.nome}</span>
                      <em>
                        {item.series} × {item.repeticoes}
                        {item.carga ? ` · ${item.carga}kg` : ""}
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
            );
          })}
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

      {compartilhando && (
        <QRCodeModal
          aberto={!!compartilhando}
          aoFechar={() => setCompartilhando(null)}
          treinoNome={compartilhando.treino.nome}
          codigo={compartilhando.codigo}
        />
      )}
    </>
  );
}
