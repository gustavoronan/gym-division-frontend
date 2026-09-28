interface Props {
  feitos: number;
  total: number;
  tamanho?: number;
}

export default function ProgressRing({ feitos, total, tamanho = 96 }: Props) {
  const espessura = 9;
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const pct = total === 0 ? 0 : feitos / total;

  return (
    <div
      className="ring"
      style={{ width: tamanho, height: tamanho }}
      role="progressbar"
      aria-valuenow={Math.round(pct * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={tamanho} height={tamanho}>
        <circle
          className="ring__trilho"
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          strokeWidth={espessura}
        />
        <circle
          className="ring__valor"
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          strokeWidth={espessura}
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - pct)}
        />
      </svg>
      <span className="ring__texto">{Math.round(pct * 100)}%</span>
    </div>
  );
}
