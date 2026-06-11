import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { ValidationErrors } from '../types';
import { formatCPF, formatPhone, validateCPF, isCPFRegistered, registerCPFValue } from '../utils';

interface RegisterFormProps {
  onSuccess: (userData: { name: string; email: string }) => void;
  onSwitchToLogin: (cpf: string, alert?: string) => void;
  initialCpf?: string;
  onClearInitialStates?: () => void;
}

export default function RegisterForm({ 
  onSuccess, 
  onSwitchToLogin, 
  initialCpf = '',
  onClearInitialStates
}: RegisterFormProps) {
  const [step, setStep] = useState<'cpf' | 'details'>('cpf');
  const [cpf, setCpf] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Sync initial CPF state
  useEffect(() => {
    if (initialCpf) {
      setCpf(formatCPF(initialCpf));
      setStep('details'); // Bypass Step 1 if CPF pre-specified from Login Form
    }
  }, [initialCpf]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const digits = val.replace(/\D/g, '').slice(0, 11);
    setCpf(formatCPF(digits));
    
    if (errors.cpf) {
      setErrors(prev => ({ ...prev, cpf: undefined }));
    }
    if (onClearInitialStates) {
      onClearInitialStates();
    }
  };

  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'name') {
      // Allow only letters, standard accents, and spaces
      formattedValue = value.replace(/[^a-zA-ZáéíóúàèìòùâêîôûãõçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ\s]/gi, '');
    } else if (name === 'phone') {
      const digits = value.replace(/\D/g, '');
      formattedValue = formatPhone(digits.slice(0, 11));
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));

    // Clear dynamic error for this specific field
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCpfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCPF = cpf.replace(/\D/g, '');

    if (!cleanCPF) {
      setErrors({ cpf: 'O CPF é obrigatório' });
      return;
    }

    if (!validateCPF(cleanCPF)) {
      setErrors({ cpf: 'Informe um CPF válido (11 dígitos)' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    setTimeout(() => {
      setIsLoading(false);
      const alreadyRegistered = isCPFRegistered(cleanCPF);
      if (alreadyRegistered) {
        // Automatically route to login and pass the CPF + an info message
        onSwitchToLogin(cleanCPF, "Este CPF já possui cadastro. Insira sua senha para acessar.");
      } else {
        // CPF is clear, proceed to details filling
        setStep('details');
      }
    }, 900);
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: ValidationErrors = {};

    // Validate Name (Full Name: needs letters and space representing two tokens)
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.name = 'Informe seu nome completo';
    } else if (!trimmedName.includes(' ') || trimmedName.split(/\s+/).filter(Boolean).length < 2) {
      newErrors.name = 'Informe seu nome e sobrenome completo';
    }

    // Validate Phone
    if (!formData.phone) {
      newErrors.phone = 'O telefone é obrigatório';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Informe um telefone válido com o DDD';
    }

    // Validate Email
    if (!formData.email) {
      newErrors.email = 'O e-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Informe um e-mail com formato válido';
    }

    // Validate Password
    if (!formData.password) {
      newErrors.password = 'A senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'A senha precisa de no mínimo 6 caracteres';
    }

    // Validate Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'A confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas devem ser idênticas';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    setTimeout(() => {
      setIsLoading(false);
      // Register custom CPF to our local list
      const cleanCPF = cpf.replace(/\D/g, '');
      registerCPFValue(cleanCPF);

      // Trigger success callback
      onSuccess({ name: formData.name, email: formData.email });
    }, 1500);
  };

  const goBackToCpf = () => {
    setStep('cpf');
    setErrors({});
    if (onClearInitialStates) {
      onClearInitialStates();
    }
  };

  // 1. STEP 2: DETAILS SCREEN (CPF FIXED)
  if (step === 'details') {
    return (
      <div className="text-gray-900">
        {/* Header navigation back */}
        <div className="flex items-center gap-2 mb-5">
          <button 
            type="button" 
            onClick={goBackToCpf}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-950 focus:outline-none"
            aria-label="Voltar para CPF"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Voltar</span>
        </div>

        <div className="mb-5">
          <h2 className="text-2xl font-bold font-display text-gray-950 tracking-tight">
            Criar cadastro
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Preencha seus dados para acessar o portal
          </p>
        </div>

        {/* Locked CPF Display */}
        <div className="mb-5 bg-gray-50 border border-gray-100 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">CPF Verificado</span>
            <span className="text-sm font-mono font-bold text-gray-800">{cpf}</span>
          </div>
          <button 
            type="button"
            onClick={goBackToCpf}
            className="text-xs font-bold text-royal-blue hover:text-royal-blue-light hover:underline"
          >
            Alterar
          </button>
        </div>

        <form onSubmit={handleDetailsSubmit} className="space-y-4">
          {/* Name Input */}
          <div>
            <label htmlFor="reg-name-input" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Nome completo
            </label>
            <input
              id="reg-name-input"
              type="text"
              name="name"
              placeholder="Seu nome e sobrenome"
              value={formData.name}
              onChange={handleDetailsChange}
              className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                errors.name ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-royal-blue focus:ring-royal-blue/10'
              }`}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.name}
              </p>
            )}
          </div>

          {/* Phone Input */}
          <div>
            <label htmlFor="reg-phone-input" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Telefone
            </label>
            <input
              id="reg-phone-input"
              type="tel"
              name="phone"
              placeholder="(99) 99999-9999"
              value={formData.phone}
              onChange={handleDetailsChange}
              className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                errors.phone ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-royal-blue focus:ring-royal-blue/10'
              }`}
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.phone}
              </p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="reg-email-input" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              E-mail
            </label>
            <input
              id="reg-email-input"
              type="email"
              name="email"
              placeholder="jose@exemplo.com.br"
              value={formData.email}
              onChange={handleDetailsChange}
              className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                errors.email ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-royal-blue focus:ring-royal-blue/10'
              }`}
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.email}
              </p>
            )}
          </div>

          {/* Passwords in modern grouped layouts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password Input */}
            <div>
              <label htmlFor="reg-password-input" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  id="reg-password-input"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="No mínimo 6 dígitos"
                  value={formData.password}
                  onChange={handleDetailsChange}
                  className={`w-full pl-4 pr-10 py-3 rounded-xl border bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    errors.password ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-royal-blue focus:ring-royal-blue/10'
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  id="reg-toggle-password-visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200/50 transition-colors"
                  aria-label={showPassword ? "Esconder senha" : "Exibir senha"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="reg-confirmpassword-input" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Confirmar senha
              </label>
              <div className="relative">
                <input
                  id="reg-confirmpassword-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Repita sua senha"
                  value={formData.confirmPassword}
                  onChange={handleDetailsChange}
                  className={`w-full pl-4 pr-10 py-3 rounded-xl border bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    errors.confirmPassword ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-royal-blue focus:ring-royal-blue/10'
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  id="reg-toggle-confirm-password-visibility"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200/50 transition-colors"
                  aria-label={showConfirmPassword ? "Esconder senha" : "Exibir senha"}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle size={12} /> {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="reg-submit-btn"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-4 bg-royal-blue hover:bg-royal-blue-light text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-royal-blue/10 h-[52px] active:scale-[0.99] disabled:opacity-75 mt-6 cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin mr-2" size={18} />
                <span>Criando sua conta...</span>
              </div>
            ) : (
              'Criar conta'
            )}
          </button>
        </form>
      </div>
    );
  }

  // 2. STEP 1: CPF SCREEN
  return (
    <div className="text-gray-900">
      <div className="mb-5">
        <h2 className="text-2xl font-bold font-display text-gray-950 tracking-tight">
          Criar cadastro
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Informe seu CPF para continuar no portal
        </p>
      </div>

      <form onSubmit={handleCpfSubmit} className="space-y-4">
        {/* CPF Input */}
        <div>
          <label htmlFor="reg-cpf-input" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
            Seu CPF
          </label>
          <input
            id="reg-cpf-input"
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={handleCpfChange}
            className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-900 placeholder-gray-400 font-mono focus:outline-none focus:ring-2 focus:bg-white transition-all ${
              errors.cpf ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-royal-blue focus:ring-royal-blue/10'
            }`}
            autoFocus
          />
          {errors.cpf && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle size={12} /> {errors.cpf}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="reg-cpf-submit-btn"
          disabled={isLoading}
          className="w-full flex items-center justify-center py-4 bg-royal-blue hover:bg-royal-blue-light text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-royal-blue/10 h-[52px] active:scale-[0.99] disabled:opacity-75 mt-6 cursor-pointer"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin mr-2" size={18} />
              <span>Verificando...</span>
            </div>
          ) : (
            'Continuar'
          )}
        </button>
      </form>

      {/* Switch Form Link */}
      <div className="mt-5 text-center">
        <span className="text-xs text-gray-500">Já possui uma conta? </span>
        <button
          onClick={() => onSwitchToLogin(cpf.replace(/\D/g, ''))}
          id="reg-switch-login-btn"
          className="text-xs font-bold text-royal-blue hover:text-royal-blue-light focus:outline-none hover:underline"
        >
          Já tenho conta
        </button>
      </div>
    </div>
  );
}
