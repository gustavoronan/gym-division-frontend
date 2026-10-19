// A API devolve datas como "YYYY-MM-DD"; montamos a partir das partes para
// evitar o deslocamento de fuso que `new Date("YYYY-MM-DD")` causaria.
export function formatarDataCurta(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

export function dataDeHoje(): string {
  const texto = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatarHora(dataOuIso: string | Date): string {
  const d = typeof dataOuIso === "string" ? new Date(dataOuIso) : dataOuIso;
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function calcularIntervaloMinutos(
  inicioIso: string | Date,
  fimIso: string | Date = new Date()
): number {
  const dInicio = typeof inicioIso === "string" ? new Date(inicioIso) : inicioIso;
  const dFim = typeof fimIso === "string" ? new Date(fimIso) : fimIso;
  const diffMs = Math.max(0, dFim.getTime() - dInicio.getTime());
  return Math.max(1, Math.round(diffMs / 60000));
}
