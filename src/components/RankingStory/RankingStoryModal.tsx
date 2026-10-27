import { toPng } from "html-to-image";
import { useRef, useState } from "react";
import Modal from "../Modal/Modal";
import { useToast } from "../Toast/toastContext";
import type { RankingSemanal } from "../../types/social";

interface Props {
  dados: RankingSemanal;
  criterio: "dias" | "volume";
  aberto: boolean;
  onFechar: () => void;
}

function formatarDataCurta(iso: string) {
  try {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
  } catch {
    return iso;
  }
}

export default function RankingStoryModal({ dados, criterio, aberto, onFechar }: Props) {
  const toast = useToast();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [exportando, setExportando] = useState(false);

  if (!aberto) return null;

  const itemVoce = dados.ranking.find((item) => item.e_voce);
  const top3 = dados.ranking.slice(0, 3);
  const periodoStr = `${formatarDataCurta(dados.inicio_semana)} a ${formatarDataCurta(dados.fim_semana)}`.toUpperCase();

  const criterioLabel = criterio === "dias" ? "MAIS DIAS DE TREINO" : "MAIOR VOLUME (KG)";
  const nomeArquivo = `ranking-division-${dados.inicio_semana}.png`;

  const baixarImagem = async () => {
    if (!cardRef.current) return;
    setExportando(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2, // 2x para alta definição no Instagram
      });
      const link = document.createElement("a");
      link.download = nomeArquivo;
      link.href = dataUrl;
      link.click();
      toast.sucesso("Imagem do Story baixada com sucesso!");
    } catch {
      toast.erro("Erro ao gerar imagem. Tente novamente.");
    } finally {
      setExportando(false);
    }
  };

  const compartilhar = async () => {
    if (!cardRef.current) return;
    setExportando(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], nomeArquivo, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Ranking Semanal no Division`,
          text: `Confira o Ranking Semanal da nossa galera no Division! #DivisionApp`,
        });
        toast.sucesso("Compartilhado com sucesso!");
      } else {
        const link = document.createElement("a");
        link.download = nomeArquivo;
        link.href = dataUrl;
        link.click();
        await copiarLegenda();
        toast.sucesso("Imagem baixada e legenda copiada para o Instagram Stories!");
      }
    } catch {
      toast.erro("Não foi possível compartilhar automaticamente.");
    } finally {
      setExportando(false);
    }
  };

  const copiarLegenda = async () => {
    const lider = dados.ranking[0];
    const texto = [
      `Ranking Semanal no Division (${dados.inicio_semana} a ${dados.fim_semana}):`,
      itemVoce ? `• Minha posição: #${itemVoce.posicao} lugar` : "",
      lider ? `• Líder da semana: @${lider.usuario.username} (${criterio === "dias" ? `${lider.dias_treinados} dias` : `${lider.volume_total.toLocaleString("pt-BR")} kg`})` : "",
      `#Division #RankingSemanal #Fitness #Treino #Gym`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(texto);
      toast.sucesso("Legenda copiada para a área de transferência!");
    } catch {
      /* fallback silencioso */
    }
  };

  return (
    <Modal titulo="Compartilhar Ranking no Story" onFechar={onFechar} centralizado>
      <div className="resumo-mes-modal">
        {/* Preview do Story (9:16) */}
        <div className="resumo-story-moldura">
          <div ref={cardRef} className="resumo-story-card ranking-story-card">
            {/* Header do Story */}
            <header className="resumo-story__header">
              <div className="resumo-story__marca">
                <i className="bi bi-lightning-charge-fill" />
                <span>DIVISION</span>
              </div>
              <span className="resumo-story__tag">RANKING SEMANAL</span>
            </header>

            {/* Período e Critério */}
            <div className="resumo-story__periodo-box">
              <span className="resumo-story__mes">SEMANA {periodoStr}</span>
              <div className="ranking-story__criterio-badge">
                <i className={criterio === "dias" ? "bi bi-calendar-check" : "bi bi-bar-chart-fill"} />
                <span>{criterioLabel}</span>
              </div>
            </div>

            {/* Pódio / Top 3 */}
            <div className="ranking-story__podio">
              {top3.map((item) => {
                const nomeExibicao = item.usuario.first_name || item.usuario.username;

                return (
                  <div
                    key={item.usuario.id}
                    className={`ranking-story__podio-item ${
                      item.posicao === 1 ? "ranking-story__podio-item--lider" : ""
                    } ${item.e_voce ? "ranking-story__podio-item--voce" : ""}`}
                  >
                    <span className="ranking-story__podio-medalha">
                      {item.posicao === 1 ? (
                        <i className="bi bi-trophy-fill" style={{ color: "#facc15" }} />
                      ) : item.posicao === 2 ? (
                        <i className="bi bi-award-fill" style={{ color: "#cbd5e1" }} />
                      ) : (
                        <i className="bi bi-award-fill" style={{ color: "#d97706" }} />
                      )}
                    </span>
                    <div className="ranking-story__podio-info">
                      <strong className="ranking-story__podio-nome">
                        {nomeExibicao} {item.e_voce && <span className="ranking-story__voce-tag">VOCÊ</span>}
                      </strong>
                      <span className="ranking-story__podio-valor">
                        {criterio === "dias"
                          ? `${item.dias_treinados} ${item.dias_treinados === 1 ? "dia" : "dias"}`
                          : `${item.volume_total.toLocaleString("pt-BR")} kg`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Destaque da Sua Posição (se o usuário estiver no ranking) */}
            {itemVoce && (
              <div className="ranking-story__voce-box">
                <div className="ranking-story__voce-icone">
                  {itemVoce.posicao === 1 ? (
                    <i className="bi bi-trophy-fill" style={{ color: "#facc15" }} />
                  ) : itemVoce.posicao <= 3 ? (
                    <i className="bi bi-lightning-charge-fill" style={{ color: "var(--accent)" }} />
                  ) : (
                    <i className="bi bi-bullseye" style={{ color: "#38bdf8" }} />
                  )}
                </div>
                <div className="ranking-story__voce-conteudo">
                  <span className="ranking-story__voce-sub">SUA POSIÇÃO</span>
                  <strong className="ranking-story__voce-titulo">
                    #{itemVoce.posicao} · {itemVoce.posicao === 1 ? "Líder da Semana!" : itemVoce.posicao <= 3 ? "No Pódio!" : "No Ranking!"}
                  </strong>
                  <span className="ranking-story__voce-detalhe">
                    {criterio === "dias"
                      ? `${itemVoce.dias_treinados} ${itemVoce.dias_treinados === 1 ? "dia treinado" : "dias treinados"}`
                      : `${itemVoce.volume_total.toLocaleString("pt-BR")} kg levantados`}
                  </span>
                </div>
              </div>
            )}

            {/* Footer do Story com Marca Prominente */}
            <footer className="resumo-story__footer">
              <div className="resumo-story__footer-marca">
                <span className="resumo-story__footer-badge">
                  <i className="bi bi-lightning-charge-fill" /> division.app.br
                </span>
                <span className="resumo-story__footer-slogan">App de Treino & Evolução</span>
              </div>
            </footer>
          </div>
        </div>

        {/* Ações de Compartilhamento */}
        <div className="resumo-mes-acoes">
          <button
            type="button"
            className="btn btn--primary btn--icon-text"
            onClick={compartilhar}
            disabled={exportando}
          >
            <i className="bi bi-instagram" />
            {exportando ? "Gerando…" : "Compartilhar Story"}
          </button>

          <button
            type="button"
            className="btn btn--secondary btn--icon-text"
            onClick={baixarImagem}
            disabled={exportando}
          >
            <i className="bi bi-download" /> Baixar Imagem
          </button>

          <button
            type="button"
            className="btn btn--ghost btn--icon-text"
            onClick={copiarLegenda}
          >
            <i className="bi bi-clipboard" /> Copiar Legenda
          </button>
        </div>
      </div>
    </Modal>
  );
}
