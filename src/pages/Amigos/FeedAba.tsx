import { useEffect, useState } from "react";
import { ErroEstado, ListaSkeleton, VazioEstado } from "../../components/States/States";
import { useToast } from "../../components/Toast/toastContext";
import { feedApi } from "../../services/api";
import type { FeedItem } from "../../types/social";
import { nomeDe } from "./nomeDe";

function formatarDataHora(iso: string) {
  try {
    const d = new Date(iso);
    const hoje = new Date();
    const ehHoje = d.toDateString() === hoje.toDateString();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    const ehOntem = d.toDateString() === ontem.toDateString();

    const hora = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (ehHoje) return `Hoje às ${hora}`;
    if (ehOntem) return `Ontem às ${hora}`;
    return `${d.toLocaleDateString([], { day: "2-digit", month: "short" })} às ${hora}`;
  } catch {
    return iso;
  }
}

export default function FeedAba({ onIrParaAmigos }: { onIrParaAmigos: () => void }) {
  const toast = useToast();
  const [itens, setItens] = useState<FeedItem[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [tentativa, setTentativa] = useState(0);
  const [reagindoId, setReagindoId] = useState<number | null>(null);

  const carregar = () => {
    setCarregando(true);
    setErro(null);
    setTentativa((t) => t + 1);
  };

  useEffect(() => {
    let ativo = true;
    feedApi
      .listar()
      .then((dados) => {
        if (!ativo) return;
        setItens(dados);
      })
      .catch((e: Error) => {
        if (!ativo) return;
        setErro(e.message || "Erro ao carregar o feed.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  const reagir = async (sessaoId: number, emoji: string) => {
    if (reagindoId === sessaoId) return;

    // Atualização otimista
    setItens((anteriores) => {
      if (!anteriores) return anteriores;
      return anteriores.map((item) => {
        if (item.id !== sessaoId) return item;
        const jaReagiu = item.minhas_reacoes.includes(emoji);
        const contagemAtual = item.reacoes[emoji] || 0;
        const novaContagem = jaReagiu ? Math.max(0, contagemAtual - 1) : contagemAtual + 1;
        const novasMinhas = jaReagiu
          ? item.minhas_reacoes.filter((e) => e !== emoji)
          : [...item.minhas_reacoes, emoji];

        return {
          ...item,
          reacoes: {
            ...item.reacoes,
            [emoji]: novaContagem,
          },
          minhas_reacoes: novasMinhas,
        };
      });
    });

    setReagindoId(sessaoId);
    try {
      const resp = await feedApi.reagir(sessaoId, emoji);
      // Sincroniza com resposta real do backend
      setItens((anteriores) => {
        if (!anteriores) return anteriores;
        return anteriores.map((item) => {
          if (item.id !== sessaoId) return item;
          return {
            ...item,
            reacoes: resp.reacoes,
            minhas_reacoes: resp.minhas_reacoes,
          };
        });
      });
    } catch (e) {
      toast.erro((e as Error).message || "Erro ao reagir.");
      carregar();
    } finally {
      setReagindoId(null);
    }
  };

  if (carregando) return <ListaSkeleton linhas={4} />;
  if (erro) return <ErroEstado mensagem={erro} onTentar={carregar} />;
  if (!itens || itens.length === 0) {
    return (
      <VazioEstado
        icone="bi-activity"
        titulo="Nenhum treino recente"
        texto="Quando você ou seus amigos concluírem treinos, eles aparecerão aqui com duração, exercícios e reações."
      >
        <button type="button" className="btn btn--primary" onClick={onIrParaAmigos}>
          <i className="bi bi-people-fill" /> Ver e adicionar amigos
        </button>
      </VazioEstado>
    );
  }

  const emojis = ["🔥", "💪", "👏"];

  return (
    <div className="feed-container">
      <ul className="feed-lista">
        {itens.map((item) => {
          const nomeUsuario = nomeDe(item.usuario);
          const inicial = (item.usuario.first_name || item.usuario.username || "?")[0].toUpperCase();

          return (
            <li key={item.id} className="card feed-item">
              <header className="feed-item__header">
                <div className="feed-item__avatar" aria-hidden="true">
                  {inicial}
                </div>
                <div className="feed-item__meta">
                  <div className="feed-item__autor-linha">
                    <strong>{nomeUsuario}</strong>
                    {item.e_voce && <span className="selo selo--sucesso">Você</span>}
                  </div>
                  <span className="feed-item__subtitulo">
                    concluiu <strong>{item.nome}</strong>
                    {item.duracao_min ? ` · ${item.duracao_min} min` : ""}
                  </span>
                  <time className="feed-item__tempo">{formatarDataHora(item.criada_em)}</time>
                </div>
              </header>

              {item.exercicios && item.exercicios.length > 0 && (
                <div className="feed-item__exercicios">
                  <div className="feed-item__exercicios-tags">
                    {item.exercicios.map((ex, idx) => (
                      <span key={idx} className="feed-tag">
                        <strong>{ex.nome}</strong>
                        {ex.max_carga !== null && ex.max_carga !== undefined && ex.max_carga > 0 && (
                          <span className="feed-tag__carga">{ex.max_carga} kg</span>
                        )}
                      </span>
                    ))}
                    {item.total_exercicios > item.exercicios.length && (
                      <span className="feed-tag feed-tag--mais">
                        +{item.total_exercicios - item.exercicios.length} exercícios
                      </span>
                    )}
                  </div>
                </div>
              )}

              <footer className="feed-item__reacoes-barra">
                <div className="feed-item__botoes-reacao">
                  {emojis.map((emoji) => {
                    const contagem = item.reacoes[emoji] || 0;
                    const ativo = item.minhas_reacoes.includes(emoji);
                    return (
                      <button
                        key={emoji}
                        type="button"
                        className={`feed-reacao-btn ${ativo ? "feed-reacao-btn--ativo" : ""}`}
                        onClick={() => reagir(item.id, emoji)}
                        title={`Reagir com ${emoji}`}
                        aria-pressed={ativo}
                      >
                        <span className="feed-reacao-btn__emoji">{emoji}</span>
                        {contagem > 0 && (
                          <span className="feed-reacao-btn__contador">{contagem}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {item.reacoes_detalhes && item.reacoes_detalhes.length > 0 && (
                  <span className="feed-item__quem-reagiu">
                    {item.reacoes_detalhes.map((r, i) => (
                      <span key={i} className="feed-item__reacao-badge">
                        {r.emoji} {r.usuario.first_name || r.usuario.username}
                      </span>
                    ))}
                  </span>
                )}
              </footer>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
