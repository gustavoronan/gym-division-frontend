import { Link, useLocation } from "react-router-dom";

export default function BottomNav() {
  const location = useLocation();

  const getCorAtiva = (caminho: string) => {
    return location.pathname === caminho ? "text-primary" : "text-secondary";
  };

  return (
    <nav
      className="navbar fixed-bottom bg-dark border-top border-secondary pb-2 pt-2"
      style={{ maxWidth: "480px", margin: "0 auto" }}
    >
      <div className="container-fluid d-flex justify-content-around">
        <Link
          to="/"
          className={`text-decoration-none text-center ${getCorAtiva("/")}`}
        >
          <i className="bi bi-house-door-fill fs-4"></i>
          <div style={{ fontSize: "0.75rem" }}>Início</div>
        </Link>

        <Link
          to="/sessao"
          className={`text-decoration-none text-center ${getCorAtiva("/sessao")}`}
        >
          <i className="bi bi-play-circle-fill fs-4"></i>
          <div style={{ fontSize: "0.75rem" }}>Treinar</div>
        </Link>
      </div>
    </nav>
  );
}
