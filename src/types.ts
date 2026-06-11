export type BottomSheetType = 'login' | 'register' | null;

export interface ValidationErrors {
  cpf?: string;
  email?: string;
  name?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}
