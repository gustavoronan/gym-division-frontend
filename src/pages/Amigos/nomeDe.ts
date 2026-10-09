import type { Pessoa } from "../../types/social";

export const nomeDe = (p: Pessoa) => p.first_name || p.username;
