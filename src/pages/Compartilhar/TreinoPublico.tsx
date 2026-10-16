import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ErroEstado, ListaSkeleton } from "../../components/States/States";
import { useToast } from "../../components/Toast/toastContext";
import { treinosApi } from "../../services/api";
import { sessao } from "../../services/sessao";
import type { TreinoCompartilhado } from "../../types/social";

const DIAS_NOMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function TreinoPublico() {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [treino, setTreino] = useState<TreinoCompartilhado | null>(null);
  const [carregando, setCarregando] = useState(!codigo ? false : true);
  const [importando, setImportando] = useState(false);
  const [erro, setErro] = useState<string | null>(!codigo ? "Código de treino não informado." : null);

  const logado = sessao.token() !== null;

  useEffect(() => {
    if (!codigo) return;

    let ativo = true;
    treinosApi
      .obterCompartilhado(codigo)
      .then((dados) => {
        if (ativo) {
          setTreino(dados);
          setCarregando(false);
        }
      })
      .catch((e: Error) => {
        if (ativo) {
          setErro(e.message || "Treino compartilhado não encontrado.");
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [codigo]);

  const importar = async () => {
    if (!codigo) return;
    if (!logado) {
      sessionStorage.setItem("division_import_pendente", codigo);
      navigate("/");
      return;
    }

    setImportando(true);
    try {
      const novoTreino = await treinosApi.importarCompartilhado(codigo);
      toast.sucesso(`"${novoTreino.nome}" adicionado aos seus treinos!`);
      navigate("/treinos");
    } catch (e) {
      toast.erro((e as Error).message);
    } finally {
      setImportando(false);
    }
  };

  return (
    <div className="treino-publico-container">
      <header className="treino-publico__header">
        <div className="treino-publico__brand">
          <i className="bi bi-lightning-charge-fill" />
          <span>Division</span>
        </div>
        {logado && (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => navigate("/treinos")}
          >
            <i className="bi bi-arrow-left" /> Meus Treinos
          </button>
        )}
      </header>

      <main className="treino-publico__conteudo">
        {carregando ? (
          <ListaSkeleton linhas={4} />
        ) : erro ? (
          <ErroEstado mensagem={erro} onTentar={() => window.location.reload()} />
        ) : treino ? (
          <div className="card treino-publico__card">
            <div className="treino-publico__topo">
              <span className="treino-publico__badge">Treino compartilhado</span>
              <h1 className="treino-publico__titulo">{treino.nome}</h1>
              {treino.autor && (
                <p className="treino-publico__autor">
                  Criado por <strong>{treino.autor.first_name || treino.autor.username}</strong>
                  {treino.autor.username && (
                    <span className="treino-publico__username">@{treino.autor.username}</span>
                  )}
                </p>
              )}

              {Array.isArray(treino.dias_semana) && treino.dias_semana.length > 0 && (
                <div className="treino-publico__dias">
                  <span className="treino-publico__dias-rotulo">
                    <i className="bi bi-calendar3" /> Dias sugeridos:
                  </span>
                  <div className="dias-chips">
                    {treino.dias_semana.map((d) => (
                      <span key={d} className="dias-chips__item">
                        {DIAS_NOMES[d]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="treino-publico__exercicios-secao">
              <div className="treino-publico__exercicios-header">
                <h2>Exercícios planejados</h2>
                <span className="selo">{treino.itens.length} no total</span>
              </div>

              <ul className="treino-publico__lista">
                {treino.itens.map((item, idx) => (
                  <li key={idx} className="treino-publico__item">
                    <div className="treino-publico__item-ordem">{idx + 1}</div>
                    <div className="treino-publico__item-info">
                      <strong>{item.nome}</strong>
                      <div className="treino-publico__item-detalhes">
                        <span>{item.series} {item.series === 1 ? "série" : "séries"}</span>
                        <span>·</span>
                        <span>{item.repeticoes} reps</span>
                        {item.carga !== null && item.carga !== undefined && item.carga > 0 && (
                          <>
                            <span>·</span>
                            <span>{item.carga} kg</span>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="treino-publico__acao-box">
              {logado ? (
                <button
                  type="button"
                  className="btn btn--primary btn--lg btn--block btn--icon-text"
                  onClick={importar}
                  disabled={importando}
                >
                  <i className="bi bi-download" />
                  {importando ? "Importando…" : "Importar para Meus Treinos"}
                </button>
              ) : (
                <div className="treino-publico__convite-login">
                  <p>
                    Quer salvar este treino e registrar seu histórico com cargas e recordes?
                  </p>
                  <button
                    type="button"
                    className="btn btn--primary btn--lg btn--block btn--icon-text"
                    onClick={importar}
                  >
                    <i className="bi bi-box-arrow-in-right" />
                    Entrar no Division para Importar
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
