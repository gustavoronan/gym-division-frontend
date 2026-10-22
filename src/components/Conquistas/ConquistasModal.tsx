import { useEffect, useState } from "react";
import Modal from "../Modal/Modal";
import { ErroEstado, ListaSkeleton } from "../States/States";
import { conquistasApi } from "../../services/api";
import type { ConquistaItem, ConquistasResponse } from "../../types/exercicio";

interface ConquistasModalProps {
  aberto: boolean;
  onFechar: () => void;
}

type CategoriaFiltro = "todas" | "treinos" | "streak" | "carga" | "volume" | "social";

const ICONE_CONQUISTA_MAP: Record<string, { icon: string; cor: string }> = {
  primeiro_treino: { icon: "bi-award-fill", cor: "#f59e0b" },
  treinos_10: { icon: "bi-bullseye", cor: "#38bdf8" },
  treinos_25: { icon: "bi-shield-shaded", cor: "#34d399" },
  treinos_50: { icon: "bi-trophy-fill", cor: "#facc15" },
  treinos_100: { icon: "bi-crown-fill", cor: "#e879f9" },
  streak_3: { icon: "bi-fire", cor: "#ff7828" },
  streak_7: { icon: "bi-lightning-charge-fill", cor: "#c4ff3d" },
  streak_30: { icon: "bi-gem", cor: "#a855f7" },
  primeiro_recorde: { icon: "bi-rocket-takeoff-fill", cor: "#c4ff3d" },
  clube_100kg: { icon: "bi-speedometer2", cor: "#ef4444" },
  volume_10ton: { icon: "bi-truck", cor: "#38bdf8" },
  amizade_social: { icon: "bi-people-fill", cor: "#06b6d4" },
};

function renderIconeConquista(item: ConquistaItem) {
  const conf = ICONE_CONQUISTA_MAP[item.id];
  const classeIcone = item.icone && item.icone.startsWith("bi-")
    ? item.icone
    : conf?.icon || "bi-award-fill";
  const corIcone = item.desbloqueada ? (conf?.cor || "var(--accent)") : "var(--muted)";

  return <i className={`bi ${classeIcone}`} style={{ color: corIcone }} />;
}

export default function ConquistasModal({ aberto, onFechar }: ConquistasModalProps) {
  const [dados, setDados] = useState<ConquistasResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<CategoriaFiltro>("todas");
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!aberto) return;
    let ativo = true;
    conquistasApi
      .listar()
      .then((res) => {
        if (!ativo) return;
        setDados(res);
      })
      .catch((e: Error) => {
        if (!ativo) return;
        setErro(e.message || "Erro ao carregar conquistas.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [aberto, tentativa]);

  if (!aberto) return null;

  const recarregar = () => {
    setCarregando(true);
    setErro(null);
    setTentativa((t) => t + 1);
  };

  const listaFiltrada = dados
    ? dados.conquistas.filter((c: ConquistaItem) => filtro === "todas" || c.categoria === filtro)
    : [];

  return (
    <Modal titulo="Conquistas & Medalhas" onFechar={onFechar} centralizado>
      <div className="conquistas-modal">
        {carregando ? (
          <ListaSkeleton linhas={4} />
        ) : erro ? (
          <ErroEstado mensagem={erro} onTentar={recarregar} />
        ) : dados ? (
          <>
            {/* Cabeçalho de Progresso Geral */}
            <div className="conquistas-resumo">
              <div className="conquistas-resumo__topo">
                <div>
                  <strong className="conquistas-resumo__contador">
                    {dados.desbloqueadas} de {dados.total_conquistas}
                  </strong>
                  <span className="conquistas-resumo__rotulo">medalhas conquistadas</span>
                </div>
                <span className="conquistas-resumo__porcentagem">{dados.percentual_geral}%</span>
              </div>
              <div className="barra-progresso">
                <div
                  className="barra-progresso__preenchimento"
                  style={{ width: `${dados.percentual_geral}%` }}
                />
              </div>
            </div>

            {/* Filtros por Categoria */}
            <div className="conquistas-filtros">
              <button
                type="button"
                className={`conquista-filtro-btn ${filtro === "todas" ? "conquista-filtro-btn--ativo" : ""}`}
                onClick={() => setFiltro("todas")}
              >
                Todas
              </button>
              <button
                type="button"
                className={`conquista-filtro-btn ${filtro === "treinos" ? "conquista-filtro-btn--ativo" : ""}`}
                onClick={() => setFiltro("treinos")}
              >
                <i className="bi bi-activity" /> Treinos
              </button>
              <button
                type="button"
                className={`conquista-filtro-btn ${filtro === "streak" ? "conquista-filtro-btn--ativo" : ""}`}
                onClick={() => setFiltro("streak")}
              >
                <i className="bi bi-fire" /> Sequência
              </button>
              <button
                type="button"
                className={`conquista-filtro-btn ${filtro === "carga" ? "conquista-filtro-btn--ativo" : ""}`}
                onClick={() => setFiltro("carga")}
              >
                <i className="bi bi-lightning-charge-fill" /> Cargas
              </button>
            </div>

            {/* Grade de Conquistas */}
            <div className="conquistas-grid">
              {listaFiltrada.map((item) => (
                <div
                  key={item.id}
                  className={`conquista-card ${
                    item.desbloqueada ? "conquista-card--desbloqueada" : "conquista-card--bloqueada"
                  }`}
                >
                  <div className="conquista-card__icone-container">
                    <span className="conquista-card__icone">
                      {renderIconeConquista(item)}
                    </span>
                    {!item.desbloqueada && (
                      <span className="conquista-card__cadeado">
                        <i className="bi bi-lock-fill" />
                      </span>
                    )}
                  </div>

                  <div className="conquista-card__info">
                    <div className="conquista-card__titulo-linha">
                      <strong className="conquista-card__titulo">{item.titulo}</strong>
                      {item.desbloqueada && (
                        <span className="selo selo--sucesso">
                          <i className="bi bi-check-lg" /> Conquistada
                        </span>
                      )}
                    </div>
                    <p className="conquista-card__descricao">{item.descricao}</p>

                    {!item.desbloqueada && (
                      <div className="conquista-card__progresso-box">
                        <div className="conquista-card__progresso-texto">
                          <span>
                            {item.progresso} / {item.meta}
                          </span>
                          <span>{item.percentual}%</span>
                        </div>
                        <div className="mini-barra">
                          <div
                            className="mini-barra__fill"
                            style={{ width: `${item.percentual}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <div className="form__actions" style={{ marginTop: 8 }}>
          <button type="button" className="btn btn--ghost btn--block" onClick={onFechar}>
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}
