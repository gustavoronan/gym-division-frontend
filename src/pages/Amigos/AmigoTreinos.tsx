import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ErroEstado,
  ListaSkeleton,
  VazioEstado,
} from "../../components/States/States";
import { useToast } from "../../components/Toast/toastContext";
import { amigosApi } from "../../services/api";
import type { TreinosDoAmigo } from "../../types/social";
import { nomeDe } from "./nomeDe";

export default function AmigoTreinos() {
  const { id } = useParams();
  const usuarioId = Number(id);
  const toast = useToast();
  const navigate = useNavigate();

  const [dados, setDados] = useState<TreinosDoAmigo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [marcados, setMarcados] = useState<Set<number>>(new Set());
  const [copiando, setCopiando] = useState(false);

  useEffect(() => {
    let ativo = true;
    amigosApi
      .treinos(usuarioId)
      .then((d) => ativo && setDados(d))
      .catch((e: Error) => ativo && setErro(e.message));
    return () => {
      ativo = false;
    };
  }, [usuarioId, tentativa]);

  const alternar = (treinoId: number) =>
    setMarcados((atual) => {
      const novo = new Set(atual);
      if (!novo.delete(treinoId)) novo.add(treinoId);
      return novo;
    });

  const copiar = async (selecao: number[] | "todos") => {
    setCopiando(true);
    try {
      const copias = await amigosApi.copiar(usuarioId, selecao);
      toast.sucesso(
        copias.length === 1
          ? `"${copias[0].nome}" copiado para os seus treinos!`
          : `${copias.length} treinos copiados para os seus treinos!`,
      );
      navigate("/treinos");
    } catch (e) {
      toast.erro((e as Error).message);
      setCopiando(false);
    }
  };

  if (erro) {
    return (
      <>
        <Voltar />
        <ErroEstado
          mensagem={erro}
          onTentar={() => {
            setErro(null);
            setTentativa((t) => t + 1);
          }}
        />
      </>
    );
  }

  if (!dados) {
    return (
      <>
        <Voltar />
        <ListaSkeleton linhas={3} />
      </>
    );
  }

  const { treinos } = dados;
  const todosMarcados = treinos.length > 0 && marcados.size === treinos.length;

  return (
    <>
      <Voltar />
      <header className="page-header">
        <div>
          <h1>Treinos de {nomeDe(dados.usuario)}</h1>
          <p>
            {treinos.length} {treinos.length === 1 ? "treino" : "treinos"}
          </p>
        </div>
        {treinos.length > 1 && (
          <button
            className="btn btn--ghost btn--sm"
            onClick={() =>
              setMarcados(todosMarcados ? new Set() : new Set(treinos.map((t) => t.id)))
            }
          >
            {todosMarcados ? "Limpar" : "Marcar todos"}
          </button>
        )}
      </header>

      {treinos.length === 0 ? (
        <VazioEstado
          icone="bi-collection"
          titulo="Sem treinos por aqui"
          texto={`${nomeDe(dados.usuario)} ainda não salvou nenhum treino.`}
        />
      ) : (
        <ul className="lista lista--com-barra">
          {treinos.map((treino) => {
            const marcado = marcados.has(treino.id);
            return (
              <li
                key={treino.id}
                className={`card treino ${marcado ? "treino--marcado" : ""}`}
              >
                <label className="treino__topo treino__escolha">
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => alternar(treino.id)}
                  />
                  <div className="treino__titulo">
                    <strong>{treino.nome}</strong>
                    <span>
                      {treino.itens.length}{" "}
                      {treino.itens.length === 1 ? "exercício" : "exercícios"}
                    </span>
                  </div>
                </label>
                <ul className="treino__itens">
                  {treino.itens.map((item, i) => (
                    <li key={i}>
                      <span>{item.nome}</span>
                      <em>
                        {item.series} × {item.repeticoes}
                      </em>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}

      {treinos.length > 0 && (
        <div className="barra-acao">
          <button
            className="btn btn--ghost"
            onClick={() => copiar("todos")}
            disabled={copiando}
          >
            <i className="bi bi-files" /> Copiar todos
          </button>
          <button
            className="btn btn--primary"
            onClick={() => copiar([...marcados])}
            disabled={copiando || marcados.size === 0}
          >
            <i className="bi bi-copy" />{" "}
            {marcados.size === 0 ? "Copiar selecionados" : `Copiar ${marcados.size}`}
          </button>
        </div>
      )}
    </>
  );
}

function Voltar() {
  return (
    <Link to="/amigos" className="voltar">
      <i className="bi bi-chevron-left" /> Amigos
    </Link>
  );
}
