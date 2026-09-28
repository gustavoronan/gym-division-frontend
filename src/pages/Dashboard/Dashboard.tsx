import { useState, useEffect } from "react";

interface Exercicio {
  id: number;
  nome: string;
  series: number;
  repeticoes: number;
  concluido: boolean;
  data: string;
}

export default function Dashboard() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [nome, setNome] = useState("");
  const [series, setSeries] = useState("");
  const [repeticoes, setRepeticoes] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/api/exercicios/")
      .then((response) => response.json())
      .then((data) => setExercicios(data))
      .catch((error) => console.error("Erro ao buscar exercícios:", error));
  }, []);

  console.log(exercicios);

  return (
    <div>
      <h3 className="mb-4 fw-bold">Catálogo de Exercícios</h3>

      {exercicios.length === 0 ? (
        <p className="text-secondary text-center mt-5">
          Nenhum exercício encontrado...
        </p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {exercicios.map((exercicio) => (
            <div
              key={exercicio.id}
              className="card bg-dark text-light border-secondary shadow-sm"
            >
              <div className="card-body d-flex justify-content-between align-items-center p-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-secondary bg-opacity-25 p-2 rounded">
                    <i className="bi bi-activity text-primary fs-4"></i>
                  </div>
                  <span className="fs-5 fw-semibold">{exercicio.nome}</span>
                </div>
                <span className="badge bg-primary rounded-pill px-3 py-2">
                  {exercicio.series}x{exercicio.repeticoes}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
