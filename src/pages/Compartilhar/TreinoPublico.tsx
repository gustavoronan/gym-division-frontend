import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GifExercicio from "../../components/GifExercicio/GifExercicio";
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

  const autorNome = treino?.autor
    ? treino.autor.first_name?.trim() || treino.autor.username?.trim()
    : null;
  const autorTexto = autorNome || "um amigo";

  return (
    <div className="treino-publico-container">
      <header className="treino-publico__header">
        <div className="treino-publico__brand">
          <i className="bi bi-lightning-charge-fill" />
          <span>Division</span>
        </div>
        {logado ? (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => navigate("/treinos")}
          >
            <i className="bi bi-arrow-left" /> Meus Treinos
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--secondary btn--sm btn--icon-text"
            onClick={importar}
          >
            <i className="bi bi-person-fill" /> Entrar / Criar Conta
          </button>
        )}
      </header>

      <main className="treino-publico__conteudo">
        {carregando ? (
          <ListaSkeleton linhas={4} />
        ) : erro ? (
          <ErroEstado mensagem={erro} onTentar={() => window.location.reload()} />
        ) : treino ? (
          <>
            {/* Chamada Chamativa / Máquina de Conversão para novos usuários */}
            {!logado && (
              <section className="treino-publico__hero-conversao">
                <div className="treino-publico__hero-badge">
                  <i className="bi bi-gift-fill" /> CONVITE DE TREINO
                </div>

                <h1 className="treino-publico__hero-titulo">
                  Você recebeu o treino de{" "}
                  <span className="treino-publico__hero-autor">{autorTexto}</span>!
                </h1>

                <p className="treino-publico__hero-subtitulo">
                  Crie sua conta grátis em <strong>15 segundos</strong> para salvar esse treino e acompanhar suas cargas.
                </p>

                <div className="treino-publico__beneficios-chips">
                  <span className="treino-publico__beneficio-chip">
                    <i className="bi bi-graph-up-arrow" /> Sobrecarga Progressiva
                  </span>
                  <span className="treino-publico__beneficio-chip">
                    <i className="bi bi-play-circle-fill" /> GIFs de Execução
                  </span>
                  <span className="treino-publico__beneficio-chip">
                    <i className="bi bi-trophy-fill" /> Conquistas & Medalhas
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn--primary btn--lg btn--block btn--icon-text treino-publico__hero-btn"
                  onClick={importar}
                >
                  <i className="bi bi-lightning-charge-fill" />
                  Salvar Treino Grátis no Division
                </button>
              </section>
            )}

            {/* Aviso amigável para usuário já autenticado */}
            {logado && (
              <section className="treino-publico__hero-logado">
                <div className="treino-publico__hero-logado-texto">
                  <span className="treino-publico__hero-logado-badge">
                    <i className="bi bi-check-circle-fill" /> Treino Compartilhado
                  </span>
                  <p>
                    Treino compartilhado por <strong>{autorTexto}</strong>. Clique abaixo para salvar na sua conta.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn--primary btn--icon-text"
                  onClick={importar}
                  disabled={importando}
                >
                  <i className="bi bi-download" />
                  {importando ? "Importando…" : "Importar Agora"}
                </button>
              </section>
            )}

            {/* Card com Detalhes e Lista de Exercícios do Treino */}
            <div className="card treino-publico__card">
              <div className="treino-publico__topo">
                <span className="treino-publico__badge">Ficha Completa</span>
                <h2 className="treino-publico__titulo">{treino.nome}</h2>
                {treino.autor && (
                  <p className="treino-publico__autor">
                    Montado por <strong>{autorTexto}</strong>
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
                  <h3>Exercícios planejados</h3>
                  <span className="selo">{treino.itens.length} no total</span>
                </div>

                <ul className="treino-publico__lista">
                  {treino.itens.map((item, idx) => (
                    <li key={idx} className="treino-publico__item">
                      <div className="treino-publico__item-ordem">{idx + 1}</div>

                      {item.exercicio_ref && (
                        <div className="treino-publico__item-gif">
                          <GifExercicio exercicioRef={item.exercicio_ref} nome={item.nome} />
                        </div>
                      )}

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
                    <div className="treino-publico__convite-icon">
                      <i className="bi bi-lightning-charge-fill" />
                    </div>
                    <h3>Pronto para começar esse treino?</h3>
                    <p>
                      Crie sua conta em 15 segundos para salvar esse treino na sua rotina e nunca mais esquecer as cargas que você pegou!
                    </p>
                    <button
                      type="button"
                      className="btn btn--primary btn--lg btn--block btn--icon-text"
                      onClick={importar}
                    >
                      <i className="bi bi-box-arrow-in-right" />
                      Criar Conta Grátis em 15s & Importar
                    </button>
                    <span className="treino-publico__convite-sub">
                      Sem cartão de crédito · 100% gratuito
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
