import { NavLink } from "react-router-dom";

const ITENS = [
  { to: "/", rotulo: "Exercícios", icone: "bi-list-check" },
  { to: "/treinos", rotulo: "Treinos", icone: "bi-collection-fill" },
  { to: "/sessao", rotulo: "Treinar", icone: "bi-lightning-charge-fill" },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {ITENS.map(({ to, rotulo, icone }) => (
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
