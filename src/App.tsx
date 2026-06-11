/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, CheckCircle2, Info } from 'lucide-react';
import { BottomSheetType } from './types';
import BottomSheet from './components/BottomSheet';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';
// @ts-ignore
import backgroundImage from '../assets/background.jpg.png';

export default function App() {
  const [activeSheet, setActiveSheet] = useState<BottomSheetType>(null);
  const [bgFailed, setBgFailed] = useState(false);

  // Shared state for the smart CPF-first flow
  const [transitionCpf, setTransitionCpf] = useState('');
  const [transitionAlert, setTransitionAlert] = useState('');

  // Live profile session state
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; cpf: string } | null>(null);

  const handleCloseSheet = () => {
    setActiveSheet(null);
    setTransitionCpf('');
    setTransitionAlert('');
  };
  
  // Custom toast states for full fidelity simulation
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info'>('success');

  const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleLoginSuccess = (identifier: string) => {
    setActiveSheet(null);
    // Setup simulated Prime user with original cpf
    const mockUser = {
      name: 'Cliente Prime VTMCred',
      email: 'cliente@vtmcred.com.br',
      cpf: identifier.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    };
    setCurrentUser(mockUser);
    triggerToast(`Olá! Acesso autorizado com sucesso para: ${identifier}`, 'success');
  };

  const handleRegisterSuccess = (userData: { name: string; email: string }) => {
    setActiveSheet(null);
    const mockUser = {
      name: userData.name,
      email: userData.email,
      cpf: transitionCpf ? transitionCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : '123.456.789-00'
    };
    setCurrentUser(mockUser);
    triggerToast('Cadastro criado com sucesso.', 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    triggerToast('Desconectado com sucesso!', 'info');
  };

  if (currentUser) {
    return (
      <main 
        id="main-viewport-container"
        className="relative w-screen h-[100dvh] flex flex-col justify-between overflow-hidden bg-[#F9FAFB]"
      >
        <Dashboard user={currentUser} onLogout={handleLogout} triggerToast={triggerToast} />

        {/* 7. Premium Action Notification Toast Overlay on Dashboard */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 left-4 right-4 z-[999] mx-auto max-w-sm"
            >
              <div className="bg-[#0D1117] border border-royal-blue/30 shadow-2xl p-4 rounded-2xl flex items-start gap-3">
                {toastType === 'success' ? (
                  <CheckCircle2 size={22} className="text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Info size={22} className="text-royal-blue-light shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Notificação VTM
                  </p>
                  <p className="text-xs text-white/90 mt-1 font-medium leading-relaxed font-sans">
                    {toastMessage}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    );
  }

  return (
    <div className="hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="hero-content">
        {/* 1. Top Section: App name centered with generous padding and space */}
        <header className="flex flex-col items-center justify-center text-center select-none pt-4">
          <div className="flex items-center gap-3.5 h-[52px]">
            {/* Vertical royal-blue bar: grows bottom-to-top */}
            <motion.div
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ originY: 1 }}
              className="w-1.5 h-11 bg-[#1E51C8] rounded-full shadow-[0_0_12px_rgba(30,81,200,0.3)]"
            />

            {/* Logo container showing text reveal from left to right */}
            <h1 id="brand-logo" className="font-sans font-extrabold text-[#ffffff] tracking-tight text-[44px] leading-none select-none flex items-center">
              <motion.span
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block overflow-hidden whitespace-nowrap pr-1"
              >
                VTMCred
              </motion.span>
              <motion.span
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 1.2, ease: "easeOut" }}
                className="text-[#1E51C8] font-black font-display inline-block translate-y-0.5"
              >
                .
              </motion.span>
            </h1>
          </div>
        </header>

        {/* 2. Bottom Section: CTA Area containing stacked actionable buttons nested near the edge */}
        <footer className="w-full max-w-md mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full space-y-4 buttons-area"
          >
            {/* Primary Action Button: Acessar minha conta */}
            <button
              onClick={() => setActiveSheet('login')}
              id="acessar-conta-cta-btn"
              className="w-full flex items-center justify-center h-14 bg-royal-blue text-white font-semibold text-base rounded-2xl hover:bg-royal-blue-light border-0 shadow-lg shadow-royal-blue/30 active:scale-[0.98] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-royal-blue/30"
            >
              Acessar minha conta
            </button>

            {/* Secondary Action Button: Criar cadastro */}
            <button
              onClick={() => setActiveSheet('register')}
              id="criar-cadastro-cta-btn"
              className="w-full flex items-center justify-center h-14 bg-white/10 hover:bg-white/15 text-white font-semibold text-base rounded-2xl border border-white/30 hover:border-white/50 backdrop-blur-md active:scale-[0.98] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-white/10"
            >
              Criar cadastro
            </button>
          </motion.div>

          {/* Minimal compliance notice at the very bottom */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1.5, ease: 'easeOut' }}
            className="text-[10px] text-white/35 font-mono mt-8 uppercase tracking-wider text-center select-none"
          >
            © {new Date().getFullYear()} VTMCred Sociedade de Crédito
          </motion.p>
        </footer>
      </div>

      {/* 5. Subscribing Animated Bottom Sheet: Login */}
      <BottomSheet
        isOpen={activeSheet === 'login'}
        onClose={handleCloseSheet}
      >
        <LoginForm
          onSuccess={handleLoginSuccess}
          onSwitchToRegister={(cpf) => {
            setTransitionCpf(cpf);
            setTransitionAlert('');
            setActiveSheet('register');
          }}
          initialCpf={transitionCpf}
          initialAlert={transitionAlert}
          onClearInitialStates={() => {
            setTransitionCpf('');
            setTransitionAlert('');
          }}
        />
      </BottomSheet>

      {/* 6. Subscribing Animated Bottom Sheet: Register */}
      <BottomSheet
        isOpen={activeSheet === 'register'}
        onClose={handleCloseSheet}
      >
        <RegisterForm
          onSuccess={handleRegisterSuccess}
          onSwitchToLogin={(cpf, alert) => {
            setTransitionCpf(cpf);
            setTransitionAlert(alert || '');
            setActiveSheet('login');
          }}
          initialCpf={transitionCpf}
          onClearInitialStates={() => {
            setTransitionCpf('');
          }}
        />
      </BottomSheet>

      {/* 7. Premium Action Notification Toast Overlay */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-4 right-4 z-[999] mx-auto max-w-sm"
          >
            <div className="bg-[#0D1117] border border-royal-blue/30 shadow-2xl p-4 rounded-2xl flex items-start gap-3">
              {toastType === 'success' ? (
                <CheckCircle2 size={22} className="text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <Info size={22} className="text-royal-blue-light shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  {toastType === 'success' ? 'Notificação VTM' : 'Informação'}
                </p>
                <p className="text-xs text-white/90 mt-1 font-medium leading-relaxed">
                  {toastMessage}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

