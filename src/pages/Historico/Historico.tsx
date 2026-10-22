import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../components/Auth/authContext";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import ConquistasModal from "../../components/Conquistas/ConquistasModal";
import ResumoMesModal from "../../components/ResumoMes/ResumoMesModal";
import StoryImediatoModal, {
  type StoryImediatoDados,
} from "../../components/StoryImediato/StoryImediatoModal";
import {
  ErroEstado,
  ListaSkeleton,
  VazioEstado,
} from "../../components/States/States";
import { useToast } from "../../components/Toast/toastContext";
import { sessoesApi } from "../../services/api";
import type { EstatisticasHistorico, SessaoTreino } from "../../types/exercicio";

function formatarDataExtensa(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diffDias = Math.round((hoje.getTime() - data.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDias === 0) return "Hoje";
  if (diffDias === 1) return "Ontem";

  return data.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function Historico() {
  const toast = useToast();
  const [sessoes, setSessoes] = useState<SessaoTreino[]>([]);
  const [stats, setStats] = useState<EstatisticasHistorico | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [expandidoId, setExpandidoId] = useState<number | null>(null);
  const [removendo, setRemovendo] = useState<SessaoTreino | null>(null);
  const { usuario } = useAuth();
  const [modalConquistas, setModalConquistas] = useState(false);
  const [modalResumoStory, setModalResumoStory] = useState(false);
  const [modoStory, setModoStory] = useState<"semana" | "mes">("semana");
  const [storySessao, setStorySessao] = useState<StoryImediatoDados | null>(null);

  const abrirStoryDaSessao = (sessao: SessaoTreino) => {
    let volumeTotal = 0;
    let totalSeries = 0;
    const destaques: Array<{ nome: string; series: number; cargaMax: number | null }> = [];

    sessao.exercicios.forEach((ex) => {
      let seriesFeitas = 0;
      let cargaMax: number | null = null;
      if (ex.series && ex.series.length > 0) {
        ex.series.forEach((s) => {
          if (s.concluida) {
            seriesFeitas++;
            totalSeries++;
            const c = Number(s.carga) || 0;
            const r = Number(s.repeticoes) || 0;
            volumeTotal += c * r;
            if (c > (cargaMax ?? 0)) {
              cargaMax = c;
            }
          }
        });
      } else {
        seriesFeitas = ex.series_planejadas;
        totalSeries += ex.series_planejadas;
        const c = Number(ex.carga) || 0;
        cargaMax = c;
        volumeTotal += c * 10 * ex.series_planejadas;
      }

      if (seriesFeitas > 0) {
        destaques.push({
          nome: ex.nome,
          series: seriesFeitas,
          cargaMax,
        });
      }
    });

    setStorySessao({
      nomeTreino: sessao.nome,
      duracaoMin: sessao.duracao_min || 45,
      volumeTotalKg: Math.round(volumeTotal),
      totalSeries: totalSeries || sessao.total_exercicios * 3,
      totalExercicios: sessao.total_exercicios,
      exerciciosDestaque: destaques,
      dataTreino: sessao.data,
      nomeUsuario: usuario.first_name,
      username: usuario.username,
    });
  };

  useEffect(() => {
    let ativo = true;
    Promise.all([sessoesApi.listar(), sessoesApi.estatisticas()])
      .then(([lista, estatisticas]) => {
        if (!ativo) return;
        setSessoes(lista);
        setStats(estatisticas);
      })
      .catch((e: Error) => {
        if (!ativo) return;
        setErro(e.message);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  const recarregar = () => {
    setCarregando(true);
    setErro(null);
    setTentativa((t) => t + 1);
  };

  const confirmarExclusao = async () => {
    if (!removendo) return;
    try {
      await sessoesApi.excluir(removendo.id);
      toast.sucesso("Treino removido do histórico.");
      setSessoes((lista) => lista.filter((s) => s.id !== removendo.id));
      setRemovendo(null);
      // Atualiza estatísticas em background
      sessoesApi.estatisticas().then(setStats).catch(() => {});
    } catch (e) {
      toast.erro((e as Error).message);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Histórico & Progresso</h1>
          <p>Seus treinos concluídos e recordes</p>
        </div>
        <Link to="/sessao" className="btn btn--primary btn--sm">
          <i className="bi bi-lightning-charge-fill" /> Treinar
        </Link>
      </header>

      {/* Cards de Métricas e Streak */}
      {stats && (
        <section className="historico-metricas">
          <div className="card metrica-card metrica-card--streak">
            <span className="metrica-card__icone metrica-card__icone--streak">
              <i className="bi bi-fire" />
            </span>
            <div className="metrica-card__info">
              <strong>{stats.streak_atual} {stats.streak_atual === 1 ? "dia" : "dias"}</strong>
              <span>Sequência ativa</span>
            </div>
          </div>

          <div className="card metrica-card">
            <span className="metrica-card__icone metrica-card__icone--treinos">
              <i className="bi bi-activity" />
            </span>
            <div className="metrica-card__info">
              <strong>{stats.total_sessoes}</strong>
              <span>Total de treinos</span>
            </div>
          </div>
        </section>
      )}

      {/* Botões de Ação Rápida: Conquistas, Resumo da Semana & Resumo do Mês */}
      <section className="historico-atalhos-grid">
        <button
          type="button"
          className="card atalho-historico-btn"
          onClick={() => setModalConquistas(true)}
        >
          <span className="atalho-historico-btn__icone atalho-historico-btn__icone--conquistas">
            <i className="bi bi-trophy-fill" />
          </span>
          <div className="atalho-historico-btn__info">
            <strong>Conquistas & Medalhas</strong>
            <span>Ver suas medalhas e marcos</span>
          </div>
          <i className="bi bi-chevron-right" />
        </button>

        <button
          type="button"
          className="card atalho-historico-btn"
          onClick={() => {
            setModoStory("semana");
            setModalResumoStory(true);
          }}
        >
          <span className="atalho-historico-btn__icone atalho-historico-btn__icone--semana">
            <i className="bi bi-calendar-week-fill" />
          </span>
          <div className="atalho-historico-btn__info">
            <strong>Resumo da Semana</strong>
            <span>Card para Instagram Stories</span>
          </div>
          <i className="bi bi-chevron-right" />
        </button>

        <button
          type="button"
          className="card atalho-historico-btn"
          onClick={() => {
            setModoStory("mes");
            setModalResumoStory(true);
          }}
        >
          <span className="atalho-historico-btn__icone atalho-historico-btn__icone--mes">
            <i className="bi bi-calendar-month-fill" />
          </span>
          <div className="atalho-historico-btn__info">
            <strong>Resumo do Mês</strong>
            <span>Card para Instagram Stories</span>
          </div>
          <i className="bi bi-chevron-right" />
        </button>
      </section>

      {/* Recordes Pessoais (PRs) */}
      {stats && stats.recordes_pessoais.length > 0 && (
        <section className="secao">
          <h2>
            <i className="bi bi-trophy-fill" style={{ color: "var(--accent)", marginRight: 6 }} />
            Recordes de Carga (PRs)
          </h2>
          <div className="recordes-grid">
            {stats.recordes_pessoais.map((pr) => (
              <div key={pr.chave} className="card recorde-item">
                <span className="recorde-item__nome">{pr.nome}</span>
                <strong className="recorde-item__carga">{pr.max_carga} kg</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lista de Sessões Anteriores */}
      <section className="secao">
        <h2>Treinos realizados</h2>

        {carregando ? (
          <ListaSkeleton linhas={4} />
        ) : erro ? (
          <ErroEstado mensagem={erro} onTentar={recarregar} />
        ) : sessoes.length === 0 ? (
          <VazioEstado
            icone="bi-clock-history"
            titulo="Nenhum treino no histórico"
            texto="Conclua uma sessão de treino para registrar seu histórico e começar sua sequência."
          >
            <Link to="/sessao" className="btn btn--primary">
              <i className="bi bi-play-fill" /> Iniciar treino de hoje
            </Link>
          </VazioEstado>
        ) : (
          <ul className="lista">
            {sessoes.map((sessao) => {
              const aberta = expandidoId === sessao.id;
              return (
                <li key={sessao.id} className="card sessao-historico">
                  <div
                    className="sessao-historico__topo"
                    onClick={() => setExpandidoId(aberta ? null : sessao.id)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={aberta}
                  >
                    <div className="sessao-historico__icone">
                      <i className="bi bi-check2-circle" />
                    </div>
                    <div className="sessao-historico__info">
                      <div className="sessao-historico__linha">
                        <strong>{sessao.nome}</strong>
                        <span className="sessao-historico__data">
                          {formatarDataExtensa(sessao.data)}
                        </span>
                      </div>
                      <div className="sessao-historico__resumo">
                        <span>
                          <i className="bi bi-check-lg" /> {sessao.total_concluidos} de{" "}
                          {sessao.total_exercicios} exercícios
                        </span>
                        {sessao.duracao_min ? (
                          <span>
                            <i className="bi bi-stopwatch" /> {sessao.duracao_min} min
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="sessao-historico__seta">
                      <i className={`bi ${aberta ? "bi-chevron-up" : "bi-chevron-down"}`} />
                    </div>
                  </div>

                  {aberta && (
                    <div className="sessao-historico__detalhes">
                      <ul className="sessao-historico__exercicios">
                        {sessao.exercicios.map((ex) => (
                          <li key={ex.id ?? ex.nome} className="sessao-historico__ex-item">
                            <div className="sessao-historico__ex-nome">
                              <span>{ex.nome}</span>
                              {ex.carga ? <em>{ex.carga} kg sugerido</em> : null}
                            </div>
                            {ex.series && ex.series.length > 0 && (
                              <div className="sessao-historico__series-tags">
                                {ex.series.map((s, idx) => (
                                  <span key={idx} className="serie-tag">
                                    S{s.numero}: {s.carga ? `${s.carga}kg` : "peso livre"}
                                    {s.repeticoes ? ` × ${s.repeticoes}` : ""}
                                  </span>
                                ))}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>

                      <div className="sessao-historico__acoes">
                        {usuario.is_staff ? (
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            onClick={() => abrirStoryDaSessao(sessao)}
                          >
                            <i className="bi bi-instagram" /> Story 9:16
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            style={{ opacity: 0.6 }}
                            onClick={() =>
                              toast.info(
                                "Geração de Story 9:16 pós-treino exclusiva para administradores nesta fase de testes.",
                              )
                            }
                            title="Recurso exclusivo para administradores"
                          >
                            <i className="bi bi-lock-fill" /> Story 9:16
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          style={{ color: "var(--danger)" }}
                          onClick={() => setRemovendo(sessao)}
                        >
                          <i className="bi bi-trash3" /> Excluir do histórico
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {removendo && (
        <ConfirmDialog
          titulo="Excluir treino do histórico"
          mensagem={`Deseja apagar o registro do treino "${removendo.nome}" de ${formatarDataExtensa(removendo.data)}?`}
          textoConfirmar="Excluir registro"
          onConfirmar={confirmarExclusao}
          onCancelar={() => setRemovendo(null)}
        />
      )}

      {modalConquistas && (
        <ConquistasModal
          aberto={modalConquistas}
          onFechar={() => setModalConquistas(false)}
        />
      )}

      {modalResumoStory && (
        <ResumoMesModal
          aberto={modalResumoStory}
          modoInicial={modoStory}
          onFechar={() => setModalResumoStory(false)}
        />
      )}

      {storySessao && (
        <StoryImediatoModal
          aberto={Boolean(storySessao)}
          dados={storySessao}
          onFechar={() => setStorySessao(null)}
        />
      )}
    </>
  );
}
