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
