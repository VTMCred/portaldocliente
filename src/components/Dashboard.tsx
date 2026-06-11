import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  LogOut, 
  CreditCard, 
  FileText, 
  TrendingUp, 
  MessageSquare, 
  HelpCircle, 
  ChevronRight, 
  ShieldCheck, 
  User, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  Home, 
  Clock, 
  Send 
} from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  cpf: string;
}

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
  triggerToast: (msg: string, type?: 'success' | 'info') => void;
}

type ActiveTab = 'inicio' | 'emprestimos' | 'parcelas' | 'perfil';

export default function Dashboard({ user, onLogout, triggerToast }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('inicio');
  const [showNotificationAlert, setShowNotificationAlert] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Get name initials
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return 'CL';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const firstName = user.name.trim().split(/\s+/)[0];

  // Dummy action helper
  const handleCardClick = (cardName: string) => {
    if (cardName === 'Meus Empréstimos') {
      setActiveTab('emprestimos');
    } else if (cardName === 'Minhas Parcelas') {
      setActiveTab('parcelas');
    } else if (cardName === 'Solicitar Análise') {
      setShowAnalysisModal(true);
    } else if (cardName === 'Falar com a VTMCred') {
      setShowSupportModal(true);
    }
  };

  return (
    <div id="vtm-dashboard" className="w-full h-full min-h-screen bg-[#F9FAFB] text-slate-900 flex flex-col font-sans select-none overflow-y-auto pb-24">
      {/* Top Header Row of Premium Finance App */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-royal-blue/10 border border-royal-blue/20 flex items-center justify-center text-royal-blue font-bold text-sm tracking-wide">
            {getInitials(user.name)}
          </div>
          <div>
            <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Cliente Prime</span>
            <h2 className="text-sm font-bold text-slate-800 leading-none">Olá, {firstName}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification Button */}
          <button 
            onClick={() => {
              setShowNotificationAlert(true);
              triggerToast("Nenhuma notificação nova no momento.", "info");
            }}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-slate-900 transition-colors relative"
            aria-label="Notificações"
          >
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#1E51C8]"></span>
          </button>

          {/* Discreet Exit Button */}
          <button 
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all border border-gray-100 hover:border-red-100"
            aria-label="Sair"
          >
            <LogOut size={14} />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Main Container Viewport with subtle transitions */}
      <main className="flex-1 px-5 pt-6 max-w-md mx-auto w-full space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === 'inicio' && (
            <motion.div
              key="inicio-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="space-y-6"
            >
              {/* Resumo atual Card highlight */}
              <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-royal-blue/5 to-transparent rounded-bl-full" />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                    Nenhum empréstimo ativo
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg">
                    Status: Livre
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[11px] text-gray-400 font-semibold mb-0.5">Empréstimos ativos</span>
                      <span className="text-base font-bold text-slate-800">0</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-gray-400 font-semibold mb-0.5">Próxima parcela</span>
                      <span className="text-base font-bold text-[#1E51C8]">R$ 0,00</span>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[11px] text-gray-400 font-semibold mb-0.5">Vencimento</span>
                      <span className="text-sm font-semibold text-slate-500">--</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-gray-400 font-semibold mb-0.5">Bandeira do contrato</span>
                      <span className="text-xs font-bold font-mono text-royal-blue bg-royal-blue/5 px-1.5 py-0.5 rounded inline-block">
                        VTMCred PRO
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Notice */}
                <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2.5">
                  <HelpCircle size={15} className="text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-500">
                    Você ainda não possui empréstimos cadastrados.
                  </span>
                </div>
              </div>

              {/* 2x2 Core Action Cards */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 px-1">Serviços e Soluções</h3>
                <div className="grid grid-cols-2 gap-3.5">
                  
                  {/* Card 1: Meus Empréstimos */}
                  <button 
                    onClick={() => handleCardClick('Meus Empréstimos')}
                    className="bg-white hover:bg-gray-50/55 p-4 rounded-3xl border border-gray-150 flex flex-col items-start justify-between min-h-[125px] text-left transition-all hover:shadow-md cursor-pointer group"
                  >
                    <div className="p-2.5 rounded-2xl bg-royal-blue/5 text-[#1E51C8] group-hover:bg-royal-blue/10 transition-colors">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <span className="block text-[#0D1117] font-semibold text-sm leading-tight mb-1">Meus Empréstimos</span>
                      <span className="text-[10px] text-gray-400">Ver contratos ativos</span>
                    </div>
                  </button>

                  {/* Card 2: Minhas Parcelas */}
                  <button 
                    onClick={() => handleCardClick('Minhas Parcelas')}
                    className="bg-white hover:bg-gray-50/55 p-4 rounded-3xl border border-gray-150 flex flex-col items-start justify-between min-h-[125px] text-left transition-all hover:shadow-md cursor-pointer group"
                  >
                    <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100/70 transition-colors">
                      <FileText size={20} />
                    </div>
                    <div>
                      <span className="block text-[#0D1117] font-semibold text-sm leading-tight mb-1">Minhas Parcelas</span>
                      <span className="text-[10px] text-gray-400">Gerenciar vencimentos</span>
                    </div>
                  </button>

                  {/* Card 3: Solicitar Análise */}
                  <button 
                    onClick={() => handleCardClick('Solicitar Análise')}
                    className="bg-white hover:bg-gray-50/55 p-4 rounded-3xl border border-gray-150 flex flex-col items-start justify-between min-h-[125px] text-left transition-all hover:shadow-md cursor-pointer group"
                  >
                    <div className="p-2.5 rounded-2xl bg-orange-50 text-orange-600 group-hover:bg-orange-100/70 transition-colors">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="block text-[#0D1117] font-semibold text-sm leading-tight">Solicitar Análise</span>
                      </div>
                      <span className="text-[10px] text-gray-400">Novo pedido de crédito</span>
                    </div>
                  </button>

                  {/* Card 4: Falar com a VTMCred */}
                  <button 
                    onClick={() => handleCardClick('Falar com a VTMCred')}
                    className="bg-white hover:bg-gray-50/55 p-4 rounded-3xl border border-gray-150 flex flex-col items-start justify-between min-h-[125px] text-left transition-all hover:shadow-md cursor-pointer group"
                  >
                    <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100/70 transition-colors">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <span className="block text-[#0D1117] font-semibold text-sm leading-tight mb-1">Falar conosco</span>
                      <span className="text-[10px] text-gray-400">Suporte e atendimento</span>
                    </div>
                  </button>

                </div>
              </div>

              {/* Large Highlight Card */}
              <div className="bg-sky-50 border border-sky-100 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between">
                <div className="absolute -right-3 -bottom-3 w-28 h-28 opacity-10 text-royal-blue">
                  <ShieldCheck className="w-full h-full" />
                </div>
                <div className="relative z-10 space-y-2">
                  <span className="inline-block text-[9px] font-bold text-royal-blue bg-royal-blue/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Suporte Digital
                  </span>
                  <h4 className="text-base font-bold text-slate-800 leading-tight">
                    Precisa acompanhar seu crédito?
                  </h4>
                  <p className="text-xs text-slate-650 leading-relaxed max-w-[85%]">
                    Veja suas parcelas, vencimentos e histórico em um só lugar.
                  </p>
                </div>
                <button 
                  onClick={() => triggerToast("Você já está na área de controle atual.", "info")}
                  className="mt-4 flex items-center gap-1 text-xs font-bold text-royal-blue hover:text-royal-blue-light transition-colors text-left"
                >
                  Conhecer as facilidades do portal <ChevronRight size={14} />
                </button>
              </div>

              {/* Area de Resumo Financeiro (Finances balance breakdown) */}
              <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Resumo do Contrato</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[11px] text-gray-400 font-medium">Total contratado</span>
                    <span className="text-lg font-extrabold text-slate-900">R$ 0,00</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-gray-400 font-medium">Saldo em aberto</span>
                    <span className="text-lg font-extrabold text-slate-900">R$ 0,00</span>
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[11px] text-gray-400 font-medium">Parcelas pagas</span>
                    <span className="text-base font-bold text-slate-700">0</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-gray-400 font-medium">Parcelas em aberto</span>
                    <span className="text-base font-bold text-slate-700">0</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'emprestimos' && (
            <motion.div
              key="emprestimos-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Meus Empréstimos</h3>
                  <p className="text-xs text-gray-400">Histórico de contratos securitários</p>
                </div>
                <span className="text-xs bg-royal-blue/5 text-royal-blue font-bold px-2.5 py-1 rounded-full">
                  Livre para proposta
                </span>
              </div>

              {/* Central Off-White Empty state illustrative block */}
              <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center flex flex-col items-center justify-center space-y-4 min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400">
                  <CreditCard size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">Nenhum empréstimo cadastrado</h4>
                  <p className="text-xs text-slate-450 mt-1 max-w-[260px] mx-auto leading-relaxed">
                    Você ainda não possui empréstimos cadastrados. Clique no botão abaixo para conversar no suporte ou solicitar uma análise.
                  </p>
                </div>
                <div className="pt-2 w-full max-w-[200px]">
                  <button 
                    onClick={() => setShowAnalysisModal(true)}
                    className="w-full py-3 px-4 bg-royal-blue text-white rounded-xl font-semibold text-xs transition-colors hover:bg-royal-blue-light"
                  >
                    Fazer uma nova solicitação
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'parcelas' && (
            <motion.div
              key="parcelas-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="mb-1">
                <h3 className="text-xl font-bold text-slate-900">Minhas Parcelas</h3>
                <p className="text-xs text-gray-400">Gestão e liquidação de parcelas</p>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center flex flex-col items-center justify-center space-y-4 min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400">
                  <FileText size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">Nenhuma parcela em aberto</h4>
                  <p className="text-xs text-slate-450 mt-1 max-w-[260px] mx-auto leading-relaxed">
                    Você não possui faturas, faturamentos, boletos ou parcelas em aberto registradas no portal.
                  </p>
                </div>
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                    <CheckCircle size={12} className="shrink-0" /> Suas obrigações estão em dia
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'perfil' && (
            <motion.div
              key="perfil-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="mb-1">
                <h3 className="text-xl font-bold text-slate-900">Meus Dados</h3>
                <p className="text-xs text-gray-400">Informações cadastradas no portal de cliente</p>
              </div>

              {/* User Profile Card */}
              <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-royal-blue/15 flex items-center justify-center text-royal-blue font-extrabold text-base">
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{user.name}</h4>
                    <span className="text-xs text-gray-400 font-medium">Cliente VTMCred Regular</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">CPF do Titular</span>
                    <span className="text-xs font-mono font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-150 inline-block">{user.cpf}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">E-mail Cadastrado</span>
                    <span className="text-xs text-slate-700 font-medium block break-all">{user.email}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Grau de Segurança</span>
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 pt-0.5">
                      <ShieldCheck size={14} /> Dados criptografados no servidor seguro
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Legal notes */}
              <div className="text-[10px] text-gray-400 leading-relaxed space-y-2 px-1">
                <p>
                  VTMCred respeita as diretrizes da Lei Geral de Proteção de Dados (LGPD). Todos os acessos e logs de ações são monitorados para sua proteção financeira.
                </p>
                <p>
                  Estampas temporais de auditoria em vigor. Última sincronização de sistema: {new Date().toLocaleDateString('pt-BR')}.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bottom Navigation Tab bar - Fixed Premium Design */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] px-3 py-2 flex items-center justify-around z-40 rounded-t-3xl">
        {/* Tab 1: Inicio */}
        <button 
          onClick={() => setActiveTab('inicio')}
          className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'inicio' ? 'text-royal-blue bg-royal-blue/5 font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Home size={20} />
          <span className="text-[10px] tracking-tight">Início</span>
        </button>

        {/* Tab 2: Emprestimos */}
        <button 
          onClick={() => setActiveTab('emprestimos')}
          className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'emprestimos' ? 'text-royal-blue bg-royal-blue/5 font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <CreditCard size={20} />
          <span className="text-[10px] tracking-tight">Empréstimos</span>
        </button>

        {/* Tab 3: Cancelas/Parcelas */}
        <button 
          onClick={() => setActiveTab('parcelas')}
          className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'parcelas' ? 'text-royal-blue bg-royal-blue/5 font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Clock size={20} />
          <span className="text-[10px] tracking-tight">Parcelas</span>
        </button>

        {/* Tab 4: Perfil */}
        <button 
          onClick={() => setActiveTab('perfil')}
          className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'perfil' ? 'text-royal-blue bg-royal-blue/5 font-bold' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <User size={20} />
          <span className="text-[10px] tracking-tight">Perfil</span>
        </button>
      </nav>

      {/* RENDER MODALS/BOTTOM SHEETS DISCREETLY IF THE USER INTERACTS WITH EXTRA ACTIONS */}
      
      {/* 1. Request Credit Analysis Modal */}
      <AnimatePresence>
        {showAnalysisModal && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center p-0">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-white rounded-t-3xl max-w-sm w-full p-6 text-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <TrendingUp className="text-royal-blue" size={20} /> Solicitar Análise
                </h3>
                <button 
                  onClick={() => setShowAnalysisModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  Fechar
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Nossa equipe utiliza dados estatísticos avançados de risco de crédito para formular propostas personalizadas. Informe o valor pretendido para nossa mesa técnica realizar um estudo.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Valor Necessário</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">R$</span>
                  <input 
                    type="number" 
                    placeholder="Ex: 5000" 
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-royal-blue/20 focus:border-royal-blue"
                  />
                </div>
              </div>

              <button 
                onClick={() => {
                  setShowAnalysisModal(false);
                  triggerToast("Pedido enviado! Nossa equipe se comunicará por e-mail ou WhatsApp.", "success");
                }}
                className="w-full py-4.5 h-13 bg-royal-blue hover:bg-royal-blue-light text-white font-bold text-sm rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Enviar proposta para estudo
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Customer service / contact support modal */}
      <AnimatePresence>
        {showSupportModal && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center p-0">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-white rounded-t-3xl max-w-sm w-full p-6 text-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                  <MessageSquare className="text-royal-blue" size={20} /> Canal de Atendimento
                </h3>
                <button 
                  onClick={() => setShowSupportModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  Fechar
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Nosso suporte é 100% humanizado e dedicado. Respondemos suas perguntas de forma direta e sem robôs.
              </p>

              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setShowSupportModal(false);
                    triggerToast("Seu chat foi iniciado... Redirecionando para central.", "info");
                  }}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-55 border border-gray-150 rounded-xl hover:bg-slate-50 transition text-left cursor-pointer"
                >
                  <div>
                    <span className="block text-xs font-bold text-slate-850">Suporte Técnico por E-mail</span>
                    <span className="text-[10px] text-gray-400">suporte@vtmcred.com.br</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>

                <button 
                  onClick={() => {
                    setShowSupportModal(false);
                    triggerToast("Direcionando para o canal de WhatsApp... Por favor, aguarde.", "success");
                  }}
                  className="w-full flex items-center justify-between p-3.5 bg-[#25D366]/5 border border-[#25D366]/20 rounded-xl hover:bg-[#25D366]/10 transition text-left cursor-pointer"
                >
                  <div>
                    <span className="block text-xs font-bold text-[#128C7E]">Central Executiva WhatsApp</span>
                    <span className="text-[10px] text-green-600">Sua assessoria direta em tempo real</span>
                  </div>
                  <ChevronRight size={16} className="text-[#128C7E]" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
