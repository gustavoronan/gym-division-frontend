import { useEffect, useState, type FormEvent } from "react";
import Modal from "../../components/Modal/Modal";
import { ErroEstado, ListaSkeleton, VazioEstado } from "../../components/States/States";
import { useToast } from "../../components/Toast/toastContext";
import { desafiosApi } from "../../services/api";
import type { Desafio } from "../../types/social";
import { nomeDe } from "./nomeDe";

export default function DesafiosAba() {
  const toast = useToast();
  const [desafios, setDesafios] = useState<Desafio[] | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [acaoId, setAcaoId] = useState<number | null>(null);

  // Form de novo desafio
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [metaTreinos, setMetaTreinos] = useState(12);
  const [diasDuracao, setDiasDuracao] = useState(30);
  const [icone, setIcone] = useState("🔥");

  const [tentativa, setTentativa] = useState(0);

  const carregar = () => {
    setCarregando(true);
    setErro(null);
    setTentativa((t) => t + 1);
  };

  useEffect(() => {
    let ativo = true;
    desafiosApi
      .listar()
      .then((dados) => {
        if (!ativo) return;
        setDesafios(dados);
      })
      .catch((e: Error) => {
        if (!ativo) return;
        setErro(e.message || "Erro ao carregar desafios.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  const toggleParticipar = async (desafio: Desafio) => {
    setAcaoId(desafio.id);
    try {
      const resp = await desafiosApi.participar(desafio.id, desafio.participando);
      toast.sucesso(resp.mensagem);
      carregar();
    } catch (e) {
      toast.erro((e as Error).message || "Erro ao atualizar participação.");
    } finally {
      setAcaoId(null);
    }
  };

  const salvarNovoDesafio = async (e: FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    try {
      await desafiosApi.criar({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        meta_treinos: Number(metaTreinos),
        dias_duracao: Number(diasDuracao),
        icone,
      });
      toast.sucesso("Desafio criado com sucesso!");
      setCriando(false);
      setTitulo("");
      setDescricao("");
      setMetaTreinos(12);
      setDiasDuracao(30);
      setIcone("🔥");
      carregar();
    } catch (err) {
      toast.erro((err as Error).message || "Erro ao criar desafio.");
    }
  };

  const iconesOpcoes = ["🔥", "🏆", "⚡", "🎯", "💪", "🥊", "🚀"];

  return (
    <div className="desafios-container">
      <div className="desafios-header">
        <p className="desafios-intro">
          Desafie a si mesmo e aos seus amigos a manter a consistência e bater metas de treino.
        </p>
        <button
          type="button"
          className="btn btn--primary btn--sm btn--icon-text"
          onClick={() => setCriando(true)}
        >
          <i className="bi bi-plus-lg" /> Criar Desafio
        </button>
      </div>

      {carregando ? (
        <ListaSkeleton linhas={3} />
      ) : erro ? (
        <ErroEstado mensagem={erro} onTentar={carregar} />
      ) : !desafios || desafios.length === 0 ? (
        <VazioEstado
          icone="bi-flag"
          titulo="Nenhum desafio ativo"
          texto="Crie um desafio para começar a competir com amigos!"
        >
          <button type="button" className="btn btn--primary" onClick={() => setCriando(true)}>
            <i className="bi bi-plus-lg" /> Criar primeiro desafio
          </button>
        </VazioEstado>
      ) : (
        <ul className="desafios-lista">
          {desafios.map((d) => {
            const prog = d.meu_progresso;
            const participando = d.participando && prog;

            return (
              <li key={d.id} className="card desafio-card">
                <header className="desafio-card__topo">
                  <div className="desafio-card__icone-caixa">{d.icone || "🔥"}</div>
                  <div className="desafio-card__info">
                    <h3 className="desafio-card__titulo">{d.titulo}</h3>
                    {d.descricao && <p className="desafio-card__descricao">{d.descricao}</p>}
                    <span className="desafio-card__meta-tag">
                      Meta: {d.meta_treinos} {d.meta_treinos === 1 ? "treino" : "treinos"} em{" "}
                      {d.dias_duracao} dias
                    </span>
                  </div>
                </header>

                {participando && (
                  <div className="desafio-card__meu-progresso">
                    <div className="desafio-card__progresso-cabecalho">
                      <span>
                        Seu progresso:{" "}
                        <strong>
                          {prog.treinos_concluidos} de {prog.meta_treinos} treinos
                        </strong>
                      </span>
                      <strong className="desafio-card__porcentagem">{prog.percentual}%</strong>
                    </div>

                    <div className="barra-progresso">
                      <div
                        className={`barra-progresso__preenchimento ${
                          prog.concluido ? "barra-progresso__preenchimento--completo" : ""
                        }`}
                        style={{ width: `${prog.percentual}%` }}
                      />
                    </div>

                    <div className="desafio-card__progresso-rodape">
                      {prog.concluido ? (
                        <span className="selo selo--sucesso">
                          <i className="bi bi-check-circle-fill" /> Desafio Concluído! Parabéns!
                        </span>
                      ) : (
                        <span className="desafio-card__tempo-restante">
                          <i className="bi bi-hourglass-split" /> {prog.dias_restantes}{" "}
                          {prog.dias_restantes === 1 ? "dia restante" : "dias restantes"}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Participantes */}
                {d.participantes && d.participantes.length > 0 && (
                  <div className="desafio-card__participantes-secao">
                    <span className="desafio-card__participantes-titulo">
                      Participantes ({d.total_participantes})
                    </span>
                    <div className="desafio-participantes-lista">
                      {d.participantes.map((p, idx) => (
                        <div key={idx} className="desafio-participante-item">
                          <div className="desafio-participante-item__nome-linha">
                            <span className="desafio-participante-item__nome">
                              {nomeDe(p.usuario)} {p.e_voce ? "(Você)" : ""}
                            </span>
                            <span className="desafio-participante-item__treinos">
                              {p.treinos_concluidos}/{d.meta_treinos}
                            </span>
                          </div>
                          <div className="mini-barra">
                            <div
                              className={`mini-barra__fill ${
                                p.concluido ? "mini-barra__fill--completo" : ""
                              }`}
                              style={{ width: `${p.percentual}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <footer className="desafio-card__acoes">
                  <button
                    type="button"
                    className={`btn btn--sm ${
                      d.participando ? "btn--ghost" : "btn--primary"
                    } btn--icon-text`}
                    onClick={() => toggleParticipar(d)}
                    disabled={acaoId === d.id}
                  >
                    {d.participando ? (
                      <>
                        <i className="bi bi-box-arrow-left" /> Sair do desafio
                      </>
                    ) : (
                      <>
                        <i className="bi bi-flag-fill" /> Participar do desafio
                      </>
                    )}
                  </button>
                </footer>
              </li>
            );
          })}
        </ul>
      )}

      {/* Modal de criação de desafio */}
      {criando && (
        <Modal titulo="Novo Desafio" onFechar={() => setCriando(false)} centralizado>
          <form onSubmit={salvarNovoDesafio} className="form">
            <label className="label">
              Ícone
              <div className="icones-seletor">
                {iconesOpcoes.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    className={`icone-opcao ${icone === ic ? "icone-opcao--selecionado" : ""}`}
                    onClick={() => setIcone(ic)}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </label>

            <label className="label">
              Título do Desafio
              <input
                type="text"
                className="input"
                required
                maxLength={100}
                placeholder="Ex.: Treinar 12 vezes em 30 dias"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </label>

            <label className="label">
              Descrição (opcional)
              <textarea
                className="input input--textarea"
                rows={2}
                placeholder="Descreva a meta e as regras do desafio…"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </label>

            <div className="form__grid-2">
              <label className="label">
                Meta de treinos
                <input
                  type="number"
                  className="input"
                  min={1}
                  max={100}
                  required
                  value={metaTreinos}
                  onChange={(e) => setMetaTreinos(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </label>

              <label className="label">
                Duração (dias)
                <input
                  type="number"
                  className="input"
                  min={1}
                  max={365}
                  required
                  value={diasDuracao}
                  onChange={(e) => setDiasDuracao(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </label>
            </div>

            <div className="form__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setCriando(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primary">
                Criar Desafio
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
