import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { formatCPF, validateCPF, isCPFRegistered } from '../utils';

interface LoginFormProps {
  onSuccess: (identifier: string) => void;
  onSwitchToRegister: (cpf: string) => void;
  initialCpf?: string;
  initialAlert?: string;
  onClearInitialStates?: () => void;
}

export default function LoginForm({ 
  onSuccess, 
  onSwitchToRegister, 
  initialCpf = '', 
  initialAlert = '',
  onClearInitialStates
}: LoginFormProps) {
  const [step, setStep] = useState<'cpf' | 'password'>('cpf');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessages, setErrorMessages] = useState<{ cpf?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Forgot password sub-flow states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Sync initial CPF or alerts if passed from parent
  useEffect(() => {
    if (initialCpf) {
      setCpf(formatCPF(initialCpf));
      // Since it was explicitly passed, verify and skip straight to password step if registered
      if (isCPFRegistered(initialCpf)) {
        setStep('password');
      }
    }
  }, [initialCpf]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const digits = val.replace(/\D/g, '').slice(0, 11);
    setCpf(formatCPF(digits));
    
    if (errorMessages.cpf) {
      setErrorMessages(prev => ({ ...prev, cpf: undefined }));
    }
    if (onClearInitialStates) {
      onClearInitialStates();
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errorMessages.password) {
      setErrorMessages(prev => ({ ...prev, password: undefined }));
    }
  };

  const handleCpfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCpf = cpf.replace(/\D/g, '');

    if (!cleanCpf) {
      setErrorMessages({ cpf: 'Informe seu CPF para continuar' });
      return;
    }

    if (!validateCPF(cleanCpf)) {
      setErrorMessages({ cpf: 'Informe um CPF válido (11 dígitos)' });
      return;
    }

    setIsLoading(true);
    setErrorMessages({});

    setTimeout(() => {
      setIsLoading(false);
      const registered = isCPFRegistered(cleanCpf);
      if (registered) {
        // CPF exists, go to Enter Password
        setStep('password');
      } else {
        // CPF does not exist, send directly to register screen
        onSwitchToRegister(cleanCpf);
      }
    }, 900);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMessages({ password: 'Informe sua senha' });
      return;
    }

    if (password.length < 6) {
      setErrorMessages({ password: 'A senha deve possuir no mínimo 6 caracteres' });
      return;
    }

    setIsLoading(true);
    setErrorMessages({});

    setTimeout(() => {
      setIsLoading(false);
      onSuccess(cpf);
    }, 1200);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate simple e-mail format
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setErrorMessages({ general: 'Por favor, informe um e-mail válido para a recuperação' });
      return;
    }
    setIsLoading(true);
    setErrorMessages({});

    setTimeout(() => {
      setIsLoading(false);
      setForgotSuccess(true);
    }, 1200);
  };

  const goBackToCpf = () => {
    setStep('cpf');
    setPassword('');
    setErrorMessages({});
    if (onClearInitialStates) {
      onClearInitialStates();
    }
  };

  // 1. FORGOT PASSWORD VIEW OVERRIDE
  if (isForgotPassword) {
    return (
      <div className="text-gray-900">
        <h2 className="text-2xl font-bold font-display text-gray-900 tracking-tight">
          Recuperar senha
        </h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Preencha com o e-mail de sua conta para recuperar sua senha.
        </p>

        {forgotSuccess ? (
          <div className="bg-emerald-50 text-emerald-800 p-5 rounded-2xl border border-emerald-100 flex flex-col items-center text-center">
            <CheckCircle2 className="text-emerald-500 w-12 h-12 mb-3" />
            <span className="font-semibold text-base">Instruções enviadas!</span>
            <span className="text-xs text-emerald-600 mt-1 max-w-[280px]">
              Enviamos um link de redefinição para <strong>{forgotEmail}</strong>. Verifique sua caixa de entrada.
            </span>
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setForgotSuccess(false);
                setForgotEmail('');
              }}
              className="mt-6 w-full py-3 bg-royal-blue text-white font-medium rounded-xl hover:bg-royal-blue-light transition-all shadow-md active:scale-[0.98]"
            >
              Voltar para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="forgot-email-input" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                Seu e-mail cadastrado
              </label>
              <input
                id="forgot-email-input"
                type="email"
                placeholder="exemplo@vtmcred.com.br"
                value={forgotEmail}
                onChange={(e) => {
                  setForgotEmail(e.target.value);
                  setErrorMessages({});
                }}
                className={`w-full px-4 py-3.5 rounded-xl border bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                  errorMessages.general ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-royal-blue focus:ring-royal-blue/20'
                }`}
                required
              />
              {errorMessages.general && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} /> {errorMessages.general}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-4 bg-royal-blue hover:bg-royal-blue-light text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-royal-blue/10 active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Enviando link...
                </>
              ) : (
                'Recuperar minha senha'
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setErrorMessages({});
              }}
              className="w-full text-center py-2 text-sm font-semibold text-royal-blue hover:text-royal-blue-light transition-colors mt-2"
            >
              Voltar para o login
            </button>
          </form>
        )}
      </div>
    );
  }

  // 2. STEP 2: PASSWORD FORM (LOCKED CPF)
  if (step === 'password') {
    return (
      <div className="text-gray-900">
        {/* Step Head */}
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

        <div className="mb-6">
          <h2 className="text-2xl font-bold font-display text-gray-950 tracking-tight">
            Acesse sua conta
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Informe sua senha securitária cadastrada
          </p>
        </div>

        {/* Info alerts if routed from Registration system */}
        {initialAlert && (
          <div className="mb-5 bg-blue-50 text-blue-800 p-3.5 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs font-medium leading-relaxed">
            <AlertCircle size={16} className="text-royal-blue shrink-0 mt-0.5" />
            <span>{initialAlert}</span>
          </div>
        )}

        {/* Display lock CPF badge */}
        <div className="mb-5 bg-gray-50 border border-gray-100 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">CPF Identificado</span>
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

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="login-password-input" className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Senha
              </label>
              <button
                type="button"
                id="forgot-password-toggle-view"
                onClick={() => setIsForgotPassword(true)}
                className="text-xs text-royal-blue hover:text-royal-blue-light font-semibold underline-offset-2 hover:underline focus:outline-none"
              >
                Esqueci minha senha
              </button>
            </div>
            <div className="relative">
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha"
                value={password}
                onChange={handlePasswordChange}
                className={`w-full pl-4 pr-11 py-3.5 rounded-xl border bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                  errorMessages.password ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-royal-blue focus:ring-royal-blue/10'
                }`}
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                id="login-toggle-password-visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200/50 transition-colors"
                aria-label={showPassword ? "Esconder senha" : "Exibir senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errorMessages.password && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle size={13} /> {errorMessages.password}
              </p>
            )}
          </div>

          {/* Action Button */}
          <button
            type="submit"
            id="login-submit-btn"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-4 bg-royal-blue hover:bg-royal-blue-light text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-royal-blue/10 h-[52px] active:scale-[0.99] disabled:opacity-75 mt-6 cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin mr-2" size={18} />
                <span>Verificando...</span>
              </div>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>
    );
  }

  // 3. STEP 1: CPF FIRST INPUT
  return (
    <div className="text-gray-900">
      <div className="mb-6">
        <h2 className="text-2xl font-bold font-display text-gray-950 tracking-tight">
          Acesse sua conta
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Informe seu CPF para continuar no portal
        </p>
      </div>

      <form onSubmit={handleCpfSubmit} className="space-y-4">
        {/* CPF Field */}
        <div>
          <label htmlFor="login-cpf-input" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Seu CPF
          </label>
          <input
            id="login-cpf-input"
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={handleCpfChange}
            className={`w-full px-4 py-3.5 rounded-xl border bg-gray-50 text-gray-900 placeholder-gray-400 font-mono focus:outline-none focus:ring-2 focus:bg-white transition-all ${
              errorMessages.cpf ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-royal-blue focus:ring-royal-blue/10'
            }`}
            autoComplete="username"
            autoFocus
          />
          {errorMessages.cpf && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle size={13} /> {errorMessages.cpf}
            </p>
          )}
        </div>

        {/* Action Button */}
        <button
          type="submit"
          id="login-cpf-submit-btn"
          disabled={isLoading}
          className="w-full flex items-center justify-center py-4 bg-royal-blue hover:bg-royal-blue-light text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-royal-blue/10 h-[52px] active:scale-[0.99] disabled:opacity-75 mt-6 cursor-pointer"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin mr-2" size={18} />
              <span>Buscando conta...</span>
            </div>
          ) : (
            'Continuar'
          )}
        </button>
      </form>

      {/* Switch Form Link */}
      <div className="mt-6 text-center">
        <span className="text-xs text-gray-500">Ainda não possui login? </span>
        <button
          onClick={() => onSwitchToRegister(cpf.replace(/\D/g, ''))}
          id="login-switch-register-btn"
          className="text-xs font-bold text-royal-blue hover:text-royal-blue-light focus:outline-none hover:underline"
        >
          Criar cadastro
        </button>
      </div>
    </div>
  );
}
