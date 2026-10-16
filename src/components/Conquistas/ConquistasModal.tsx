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
                Treinos 🏋️
              </button>
              <button
                type="button"
                className={`conquista-filtro-btn ${filtro === "streak" ? "conquista-filtro-btn--ativo" : ""}`}
                onClick={() => setFiltro("streak")}
              >
                Sequência 🔥
              </button>
              <button
                type="button"
                className={`conquista-filtro-btn ${filtro === "carga" ? "conquista-filtro-btn--ativo" : ""}`}
                onClick={() => setFiltro("carga")}
              >
                Cargas ⚡
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
                    <span className="conquista-card__icone">{item.icone}</span>
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
