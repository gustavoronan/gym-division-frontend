import { useEffect, useState } from "react";
import { ErroEstado, ListaSkeleton, VazioEstado } from "../../components/States/States";
import { rankingApi } from "../../services/api";
import type { RankingSemanal } from "../../types/social";
import { nomeDe } from "./nomeDe";

function formatarDataCurta(iso: string) {
  try {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString([], { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}

export default function RankingAba() {
  const [criterio, setCriterio] = useState<"dias" | "volume">("dias");
  const [dados, setDados] = useState<RankingSemanal | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  const carregar = () => {
    setCarregando(true);
    setErro(null);
    setTentativa((t) => t + 1);
  };

  useEffect(() => {
    let ativo = true;
    rankingApi
      .semanal(criterio)
      .then((res) => {
        if (!ativo) return;
        setDados(res);
      })
      .catch((e: Error) => {
        if (!ativo) return;
        setErro(e.message || "Erro ao carregar ranking.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [criterio, tentativa]);

  const medalhas: Record<number, string> = {
    1: "🥇",
    2: "🥈",
    3: "🥉",
  };

  return (
    <div className="ranking-container">
      {/* Seletor de Critério */}
      <div className="ranking-seletor">
        <button
          type="button"
          className={`btn btn--sm ${criterio === "dias" ? "btn--primary" : "btn--ghost"}`}
          onClick={() => setCriterio("dias")}
        >
          <i className="bi bi-calendar-check" /> Mais Dias
        </button>
        <button
          type="button"
          className={`btn btn--sm ${criterio === "volume" ? "btn--primary" : "btn--ghost"}`}
          onClick={() => setCriterio("volume")}
        >
          <i className="bi bi-bar-chart-fill" /> Maior Volume (kg)
        </button>
      </div>

      {dados && (
        <div className="ranking-periodo">
          <i className="bi bi-clock-history" />
          <span>
            Semana atual: {formatarDataCurta(dados.inicio_semana)} até {formatarDataCurta(dados.fim_semana)}
          </span>
        </div>
      )}

      {carregando ? (
        <ListaSkeleton linhas={4} />
      ) : erro ? (
        <ErroEstado mensagem={erro} onTentar={carregar} />
      ) : !dados || dados.ranking.length === 0 ? (
        <VazioEstado
          icone="bi-trophy"
          titulo="Nenhum treino registrado nesta semana"
          texto="Conclua uma sessão para inaugurar o ranking semanal com seus amigos!"
        />
      ) : (
        <ul className="ranking-lista">
          {dados.ranking.map((item) => {
            const medalha = medalhas[item.posicao];
            const nome = nomeDe(item.usuario);
            const ehPrimeiro = item.posicao === 1;

            return (
              <li
                key={item.usuario.id}
                className={`card ranking-card ${item.e_voce ? "ranking-card--voce" : ""} ${
                  ehPrimeiro ? "ranking-card--lider" : ""
                }`}
              >
                <div className="ranking-card__posicao">
                  {medalha ? (
                    <span className="ranking-card__medalha">{medalha}</span>
                  ) : (
                    <span className="ranking-card__numero">#{item.posicao}</span>
                  )}
                </div>

                <div className="ranking-card__conteudo">
                  <div className="ranking-card__usuario-linha">
                    <strong className="ranking-card__nome">{nome}</strong>
                    {item.e_voce && <span className="selo selo--sucesso">Você</span>}
                  </div>

                  <div className="ranking-card__metricas">
                    {criterio === "dias" ? (
                      <span className="ranking-card__destaque">
                        <strong>{item.dias_treinados}</strong> {item.dias_treinados === 1 ? "dia" : "dias"} treinados
                      </span>
                    ) : (
                      <span className="ranking-card__destaque">
                        <strong>{item.volume_total.toLocaleString("pt-BR")}</strong> kg levantados
                      </span>
                    )}

                    <div className="ranking-card__detalhes">
                      <span>{item.total_sessoes} {item.total_sessoes === 1 ? "treino" : "treinos"}</span>
                      {item.tempo_total_min > 0 && (
                        <>
                          <span>·</span>
                          <span>{item.tempo_total_min} min totais</span>
                        </>
                      )}
                      {criterio === "dias" && item.volume_total > 0 && (
                        <>
                          <span>·</span>
                          <span>{item.volume_total.toLocaleString("pt-BR")} kg vol.</span>
                        </>
                      )}
                      {criterio === "volume" && (
                        <>
                          <span>·</span>
                          <span>{item.dias_treinados} {item.dias_treinados === 1 ? "dia" : "dias"}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
