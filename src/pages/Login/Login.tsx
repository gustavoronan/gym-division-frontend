import { useState, type FormEvent } from "react";
import { authApi } from "../../services/api";
import type { Usuario } from "../../types/usuario";

interface Props {
  onEntrar: (token: string, usuario: Usuario) => void;
}

export default function Login({ onEntrar }: Props) {
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const { token, usuario } = criando
        ? await authApi.registrar({
            username: username.trim(),
            first_name: nome.trim(),
            password,
          })
        : await authApi.login(username.trim(), password);
      onEntrar(token, usuario);
    } catch (err) {
      setErro((err as Error).message);
      setEnviando(false);
    }
  };

  return (
    <div className="login">
      <form className="card login__card form" onSubmit={enviar}>
        <div className="login__marca">
          <i className="bi bi-lightning-charge-fill" />
          <h1>Division</h1>
          <p>{criando ? "Crie sua conta grátis" : "Entre para acessar seus treinos"}</p>
        </div>

        {criando && (
          <label className="field">
            <span>Nome (opcional)</span>
            <input value={nome} maxLength={150} onChange={(e) => setNome(e.target.value)} />
          </label>
        )}

        <label className="field">
          <span>Usuário</span>
          <input
            autoFocus
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Senha</span>
          <input
            type="password"
            autoComplete={criando ? "new-password" : "current-password"}
            placeholder={criando ? "Mínimo 6 caracteres" : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {erro && (
          <p className="login__erro" role="alert">
            {erro}
          </p>
        )}

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={!username.trim() || !password || (criando && password.length < 6) || enviando}
        >
          {enviando
            ? criando
              ? "Criando…"
              : "Entrando…"
            : criando
              ? "Criar conta"
              : "Entrar"}
        </button>

        <button
          type="button"
          className="btn btn--ghost btn--block"
          onClick={() => {
            setCriando((c) => !c);
            setErro(null);
          }}
        >
          {criando ? "Já tenho conta" : "Criar conta"}
        </button>
      </form>
    </div>
  );
}
