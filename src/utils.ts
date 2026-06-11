// Formatting and Validation helpers for VTMCred Portal

export const formatCPF = (raw: string): string => {
  const cleaned = raw.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
};

export const formatPhone = (raw: string): string => {
  const cleaned = raw.replace(/\D/g, '');
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 2) return `(${cleaned}`;
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
};

export const validateCPF = (cpf: string): boolean => {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return false;
  // Exclude sequence repeating patterns
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
  
  // Real mathematical verification algorithm for CPFs
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if ((remainder === 10) || (remainder === 11)) remainder = 0;
  if (remainder !== parseInt(cleanCpf.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if ((remainder === 10) || (remainder === 11)) remainder = 0;
  if (remainder !== parseInt(cleanCpf.substring(10, 11))) return false;
  
  return true;
};

// Seed simulated accounts in localStorage
const SEED_KEY = 'vtmcred_registered_cpfs';
const INITIAL_SEEDED_CPFS = [
  '12345678909', // test cpf (123.456.789-09)
  '44444444444',
  '11111111111'
];

export const initializeSeededCPFs = () => {
  if (!localStorage.getItem(SEED_KEY)) {
    localStorage.setItem(SEED_KEY, JSON.stringify(INITIAL_SEEDED_CPFS));
  }
};

export const isCPFRegistered = (cpf: string): boolean => {
  initializeSeededCPFs();
  const clean = cpf.replace(/\D/g, '');
  const list = JSON.parse(localStorage.getItem(SEED_KEY) || '[]');
  return list.includes(clean);
};

export const registerCPFValue = (cpf: string) => {
  initializeSeededCPFs();
  const clean = cpf.replace(/\D/g, '');
  const list = JSON.parse(localStorage.getItem(SEED_KEY) || '[]');
  if (!list.includes(clean)) {
    list.push(clean);
    localStorage.setItem(SEED_KEY, JSON.stringify(list));
  }
};
