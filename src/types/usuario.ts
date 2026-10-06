export interface Usuario {
  id: number;
  username: string;
  first_name: string;
  is_staff: boolean;
  is_active: boolean;
}

export interface UsuarioInput {
  username: string;
  first_name: string;
  password?: string;
  is_staff: boolean;
  is_active: boolean;
}
