import { NavLink } from "react-router-dom";
import { useAuth } from "../Auth/authContext";

const ITENS = [
  { to: "/", rotulo: "Exercícios", icone: "bi-list-check" },
  { to: "/treinos", rotulo: "Treinos", icone: "bi-collection-fill" },
  { to: "/amigos", rotulo: "Amigos", icone: "bi-person-heart" },
  { to: "/sessao", rotulo: "Treinar", icone: "bi-lightning-charge-fill" },
  { to: "/perfil", rotulo: "Perfil", icone: "bi-person-circle" },
];

const ITEM_ADMIN = { to: "/usuarios", rotulo: "Usuários", icone: "bi-people-fill" };

export default function BottomNav() {
  const { usuario } = useAuth();
  const itens = usuario.is_staff ? [...ITENS, ITEM_ADMIN] : ITENS;

  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {itens.map(({ to, rotulo, icone }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? "bottom-nav__item--ativo" : ""}`
          }
        >
          <i className={`bi ${icone}`} />
          <span>{rotulo}</span>
        </NavLink>
      ))}
    </nav>
  );
}
