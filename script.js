// Pure Vanilla JS Controller for VTMCred Client Portal

// 1. Storage Seed & Simulation Initialization
const STORAGE_SEEDED_KEY = 'vtmcred_registered_cpfs';
const INITIAL_SEEDED_CPFS = [
  '12345678909', // Test account (123.456.789-09)
  '44444444444',
  '11111111111'
];

function initializeSeededCPFs() {
  if (!localStorage.getItem(STORAGE_SEEDED_KEY)) {
    localStorage.setItem(STORAGE_SEEDED_KEY, JSON.stringify(INITIAL_SEEDED_CPFS));
  }
}

function isCPFRegistered(cpf) {
  initializeSeededCPFs();
  const clean = cpf.replace(/\D/g, '');
  const list = JSON.parse(localStorage.getItem(STORAGE_SEEDED_KEY) || '[]');
  return list.includes(clean);
}

function registerNewCPF(cpf) {
  initializeSeededCPFs();
  const clean = cpf.replace(/\D/g, '');
  const list = JSON.parse(localStorage.getItem(STORAGE_SEEDED_KEY) || '[]');
  if (!list.includes(clean)) {
    list.push(clean);
    localStorage.setItem(STORAGE_SEEDED_KEY, JSON.stringify(list));
  }
}

// 2. High-Fidelity Formatting Helpers
function formatCPF(raw) {
  const cleaned = raw.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
}

function formatPhone(raw) {
  const cleaned = raw.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 2) return `(${cleaned}`;
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
}

function validateCPFMath(cpf) {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
  
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
}

// 3. State Management
let currentSheet = null; // 'login' | 'register' | null
let transitionCpf = ''; // holds CPF between states
let transitionAlert = ''; // holds info/warning messages

// Live profile session state
let currentUser = null; // holds session user details
let activeTab = 'inicio'; // 'inicio' | 'emprestimos' | 'parcelas' | 'perfil'
let showAnalysisModal = false;
let showSupportModal = false;

// Form template state
let loginStep = 'cpf'; // 'cpf' | 'password' | 'forgot'
let registerStep = 'cpf'; // 'cpf' | 'details'

// Cached Inputs data for registration details step to protect user input during toggles
let cachedRegisterData = {
  name: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: ''
};

// 4. DOM Cache
let backdrop = null;
let sheetContainer = null;
let sheetContent = null;
let dimOverlay = null;
let bgImage = null;
let accessingButton = null;
let registeringButton = null;
let toastNode = null;

// Initialize after DOM loads
document.addEventListener('DOMContentLoaded', () => {
  initializeSeededCPFs();

  // Bind DOM elements
  backdrop = document.getElementById('sheet-backdrop');
  sheetContainer = document.getElementById('sheet-container');
  sheetContent = document.getElementById('sheet-content');
  dimOverlay = document.getElementById('dim-overlay');
  bgImage = document.getElementById('bg-image');
  accessingButton = document.getElementById('acessar-conta-cta-btn');
  registeringButton = document.getElementById('criar-cadastro-cta-btn');
  toastNode = document.getElementById('toast');

  // Year dynamic binding
  document.getElementById('current-year').textContent = new Date().getFullYear();

  // CTA triggers
  accessingButton.addEventListener('click', () => openSheet('login'));
  registeringButton.addEventListener('click', () => openSheet('register'));

  // Close triggers
  backdrop.addEventListener('click', closeActiveSheet);
  document.getElementById('close-bottom-sheet-btn').addEventListener('click', closeActiveSheet);
  document.getElementById('sheet-handle').addEventListener('click', closeActiveSheet);

  lucide.createIcons();

  // Restore simulated session on load
  const sessionUser = localStorage.getItem('vtmcred_current_user');
  if (sessionUser) {
    try {
      currentUser = JSON.parse(sessionUser);
      loadUserDashboard();
    } catch (e) {
      localStorage.removeItem('vtmcred_current_user');
    }
  }
});

// 5. Bottom Sheet Mechanics
function openSheet(type) {
  currentSheet = type;
  
  // Clean states unless transitioned
  if (type === 'login') {
    loginStep = transitionCpf ? 'password' : 'cpf';
  } else {
    registerStep = transitionCpf ? 'details' : 'cpf';
  }

  // Prevent scroll
  document.body.style.overflow = 'hidden';

  // Toggle active helper classes to fully materialize the bottom sheet
  backdrop.classList.add('active');
  sheetContainer.classList.add('active');

  // Make bottom sheet interaction block visible
  const parentSheet = document.getElementById('bottom-sheet');
  if (parentSheet) {
    parentSheet.classList.remove('pointer-events-none');
    parentSheet.classList.add('pointer-events-auto');
  }

  // Trigger smooth transitions
  backdrop.classList.remove('pointer-events-none', 'opacity-0');
  backdrop.classList.add('pointer-events-auto', 'opacity-60');

  sheetContainer.classList.remove('translate-y-full');
  sheetContainer.classList.add('translate-y-0');

  // Smooth cinematic dim image and overlay (User requirement)
  if (dimOverlay) {
    dimOverlay.style.backgroundColor = 'rgba(0,0,0,0.58)';
  }
  if (bgImage) {
    bgImage.classList.add('brightness-[0.45]');
  }

  renderForm();
}

function closeActiveSheet() {
  if (!currentSheet) return;

  // Restore scroll
  document.body.style.overflow = '';

  // Deactivate helper classes to slide down sheet
  backdrop.classList.remove('active');
  sheetContainer.classList.remove('active');

  // Trigger reverse transitions
  backdrop.classList.remove('pointer-events-auto', 'opacity-60');
  backdrop.classList.add('pointer-events-none', 'opacity-0');

  sheetContainer.classList.remove('translate-y-0');
  sheetContainer.classList.add('translate-y-full');

  // Smooth cinematic back to glowing standard (User requirement)
  if (dimOverlay) {
    dimOverlay.style.backgroundColor = 'rgba(0,0,0,0.18)';
  }
  if (bgImage) {
    bgImage.classList.remove('brightness-[0.45]');
  }

  // Hide the parent block after completion of slide down transition
  setTimeout(() => {
    const parentSheet = document.getElementById('bottom-sheet');
    if (parentSheet) {
      parentSheet.classList.add('pointer-events-none');
      parentSheet.classList.remove('pointer-events-auto');
    }
    
    // Clear temp values
    transitionCpf = '';
    transitionAlert = '';
    cachedRegisterData = { name: '', phone: '', email: '', password: '', confirmPassword: '' };
    currentSheet = null;
  }, 350);
}

// 6. Template Render Router
function renderForm() {
  if (currentSheet === 'login') {
    if (loginStep === 'cpf') {
      sheetContent.innerHTML = getLoginCpfTpl();
      bindLoginCpfEvents();
    } else if (loginStep === 'password') {
      sheetContent.innerHTML = getLoginPasswordTpl();
      bindLoginPasswordEvents();
    } else if (loginStep === 'forgot') {
      sheetContent.innerHTML = getForgotPasswordTpl();
      bindForgotPasswordEvents();
    }
  } else if (currentSheet === 'register') {
    if (registerStep === 'cpf') {
      sheetContent.innerHTML = getRegisterCpfTpl();
      bindRegisterCpfEvents();
    } else if (registerStep === 'details') {
      sheetContent.innerHTML = getRegisterDetailsTpl();
      bindRegisterDetailsEvents();
    }
  }
  lucide.createIcons();
}

// 7. Render Templates (Pure Semantic HTML)
function getLoginCpfTpl() {
  return `
    <div class="text-gray-900 animate-[fadeInUp_0.4s_ease-out]">
      <div class="mb-6">
        <h2 class="text-2xl font-bold font-display text-gray-950 tracking-tight">
          Acesse sua conta
        </h2>
        <p class="text-sm text-gray-500 mt-1">
          Informe seu CPF para continuar no portal
        </p>
      </div>

      <form id="login-cpf-form" class="space-y-4">
        <div>
          <label for="login-cpf-input" class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Seu CPF
          </label>
          <input
            id="login-cpf-input"
            type="text"
            inputmode="numeric"
            placeholder="000.000.000-00"
            value="${transitionCpf ? formatCPF(transitionCpf) : ''}"
            class="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-mono focus:outline-none focus:ring-2 focus:bg-white focus:border-royal-blue focus:ring-royal-blue/10 transition-all"
            autocomplete="username"
            required
          />
          <p id="cpf-error" class="hidden text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
            <i data-lucide="alert-circle" class="w-3.5 h-3.5"></i>
            <span id="cpf-error-text"></span>
          </p>
        </div>

        <button
          type="submit"
          id="login-cpf-submit-btn"
          class="w-full flex items-center justify-center py-4 bg-royal-blue hover:bg-royal-blue-light text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-royal-blue/10 h-[52px] active:scale-[0.99] disabled:opacity-75 mt-6 cursor-pointer"
        >
          <span>Continuar</span>
        </button>
      </form>

      <div class="mt-6 text-center">
        <span class="text-xs text-gray-500">Ainda não possui login? </span>
        <button
          id="btn-goto-register"
          class="text-xs font-bold text-royal-blue hover:text-royal-blue-light focus:outline-none hover:underline cursor-pointer"
        >
          Criar cadastro
        </button>
      </div>
    </div>
  `;
}

function getLoginPasswordTpl() {
  const alerted = transitionAlert ? `
    <div class="mb-5 bg-blue-50 text-blue-800 p-3.5 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs font-medium leading-relaxed">
      <i data-lucide="info" class="w-4 h-4 text-royal-blue shrink-0 mt-0.5"></i>
      <span>${transitionAlert}</span>
    </div>
  ` : '';

  return `
    <div class="text-gray-900 animate-[fadeInUp_0.4s_ease-out]">
      <div class="flex items-center gap-2 mb-5">
        <button 
          id="btn-back-to-cpf"
          class="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900 focus:outline-none flex items-center"
          aria-label="Voltar para CPF"
        >
          <i data-lucide="arrow-left" class="w-5 h-5"></i>
        </button>
        <span class="text-xs font-bold uppercase tracking-wider text-gray-400">Voltar</span>
      </div>

      <div class="mb-6">
        <h2 class="text-2xl font-bold font-display text-gray-950 tracking-tight">
          Acesse sua conta
        </h2>
        <p class="text-sm text-gray-500 mt-1">
          Informe sua senha securitária cadastrada
        </p>
      </div>

      ${alerted}

      <div class="mb-5 bg-gray-50 border border-gray-100 p-3 rounded-xl flex items-center justify-between">
        <div>
          <span class="block text-[10px] font-bold uppercase tracking-wider text-gray-400">CPF Identificado</span>
          <span class="text-sm font-mono font-bold text-gray-800">${formatCPF(transitionCpf)}</span>
        </div>
        <button 
          id="btn-change-cpf"
          class="text-xs font-bold text-royal-blue hover:text-royal-blue-light hover:underline"
        >
          Alterar
        </button>
      </div>

      <form id="login-password-form" class="space-y-4">
        <div>
          <div class="flex justify-between items-center mb-1.5">
            <label for="login-password-input" class="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Senha
            </label>
            <button
              type="button"
              id="btn-goto-forgot"
              class="text-xs text-royal-blue hover:text-royal-blue-light font-semibold underline-offset-2 hover:underline focus:outline-none cursor-pointer"
            >
              Esqueci minha senha
            </button>
          </div>
          <div class="relative">
            <input
              id="login-password-input"
              type="password"
              placeholder="Digite sua senha"
              class="w-full pl-4 pr-11 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white focus:border-royal-blue focus:ring-royal-blue/10 transition-all"
              required
              autofocus
            />
            <button
              type="button"
              id="btn-toggle-login-pass"
              class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200/50 transition-colors"
            >
              <i data-lucide="eye" class="w-4.5 h-4.5" id="login-pass-eye-icon"></i>
            </button>
          </div>
          <p id="password-error" class="hidden text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
            <i data-lucide="alert-circle" class="w-3.5 h-3.5"></i>
            <span id="password-error-text"></span>
          </p>
        </div>

        <button
          type="submit"
          id="login-submit-btn"
          class="w-full flex items-center justify-center py-4 bg-royal-blue hover:bg-royal-blue-light text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-royal-blue/10 h-[52px] active:scale-[0.99] disabled:opacity-75 mt-6 cursor-pointer"
        >
          <span>Entrar</span>
        </button>
      </form>
    </div>
  `;
}

function getForgotPasswordTpl() {
  return `
    <div class="text-gray-900 animate-[fadeInUp_0.4s_ease-out]">
      <h2 class="text-2xl font-bold font-display text-gray-900 tracking-tight">
        Recuperar senha
      </h2>
      <p class="text-sm text-gray-500 mt-1 mb-6">
        Preencha com o e-mail de sua conta para recuperar sua senha.
      </p>

      <div id="forgot-success-block" class="hidden bg-emerald-50 text-emerald-800 p-5 rounded-2xl border border-emerald-100 flex flex-col items-center text-center">
        <i data-lucide="check-circle-2" class="text-emerald-500 w-12 h-12 mb-3"></i>
        <span class="font-semibold text-base">Solicitação enviada</span>
        <span class="text-xs text-emerald-600 mt-1 max-w-[280px]">
          Solicitação de redefinição processada para <strong id="forgot-confirmed-email"></strong>. Siga as orientações na tela.
        </span>
        <button
          id="btn-forgot-back-login"
          class="mt-6 w-full py-3 bg-royal-blue text-white font-medium rounded-xl hover:bg-royal-blue-light transition-all shadow-md active:scale-[0.98]"
        >
          Voltar para o login
        </button>
      </div>

      <form id="forgot-form" class="space-y-4">
        <div>
          <label for="forgot-email-input" class="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
            Seu e-mail cadastrado
          </label>
          <input
            id="forgot-email-input"
            type="email"
            placeholder="exemplo@vtmcred.com.br"
            class="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white focus:border-royal-blue focus:ring-royal-blue/10 transition-all"
            required
          />
          <p id="forgot-error" class="hidden text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
            <i data-lucide="alert-circle" class="w-3.5 h-3.5"></i>
            <span id="forgot-error-text"></span>
          </p>
        </div>

        <button
          type="submit"
          id="forgot-submit-btn"
          class="w-full flex items-center justify-center py-4 bg-royal-blue hover:bg-royal-blue-light text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-royal-blue/10 active:scale-[0.99] disabled:opacity-50 mt-2 h-[52px]"
        >
          <span>Recuperar minha senha</span>
        </button>

        <button
          type="button"
          id="btn-forgot-cancel"
          class="w-full text-center py-2 text-sm font-semibold text-royal-blue hover:text-royal-blue-light transition-colors mt-2"
        >
          Voltar para o login
        </button>
      </form>
    </div>
  `;
}

function getRegisterCpfTpl() {
  return `
    <div class="text-gray-900 animate-[fadeInUp_0.4s_ease-out]">
      <div class="mb-5">
        <h2 class="text-2xl font-bold font-display text-gray-950 tracking-tight">
          Criar cadastro
        </h2>
        <p class="text-sm text-gray-500 mt-1">
          Informe seu CPF para continuar no portal
        </p>
      </div>

      <form id="register-cpf-form" class="space-y-4">
        <div>
          <label for="reg-cpf-input" class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
            Seu CPF
          </label>
          <input
            id="reg-cpf-input"
            type="text"
            inputmode="numeric"
            placeholder="000.000.000-00"
            value="${transitionCpf ? formatCPF(transitionCpf) : ''}"
            class="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 font-mono focus:outline-none focus:ring-2 focus:bg-white focus:border-royal-blue focus:ring-royal-blue/10 transition-all"
            required
            autofocus
          />
          <p id="reg-cpf-error" class="hidden text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
            <i data-lucide="alert-circle" class="w-3.5 h-3.5"></i>
            <span id="reg-cpf-error-text"></span>
          </p>
        </div>

        <button
          type="submit"
          id="reg-cpf-submit-btn"
          class="w-full flex items-center justify-center py-4 bg-royal-blue hover:bg-royal-blue-light text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-royal-blue/10 h-[52px] active:scale-[0.99] disabled:opacity-75 mt-6 cursor-pointer"
        >
          <span>Continuar</span>
        </button>
      </form>

      <div class="mt-5 text-center">
        <span class="text-xs text-gray-500">Já possui uma conta? </span>
        <button
          id="btn-goto-login"
          class="text-xs font-bold text-royal-blue hover:text-royal-blue-light focus:outline-none hover:underline cursor-pointer"
        >
          Já tenho conta
        </button>
      </div>
    </div>
  `;
}

function getRegisterDetailsTpl() {
  return `
    <div class="text-gray-900 animate-[fadeInUp_0.4s_ease-out]">
      <div class="flex items-center gap-2 mb-5">
        <button 
          id="btn-back-to-reg-cpf"
          class="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-950 focus:outline-none flex items-center"
          aria-label="Voltar para CPF"
        >
          <i data-lucide="arrow-left" class="w-5 h-5"></i>
        </button>
        <span class="text-xs font-bold uppercase tracking-wider text-gray-400">Voltar</span>
      </div>

      <div class="mb-5">
        <h2 class="text-2xl font-bold font-display text-gray-950 tracking-tight">
          Criar cadastro
        </h2>
        <p class="text-sm text-gray-500 mt-1">
          Preencha seus dados para acessar o portal
        </p>
      </div>

      <div class="mb-5 bg-gray-50 border border-gray-100 p-3 rounded-xl flex items-center justify-between">
        <div>
          <span class="block text-[10px] font-bold uppercase tracking-wider text-gray-400">CPF Verificado</span>
          <span class="text-sm font-mono font-bold text-gray-800">${formatCPF(transitionCpf)}</span>
        </div>
        <button 
          id="btn-change-reg-cpf"
          class="text-xs font-bold text-royal-blue hover:text-royal-blue-light hover:underline"
        >
          Alterar
        </button>
      </div>

      <form id="register-details-form" class="space-y-4">
        <!-- Name Input -->
        <div>
          <label for="reg-name-input" class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
            Nome completo
          </label>
          <input
            id="reg-name-input"
            type="text"
            placeholder="Seu nome e sobrenome"
            value="${cachedRegisterData.name}"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white focus:border-royal-blue focus:ring-royal-blue/10 transition-all"
            required
            autofocus
          />
          <p id="err-name" class="hidden text-xs text-red-500 mt-1 flex items-center gap-1 font-medium"></p>
        </div>

        <!-- Phone Input -->
        <div>
          <label for="reg-phone-input" class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
            Telefone
          </label>
          <input
            id="reg-phone-input"
            type="tel"
            placeholder="(99) 99999-9999"
            value="${cachedRegisterData.phone}"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white focus:border-royal-blue focus:ring-royal-blue/10 transition-all"
            required
          />
          <p id="err-phone" class="hidden text-xs text-red-500 mt-1 flex items-center gap-1 font-medium"></p>
        </div>

        <!-- Email Input -->
        <div>
          <label for="reg-email-input" class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
            E-mail
          </label>
          <input
            id="reg-email-input"
            type="email"
            placeholder="jose@exemplo.com.br"
            value="${cachedRegisterData.email}"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white focus:border-royal-blue focus:ring-royal-blue/10 transition-all"
            autocomplete="email"
            required
          />
          <p id="err-email" class="hidden text-xs text-red-500 mt-1 flex items-center gap-1 font-medium"></p>
        </div>

        <!-- Passwords side-by-side on sm -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Password -->
          <div>
            <label for="reg-password-input" class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Senha
            </label>
            <div class="relative">
              <input
                id="reg-password-input"
                type="password"
                placeholder="No mínimo 6 dígitos"
                value="${cachedRegisterData.password}"
                class="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white focus:border-royal-blue focus:ring-royal-blue/10 transition-all"
                required
              />
              <button
                type="button"
                id="btn-toggle-reg-pass"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200/50 transition-colors"
              >
                <i data-lucide="eye" class="w-4 h-4" id="reg-pass-eye"></i>
              </button>
            </div>
            <p id="err-pass" class="hidden text-xs text-red-500 mt-1 flex items-center gap-1 font-medium"></p>
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="reg-confirmpassword-input" class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Confirmar senha
            </label>
            <div class="relative">
              <input
                id="reg-confirmpassword-input"
                type="password"
                placeholder="Repita sua senha"
                value="${cachedRegisterData.confirmPassword}"
                class="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white focus:border-royal-blue focus:ring-royal-blue/10 transition-all"
                required
              />
              <button
                type="button"
                id="btn-toggle-reg-confpass"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200/50 transition-colors"
              >
                <i data-lucide="eye" class="w-4 h-4" id="reg-confpass-eye"></i>
              </button>
            </div>
            <p id="err-confpass" class="hidden text-xs text-red-500 mt-1 flex items-center gap-1 font-medium"></p>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          id="reg-submit-btn"
          class="w-full flex items-center justify-center py-4 bg-royal-blue hover:bg-royal-blue-light text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-royal-blue/10 h-[52px] active:scale-[0.99] disabled:opacity-75 mt-6 cursor-pointer"
        >
          <span>Criar conta</span>
        </button>
      </form>
    </div>
  `;
}

// 8. Event Binding Mechanics
function bindLoginCpfEvents() {
  const form = document.getElementById('login-cpf-form');
  const input = document.getElementById('login-cpf-input');
  const errBlock = document.getElementById('cpf-error');
  const errText = document.getElementById('cpf-error-text');
  const submitBtn = document.getElementById('login-cpf-submit-btn');
  const gotoRegBtn = document.getElementById('btn-goto-register');

  // Input Formatting
  input.addEventListener('input', (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    input.value = formatCPF(rawVal);
    errBlock.classList.add('hidden');
  });

  // Switch to Register (with CPF context)
  gotoRegBtn.addEventListener('click', () => {
    transitionCpf = input.value.replace(/\D/g, '');
    openSheet('register');
  });

  // Handle submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const cleanCpf = input.value.replace(/\D/g, '');
    
    if (!cleanCpf) {
      showError(errBlock, errText, 'Informe seu CPF para continuar');
      return;
    }
    if (!validateCPFMath(cleanCpf)) {
      showError(errBlock, errText, 'Informe um CPF válido (11 dígitos)');
      return;
    }

    // Loading Animation
    setLoading(submitBtn, true, 'Buscando conta...');

    setTimeout(() => {
      setLoading(submitBtn, false, 'Continuar');
      transitionCpf = cleanCpf;
      
      if (isCPFRegistered(cleanCpf)) {
        loginStep = 'password';
        renderForm();
      } else {
        // Redirection to Registration Form (smart flow)
        openSheet('register');
      }
    }, 900);
  });
}

function bindLoginPasswordEvents() {
  const form = document.getElementById('login-password-form');
  const input = document.getElementById('login-password-input');
  const errBlock = document.getElementById('password-error');
  const errText = document.getElementById('password-error-text');
  const submitBtn = document.getElementById('login-submit-btn');
  const backBtn = document.getElementById('btn-back-to-cpf');
  const changeCpfBtn = document.getElementById('btn-change-cpf');
  const gotoForgotBtn = document.getElementById('btn-goto-forgot');
  const togglePassBtn = document.getElementById('btn-toggle-login-pass');
  let passVisible = false;

  togglePassBtn.addEventListener('click', () => {
    passVisible = !passVisible;
    input.type = passVisible ? 'text' : 'password';
    const eyeIcon = document.getElementById('login-pass-eye-icon');
    if (eyeIcon) {
      eyeIcon.setAttribute('data-lucide', passVisible ? 'eye-off' : 'eye');
      lucide.createIcons();
    }
  });

  gotoForgotBtn.addEventListener('click', () => {
    loginStep = 'forgot';
    renderForm();
  });

  const goBack = () => {
    loginStep = 'cpf';
    renderForm();
  };

  backBtn.addEventListener('click', goBack);
  changeCpfBtn.addEventListener('click', goBack);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = input.value.trim();

    if (!password) {
      showError(errBlock, errText, 'Informe sua senha');
      return;
    }
    if (password.length < 6) {
      showError(errBlock, errText, 'A senha deve possuir no mínimo 6 caracteres');
      return;
    }

    // Retrieve user object from localStorage
    const savedUserStr = localStorage.getItem('vtmcred_user_' + transitionCpf);
    let userObj = null;
    if (savedUserStr) {
      userObj = JSON.parse(savedUserStr);
      if (userObj.password && userObj.password !== password) {
        showError(errBlock, errText, 'Senha incorreta. Verifique e tente novamente.');
        return;
      }
    } else {
      // Seeded CPF test account, create a dummy profile
      userObj = {
        name: 'Cliente Prime VTMCred',
        email: 'cliente@vtmcred.com.br',
        cpf: transitionCpf
      };
      localStorage.setItem('vtmcred_user_' + transitionCpf, JSON.stringify(userObj));
    }

    setLoading(submitBtn, true, 'Verificando...');

    setTimeout(() => {
      setLoading(submitBtn, false, 'Entrar');
      localStorage.setItem('vtmcred_current_user', JSON.stringify(userObj));
      currentUser = userObj;
      closeActiveSheet();
      showToast(`Olá! Acesso autorizado com sucesso.`, 'success');
      loadUserDashboard();
    }, 1200);
  });
}

function bindForgotPasswordEvents() {
  const form = document.getElementById('forgot-form');
  const emailInput = document.getElementById('forgot-email-input');
  const errBlock = document.getElementById('forgot-error');
  const errText = document.getElementById('forgot-error-text');
  const submitBtn = document.getElementById('forgot-submit-btn');
  const cancelBtn = document.getElementById('btn-forgot-cancel');

  const backToLogin = () => {
    loginStep = 'password';
    renderForm();
  };

  cancelBtn.addEventListener('click', backToLogin);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError(errBlock, errText, 'Por favor, informe um e-mail válido para a recuperação');
      return;
    }

    setLoading(submitBtn, true, 'Enviando link...');

    setTimeout(() => {
      setLoading(submitBtn, false, 'Recuperar minha senha');
      
      // Hide form elements and display success block
      form.classList.add('hidden');
      const successBlock = document.getElementById('forgot-success-block');
      successBlock.classList.remove('hidden');
      document.getElementById('forgot-confirmed-email').textContent = email;

      document.getElementById('btn-forgot-back-login').addEventListener('click', () => {
        loginStep = 'password';
        renderForm();
      });
    }, 1200);
  });
}

function bindRegisterCpfEvents() {
  const form = document.getElementById('register-cpf-form');
  const input = document.getElementById('reg-cpf-input');
  const errBlock = document.getElementById('reg-cpf-error');
  const errText = document.getElementById('reg-cpf-error-text');
  const submitBtn = document.getElementById('reg-cpf-submit-btn');
  const gotoLoginBtn = document.getElementById('btn-goto-login');

  input.addEventListener('input', (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    input.value = formatCPF(rawVal);
    errBlock.classList.add('hidden');
  });

  gotoLoginBtn.addEventListener('click', () => {
    transitionCpf = input.value.replace(/\D/g, '');
    openSheet('login');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const cleanCPF = input.value.replace(/\D/g, '');

    if (!cleanCPF) {
      showError(errBlock, errText, 'O CPF é obrigatório');
      return;
    }
    if (!validateCPFMath(cleanCPF)) {
      showError(errBlock, errText, 'Informe um CPF válido (11 dígitos)');
      return;
    }

    setLoading(submitBtn, true, 'Verificando...');

    setTimeout(() => {
      setLoading(submitBtn, false, 'Continuar');
      transitionCpf = cleanCPF;
      
      if (isCPFRegistered(cleanCPF)) {
        // Redirection to Login with Info Warning (smart flow)
        transitionAlert = "Este CPF já possui cadastro. Insira sua senha para acessar.";
        openSheet('login');
      } else {
        // Direct route to typing personal details
        registerStep = 'details';
        renderForm();
      }
    }, 900);
  });
}

function bindRegisterDetailsEvents() {
  const form = document.getElementById('register-details-form');
  const nameInput = document.getElementById('reg-name-input');
  const phoneInput = document.getElementById('reg-phone-input');
  const emailInput = document.getElementById('reg-email-input');
  const passInput = document.getElementById('reg-password-input');
  const confPassInput = document.getElementById('reg-confirmpassword-input');
  const submitBtn = document.getElementById('reg-submit-btn');

  const backBtn = document.getElementById('btn-back-to-reg-cpf');
  const changeCpfBtn = document.getElementById('btn-change-reg-cpf');

  // Load from caches
  nameInput.addEventListener('input', (e) => {
    // Letters, spaces and Brazilian accents
    const sanitizedVal = e.target.value.replace(/[^a-zA-ZáéíóúàèìòùâêîôûãõçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ\s]/gi, '');
    nameInput.value = sanitizedVal;
    cachedRegisterData.name = sanitizedVal;
    clearFieldErr('err-name');
  });

  phoneInput.addEventListener('input', (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    phoneInput.value = formatPhone(rawVal);
    cachedRegisterData.phone = phoneInput.value;
    clearFieldErr('err-phone');
  });

  emailInput.addEventListener('input', () => {
    cachedRegisterData.email = emailInput.value;
    clearFieldErr('err-email');
  });

  passInput.addEventListener('input', () => {
    cachedRegisterData.password = passInput.value;
    clearFieldErr('err-pass');
  });

  confPassInput.addEventListener('input', () => {
    cachedRegisterData.confirmPassword = confPassInput.value;
    clearFieldErr('err-confpass');
  });

  // Eye Toggles
  let passVisible = false;
  document.getElementById('btn-toggle-reg-pass').addEventListener('click', () => {
    passVisible = !passVisible;
    passInput.type = passVisible ? 'text' : 'password';
    document.getElementById('reg-pass-eye').setAttribute('data-lucide', passVisible ? 'eye-off' : 'eye');
    lucide.createIcons();
  });

  let confPassVisible = false;
  document.getElementById('btn-toggle-reg-confpass').addEventListener('click', () => {
    confPassVisible = !confPassVisible;
    confPassInput.type = confPassVisible ? 'text' : 'password';
    document.getElementById('reg-confpass-eye').setAttribute('data-lucide', confPassVisible ? 'eye-off' : 'eye');
    lucide.createIcons();
  });

  const goBack = () => {
    registerStep = 'cpf';
    renderForm();
  };

  backBtn.addEventListener('click', goBack);
  changeCpfBtn.addEventListener('click', goBack);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let hasErrors = false;

    // Validate Name
    const trimmedName = nameInput.value.trim();
    if (!trimmedName) {
      showFieldErr('err-name', 'Informe seu nome completo');
      hasErrors = true;
    } else if (!trimmedName.includes(' ') || trimmedName.split(/\s+/).filter(Boolean).length < 2) {
      showFieldErr('err-name', 'Informe seu nome e sobrenome completo');
      hasErrors = true;
    }

    // Validate Phone
    const cleanPhone = phoneInput.value.replace(/\D/g, '');
    if (!cleanPhone) {
      showFieldErr('err-phone', 'O telefone é obrigatório');
      hasErrors = true;
    } else if (cleanPhone.length < 10) {
      showFieldErr('err-phone', 'Informe um telefone válido com o DDD');
      hasErrors = true;
    }

    // Validate Email
    const emailStr = emailInput.value.trim();
    if (!emailStr) {
      showFieldErr('err-email', 'O e-mail é obrigatório');
      hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
      showFieldErr('err-email', 'Informe um e-mail com formato válido');
      hasErrors = true;
    }

    // Validate Password
    const password = passInput.value;
    if (!password) {
      showFieldErr('err-pass', 'A senha é obrigatória');
      hasErrors = true;
    } else if (password.length < 6) {
      showFieldErr('err-pass', 'A senha precisa de no mínimo 6 caracteres');
      hasErrors = true;
    }

    // Validate Confirm Password
    const confirmPassword = confPassInput.value;
    if (!confirmPassword) {
      showFieldErr('err-confpass', 'A confirmação de senha é obrigatória');
      hasErrors = true;
    } else if (password !== confirmPassword) {
      showFieldErr('err-confpass', 'As senhas devem ser idênticas');
      hasErrors = true;
    }

    if (hasErrors) return;

    setLoading(submitBtn, true, 'Criando sua conta...');

    setTimeout(() => {
      setLoading(submitBtn, false, 'Criar conta');
      registerNewCPF(transitionCpf);
      
      const userObj = {
        name: trimmedName,
        email: emailStr,
        cpf: transitionCpf,
        phone: cleanPhone,
        password: password
      };
      
      // Save credentials and current session in LocalStorage
      localStorage.setItem('vtmcred_user_' + transitionCpf, JSON.stringify(userObj));
      localStorage.setItem('vtmcred_current_user', JSON.stringify(userObj));
      currentUser = userObj;

      closeActiveSheet();
      showToast('Cadastro realizado com sucesso.', 'success');
      loadUserDashboard();
    }, 1500);
  });
}

// 9. Input Feedback Helpers
function showError(blockNode, textNode, message) {
  textNode.textContent = message;
  blockNode.classList.remove('hidden');
}

function showFieldErr(id, message) {
  const node = document.getElementById(id);
  if (node) {
    node.innerHTML = `
      <i data-lucide="alert-circle" class="w-3.5 h-3.5 mt-0.5 shrink-0"></i>
      <span>${message}</span>
    `;
    node.classList.remove('hidden');
    lucide.createIcons();
  }
}

function clearFieldErr(id) {
  const node = document.getElementById(id);
  if (node) {
    node.classList.add('hidden');
    node.innerHTML = '';
  }
}

function setLoading(button, isLoading, label) {
  button.disabled = isLoading;
  if (isLoading) {
    button.innerHTML = `
      <div class="flex items-center justify-center">
        <!-- SVG Spinner -->
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>${label}</span>
      </div>
    `;
  } else {
    button.innerHTML = `<span>${label}</span>`;
  }
}

// 10. Beautiful Toast notifications
let toastTimeout = null;
function showToast(message, type = 'success') {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  const toastText = document.getElementById('toast-text');
  const toastIcon = document.getElementById('toast-icon');
  const toastTitle = document.getElementById('toast-title');

  toastText.textContent = message;
  toastTitle.textContent = type === 'success' ? 'Notificação VTM' : 'Informação';
  
  if (type === 'success') {
    toastIcon.innerHTML = `<i data-lucide="check-circle-2" class="w-[22px] h-[22px] text-emerald-500 shrink-0 mt-0.5"></i>`;
  } else {
    toastIcon.innerHTML = `<i data-lucide="info" class="w-[22px] h-[22px] text-royal-blue-light shrink-0 mt-0.5"></i>`;
  }

  lucide.createIcons();

  toastNode.classList.remove('hidden', 'opacity-0', '-translate-y-4');
  toastNode.classList.add('flex', 'opacity-100', 'translate-y-0');

  toastTimeout = setTimeout(() => {
    toastNode.classList.add('opacity-0', '-translate-y-4');
    setTimeout(() => {
      toastNode.classList.add('hidden');
    }, 400);
  }, 4500);
}

// 11. Custom Simulated Dashboard Manager and Rendering Engine
function loadUserDashboard() {
  if (!currentUser) return;
  
  // Hide login / primary portal screen
  document.getElementById('main-viewport-container').classList.add('hidden');
  
  // Display dashboard container
  const dashViewport = document.getElementById('dashboard-viewport');
  dashViewport.classList.remove('hidden');
  
  // Allow system-level vertical scrolling
  document.body.style.overflow = '';
  
  renderDashboard();
}

function getInitials(fullName) {
  if (!fullName) return 'CL';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return 'CL';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getFirstName(fullName) {
  if (!fullName) return 'Cliente';
  return fullName.trim().split(/\s+/)[0];
}

function renderDashboard() {
  const dashViewport = document.getElementById('dashboard-viewport');
  if (!dashViewport) return;

  const initials = getInitials(currentUser.name);
  const firstName = getFirstName(currentUser.name);
  const maskedCpf = formatCPF(currentUser.cpf);
  
  let tabContentHtml = '';
  
  if (activeTab === 'inicio') {
    tabContentHtml = `
      <div class="space-y-6 animate-[fadeInUp_0.3s_ease-out] w-full max-w-md mx-auto">
        <!-- Resumo atual Card highlight -->
        <div class="bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] relative overflow-hidden">
          <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-royal-blue/5 to-transparent rounded-bl-full"></div>
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-gray-300"></span>
              Nenhum empréstimo ativo
            </span>
            <span class="text-[11px] font-mono font-bold px-2 py-0.5 bg-gray-100 text-gray-400 rounded-lg">
              Status: Livre
            </span>
          </div>

          <div class="space-y-3.5">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="block text-[11px] text-gray-400 font-semibold mb-0.5">Empréstimos ativos</span>
                <span class="text-base font-bold text-slate-800">0</span>
              </div>
              <div>
                <span class="block text-[11px] text-gray-400 font-semibold mb-0.5">Próxima parcela</span>
                <span class="text-base font-bold text-[#1E51C8]">R$ 0,00</span>
              </div>
            </div>

            <hr class="border-gray-100" />

            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="block text-[11px] text-gray-400 font-semibold mb-0.5">Vencimento</span>
                <span class="text-sm font-semibold text-slate-500">--</span>
              </div>
              <div>
                <span class="block text-[11px] text-gray-400 font-semibold mb-0.5">Bandeira do contrato</span>
                <span class="text-xs font-bold font-mono text-royal-blue bg-royal-blue/5 px-1.5 py-0.5 rounded inline-block">
                  VTMCred PRO
                </span>
              </div>
            </div>
          </div>

          <!-- Status Notice -->
          <div class="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2.5">
            <i data-lucide="help-circle" class="text-slate-400 shrink-0 w-4 h-4"></i>
            <span class="text-xs text-slate-500">
              Você ainda não possui empréstimos cadastrados.
            </span>
          </div>
        </div>

        <!-- 2x2 Core Action Cards -->
        <div>
          <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 px-1">Serviços e Soluções</h3>
          <div class="grid grid-cols-2 gap-3.5">
            <!-- Card 1: Meus Empréstimos -->
            <button 
              id="dash-card-loans"
              class="bg-white hover:bg-gray-50/50 p-4 rounded-3xl border border-gray-150 flex flex-col items-start justify-between min-h-[125px] text-left transition-all hover:shadow-md cursor-pointer group"
            >
              <div class="p-2.5 rounded-2xl bg-royal-blue/5 text-[#1E51C8] group-hover:bg-royal-blue/10 transition-colors">
                <i data-lucide="credit-card" class="w-5 h-5"></i>
              </div>
              <div>
                <span class="block text-slate-900 font-semibold text-sm leading-tight mb-1">Meus Empréstimos</span>
                <span class="text-[10px] text-gray-400">Ver contratos ativos</span>
              </div>
            </button>

            <!-- Card 2: Minhas Parcelas -->
            <button 
              id="dash-card-installments"
              class="bg-white hover:bg-gray-50/50 p-4 rounded-3xl border border-gray-150 flex flex-col items-start justify-between min-h-[125px] text-left transition-all hover:shadow-md cursor-pointer group"
            >
              <div class="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100/70 transition-colors">
                <i data-lucide="file-text" class="w-5 h-5"></i>
              </div>
              <div>
                <span class="block text-slate-900 font-semibold text-sm leading-tight mb-1">Minhas Parcelas</span>
                <span class="text-[10px] text-gray-400">Gerenciar vencimentos</span>
              </div>
            </button>

            <!-- Card 3: Solicitar Análise -->
            <button 
              id="dash-card-analysis"
              class="bg-white hover:bg-gray-50/50 p-4 rounded-3xl border border-gray-150 flex flex-col items-start justify-between min-h-[125px] text-left transition-all hover:shadow-md cursor-pointer group"
            >
              <div class="p-2.5 rounded-2xl bg-orange-50 text-orange-600 group-hover:bg-orange-100/70 transition-colors">
                <i data-lucide="trending-up" class="w-5 h-5"></i>
              </div>
              <div>
                <span class="block text-slate-900 font-semibold text-sm leading-tight mb-1">Solicitar Análise</span>
                <span class="text-[10px] text-gray-400">Novo pedido de crédito</span>
              </div>
            </button>

            <!-- Card 4: Falar com a VTMCred -->
            <button 
              id="dash-card-support"
              class="bg-white hover:bg-gray-50/50 p-4 rounded-3xl border border-gray-150 flex flex-col items-start justify-between min-h-[125px] text-left transition-all hover:shadow-md cursor-pointer group"
            >
              <div class="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100/70 transition-colors">
                <i data-lucide="message-square" class="w-5 h-5"></i>
              </div>
              <div>
                <span class="block text-slate-900 font-semibold text-sm leading-tight mb-1">Falar conosco</span>
                <span class="text-[10px] text-gray-400">Suporte e atendimento</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Large Highlight Card -->
        <div class="bg-sky-50 border border-sky-100 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div class="absolute -right-3 -bottom-3 w-24 h-24 opacity-10 text-royal-blue">
            <i data-lucide="shield-check" class="w-full h-full"></i>
          </div>
          <div class="relative z-10 space-y-2">
            <span class="inline-block text-[9px] font-bold text-royal-blue bg-royal-blue/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Suporte Digital
            </span>
            <h4 class="text-base font-bold text-slate-800 leading-tight">
              Precisa acompanhar seu crédito?
            </h4>
            <p class="text-xs text-slate-600 leading-relaxed max-w-[85%]">
              Veja suas parcelas, vencimentos e histórico em um só lugar.
            </p>
          </div>
          <button 
            id="dash-banner-facilitator"
            class="mt-4 flex items-center gap-1 text-xs font-bold text-royal-blue hover:text-royal-blue-light transition-colors text-left border-0 bg-transparent cursor-pointer"
          >
            Conhecer as facilidades do portal <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>

        <!-- Area de Resumo Financeiro -->
        <div class="bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-4">
          <h4 class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Resumo do Contrato</h4>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="block text-[11px] text-gray-400 font-medium">Total contratado</span>
              <span class="text-base font-extrabold text-slate-900">R$ 0,00</span>
            </div>
            <div>
              <span class="block text-[11px] text-gray-400 font-medium">Saldo em aberto</span>
              <span class="text-base font-extrabold text-slate-900">R$ 0,00</span>
            </div>
          </div>

          <hr class="border-gray-100" />

          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="block text-[11px] text-gray-400 font-medium">Parcelas pagas</span>
              <span class="text-base font-bold text-slate-700">0</span>
            </div>
            <div>
              <span class="block text-[11px] text-gray-400 font-medium">Parcelas em aberto</span>
              <span class="text-base font-bold text-slate-700">0</span>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (activeTab === 'emprestimos') {
    tabContentHtml = `
      <div class="space-y-6 animate-[fadeInUp_0.3s_ease-out] w-full max-w-md mx-auto">
        <div class="flex items-center justify-between mb-1">
          <div>
            <h3 class="text-xl font-bold text-slate-900">Meus Empréstimos</h3>
            <p class="text-xs text-gray-400">Histórico de contratos securitários</p>
          </div>
          <span class="text-xs bg-royal-blue/5 text-royal-blue font-bold px-2.5 py-1 rounded-full">
            Livre para proposta
          </span>
        </div>

        <!-- Central Off-White Empty state illustrative block -->
        <div class="bg-white rounded-3xl border border-gray-100 p-8 text-center flex flex-col items-center justify-center space-y-4 min-h-[300px]">
          <div class="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <i data-lucide="credit-card" class="w-7 h-7"></i>
          </div>
          <div>
            <h4 class="font-bold text-slate-800 text-base">Nenhum empréstimo cadastrado</h4>
            <p class="text-xs text-slate-500 mt-1 max-w-[260px] mx-auto leading-relaxed">
              Você ainda não possui empréstimos cadastrados. Clique no botão abaixo para conversar no suporte ou solicitar uma análise.
            </p>
          </div>
          <div class="pt-2 w-full max-w-[200px] mx-auto">
            <button 
              id="dash-sub-request-analysis"
              class="w-full py-3 px-4 bg-royal-blue text-white rounded-xl font-semibold text-xs transition-colors hover:bg-royal-blue-light cursor-pointer border-0"
            >
              Fazer uma nova solicitação
            </button>
          </div>
        </div>
      </div>
    `;
  } else if (activeTab === 'parcelas') {
    tabContentHtml = `
      <div class="space-y-6 animate-[fadeInUp_0.3s_ease-out] w-full max-w-md mx-auto">
        <div class="mb-1">
          <h3 class="text-xl font-bold text-slate-900">Minhas Parcelas</h3>
          <p class="text-xs text-gray-400">Gestão e liquidação de parcelas</p>
        </div>

        <div class="bg-white rounded-3xl border border-gray-100 p-8 text-center flex flex-col items-center justify-center space-y-4 min-h-[300px]">
          <div class="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <i data-lucide="file-text" class="w-7 h-7"></i>
          </div>
          <div>
            <h4 class="font-bold text-slate-800 text-base">Nenhuma parcela em aberto</h4>
            <p class="text-xs text-slate-500 mt-1 max-w-[260px] mx-auto leading-relaxed">
              Você não possui faturas, faturamentos, boletos ou parcelas em aberto registradas no portal.
            </p>
          </div>
          <div class="pt-2 flex justify-center">
            <span class="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-1">
              <i data-lucide="check-circle" class="w-3.5 h-3.5 shrink-0"></i> Suas obrigações estão em dia
            </span>
          </div>
        </div>
      </div>
    `;
  } else if (activeTab === 'perfil') {
    tabContentHtml = `
      <div class="space-y-6 animate-[fadeInUp_0.3s_ease-out] w-full max-w-md mx-auto">
        <div class="mb-1">
          <h3 class="text-xl font-bold text-slate-900">Meus Dados</h3>
          <p class="text-xs text-gray-400">Informações cadastradas no portal de cliente</p>
        </div>

        <!-- User Profile Card -->
        <div class="bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-4">
          <div class="flex items-center gap-3 pb-3 border-b border-gray-100 w-full">
            <div class="w-12 h-12 rounded-full bg-royal-blue/15 flex items-center justify-center text-royal-blue font-extrabold text-base shrink-0">
              ${initials}
            </div>
            <div class="overflow-hidden">
              <h4 class="font-bold text-slate-900 text-sm leading-tight truncate">${currentUser.name}</h4>
              <span class="text-xs text-gray-400 font-medium">Cliente VTMCred Regular</span>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <span class="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">CPF do Titular</span>
              <span class="text-xs font-mono font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">${maskedCpf}</span>
            </div>

            <div>
              <span class="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">E-mail Cadastrado</span>
              <span class="text-xs text-slate-700 font-medium block break-all">${currentUser.email}</span>
            </div>

            <div>
              <span class="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Grau de Segurança</span>
              <span class="text-xs text-emerald-600 font-bold flex items-center gap-1.5 pt-0.5">
                <i data-lucide="shield-check" class="w-4 h-4"></i> Dados criptografados no servidor seguro
              </span>
            </div>
          </div>
        </div>

        <!-- Quick Legal notes -->
        <div class="text-[10px] text-gray-400 leading-relaxed space-y-2 px-1">
          <p>
            VTMCred respeita as diretrizes da Lei Geral de Proteção de Dados (LGPD). Todos os acessos e logs de ações são monitorados para sua proteção financeira.
          </p>
          <p>
            Estampas temporais de auditoria em vigor. Última sincronização de sistema: ${new Date().toLocaleDateString('pt-BR')}.
          </p>
        </div>
      </div>
    `;
  }

  // Modals HTML overlay rendering
  let modalsHtml = '';
  
  if (showAnalysisModal) {
    modalsHtml += `
      <div id="analysis-modal-backdrop" class="fixed inset-0 bg-black/60 z-[9999] flex items-end justify-center p-0 transition-opacity duration-300">
        <div class="bg-white rounded-t-3xl max-w-sm w-full p-6 text-slate-850 space-y-4 animate-[slideUp_0.25s_ease-out] shadow-2xl relative">
          <div class="flex items-center justify-between">
            <h3 class="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <i data-lucide="trending-up" class="text-royal-blue w-5 h-5"></i> Solicitar Análise
            </h3>
            <button 
              id="close-analysis-modal-btn"
              class="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none border-0 bg-transparent cursor-pointer"
            >
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <p class="text-xs text-slate-500 leading-relaxed">
            Nossa equipe utiliza dados estatísticos avançados de risco de crédito para formular propostas personalizadas. Informe o valor pretendido para nossa mesa técnica realizar um estudo.
          </p>

          <div>
            <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Valor Necessário</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">R$</span>
              <input 
                id="analysis-amount-input"
                type="number" 
                placeholder="Ex: 5000" 
                class="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-royal-blue/20 focus:border-royal-blue"
              />
            </div>
          </div>

          <button 
            id="submit-analysis-btn"
            class="w-full h-11 bg-royal-blue hover:bg-royal-blue-light text-white font-bold text-sm rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-md border-0"
          >
            Enviar proposta para estudo
          </button>
        </div>
      </div>
    `;
  }

  if (showSupportModal) {
    modalsHtml += `
      <div id="support-modal-backdrop" class="fixed inset-0 bg-black/60 z-[9999] flex items-end justify-center p-0 transition-opacity duration-300">
        <div class="bg-white rounded-t-3xl max-w-sm w-full p-6 text-slate-850 space-y-4 animate-[slideUp_0.25s_ease-out] shadow-2xl relative">
          <div class="flex items-center justify-between">
            <h3 class="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <i data-lucide="message-square" class="text-royal-blue w-5 h-5"></i> Canal de Atendimento
            </h3>
            <button 
              id="close-support-modal-btn"
              class="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none border-0 bg-transparent cursor-pointer"
            >
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <p class="text-xs text-slate-500 leading-relaxed">
            Nosso suporte é 100% humanizado e dedicado. Respondemos suas perguntas de forma direta e sem robôs.
          </p>

          <div class="space-y-3">
            <button 
              id="support-email-btn"
              class="w-full flex items-center justify-between p-3.5 bg-slate-50 border border-gray-100 rounded-xl hover:bg-slate-100 transition text-left cursor-pointer border-0"
            >
              <div>
                <span class="block text-xs font-bold text-slate-800">Suporte Técnico por E-mail</span>
                <span class="text-[10px] text-gray-400 box-border">suporte@vtmcred.com.br</span>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-gray-400"></i>
            </button>

            <button 
              id="support-whatsapp-btn"
              class="w-full flex items-center justify-between p-3.5 bg-[#25D366]/5 border border-[#25D366]/20 rounded-xl hover:bg-[#25D366]/10 transition text-left cursor-pointer border-0"
            >
              <div>
                <span class="block text-xs font-bold text-[#128C7E]">Central Executiva WhatsApp</span>
                <span class="text-[10px] text-green-600 shrink-0">Sua assessoria direta em tempo real</span>
              </div>
              <i data-lucide="chevron-right" class="w-4 h-4 text-[#128C7E]"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Dashboard structure layout
  dashViewport.innerHTML = `
    <!-- Sticky dynamic header -->
    <header class="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 z-50 px-5 py-4 flex items-center justify-between shadow-sm select-none">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-royal-blue/10 border border-royal-blue/20 flex items-center justify-center text-royal-blue font-extrabold text-sm tracking-wide shadow-inner">
          ${initials}
        </div>
        <div>
          <span class="block text-[9px] text-[#1E51C8] font-bold uppercase tracking-wider font-mono">Cliente Prime</span>
          <h2 class="text-sm font-bold text-slate-800 leading-none">Olá, ${firstName}</h2>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Notification bell button -->
        <button 
          id="dash-bell-btn"
          class="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-slate-900 transition-colors relative focus:outline-none cursor-pointer border-0 bg-transparent"
          aria-label="Notificações"
        >
          <i data-lucide="bell" class="w-5 h-5"></i>
          <span class="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#1E51C8]"></span>
        </button>

        <!-- Exit button -->
        <button 
          id="dash-logout-btn"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all border border-gray-100 hover:border-red-100 focus:outline-none cursor-pointer bg-white"
          aria-label="Sair"
        >
          <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
          <span>Sair</span>
        </button>
      </div>
    </header>

    <!-- Main dynamic page viewer content region -->
    <main class="flex-1 px-5 pt-6 max-w-md mx-auto w-full pb-20">
      ${tabContentHtml}
    </main>

    <!-- Floating premium bottom tab navigation menu bar wrapper -->
    <nav class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-150 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] px-3 py-2.5 flex items-center justify-around z-40 rounded-t-[1.4rem]">
      <!-- Tab 1: Inicio -->
      <button 
        id="tab-btn-inicio"
        class="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-2xl transition-all focus:outline-none cursor-pointer border-0 bg-transparent ${
          activeTab === 'inicio' ? 'text-royal-blue bg-royal-blue/5 font-extrabold' : 'text-gray-400 hover:text-gray-600'
        }"
      >
        <i data-lucide="home" class="w-5 h-5"></i>
        <span class="text-[10px] tracking-tight">Início</span>
      </button>

      <!-- Tab 2: Emprestimos -->
      <button 
        id="tab-btn-emprestimos"
        class="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-2xl transition-all focus:outline-none cursor-pointer border-0 bg-transparent ${
          activeTab === 'emprestimos' ? 'text-royal-blue bg-royal-blue/5 font-extrabold' : 'text-gray-400'
        }"
      >
        <i data-lucide="credit-card" class="w-5 h-5"></i>
        <span class="text-[10px] tracking-tight">Empréstimos</span>
      </button>

      <!-- Tab 3: Cancelas/Parcelas -->
      <button 
        id="tab-btn-parcelas"
        class="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-2xl transition-all focus:outline-none cursor-pointer border-0 bg-transparent ${
          activeTab === 'parcelas' ? 'text-royal-blue bg-royal-blue/5 font-extrabold' : 'text-gray-400'
        }"
      >
        <i data-lucide="clock" class="w-5 h-5"></i>
        <span class="text-[10px] tracking-tight">Parcelas</span>
      </button>

      <!-- Tab 4: Perfil -->
      <button 
        id="tab-btn-perfil"
        class="flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-2xl transition-all focus:outline-none cursor-pointer border-0 bg-transparent ${
          activeTab === 'perfil' ? 'text-royal-blue bg-royal-blue/5 font-extrabold' : 'text-gray-400'
        }"
      >
        <i data-lucide="user" class="w-5 h-5"></i>
        <span class="text-[10px] tracking-tight">Perfil</span>
      </button>
    </nav>

    <!-- Modal anchors block -->
    ${modalsHtml}
  `;

  // Materialise Lucide icons
  lucide.createIcons();

  // BIND EVENT LISTENERS SPECIFIC TO LOADED COMPONENTS
  document.getElementById('dash-logout-btn').addEventListener('click', handleLogout);
  document.getElementById('dash-bell-btn').addEventListener('click', () => {
    showToast("Nenhuma notificação nova no momento.", "info");
  });

  // Tab switching links
  document.getElementById('tab-btn-inicio').addEventListener('click', () => {
    activeTab = 'inicio';
    renderDashboard();
  });
  document.getElementById('tab-btn-emprestimos').addEventListener('click', () => {
    activeTab = 'emprestimos';
    renderDashboard();
  });
  document.getElementById('tab-btn-parcelas').addEventListener('click', () => {
    activeTab = 'parcelas';
    renderDashboard();
  });
  document.getElementById('tab-btn-perfil').addEventListener('click', () => {
    activeTab = 'perfil';
    renderDashboard();
  });

  // Tab-specific bindings
  if (activeTab === 'inicio') {
    document.getElementById('dash-card-loans').addEventListener('click', () => {
      activeTab = 'emprestimos';
      renderDashboard();
    });
    document.getElementById('dash-card-installments').addEventListener('click', () => {
      activeTab = 'parcelas';
      renderDashboard();
    });
    document.getElementById('dash-card-analysis').addEventListener('click', () => {
      showAnalysisModal = true;
      renderDashboard();
    });
    document.getElementById('dash-card-support').addEventListener('click', () => {
      showSupportModal = true;
      renderDashboard();
    });
    document.getElementById('dash-banner-facilitator').addEventListener('click', () => {
      showToast("Você já está na área de controle atual.", "info");
    });
  } else if (activeTab === 'emprestimos') {
    document.getElementById('dash-sub-request-analysis').addEventListener('click', () => {
      showAnalysisModal = true;
      renderDashboard();
    });
  }

  // Modal binding triggers
  if (showAnalysisModal) {
    document.getElementById('close-analysis-modal-btn').addEventListener('click', () => {
      showAnalysisModal = false;
      renderDashboard();
    });
    // Click outside backdrop
    document.getElementById('analysis-modal-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'analysis-modal-backdrop') {
        showAnalysisModal = false;
        renderDashboard();
      }
    });

    document.getElementById('submit-analysis-btn').addEventListener('click', () => {
      const amountInput = document.getElementById('analysis-amount-input');
      const amountValue = amountInput ? amountInput.value : '';

      showAnalysisModal = false;
      renderDashboard();
      
      const detailsMsg = amountValue ? ` para o valor de R$ ${parseFloat(amountValue).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : '';
      showToast(`Pedido enviado! Nossa equipe se comunicará por e-mail ou WhatsApp${detailsMsg}.`, 'success');
    });
  }

  if (showSupportModal) {
    document.getElementById('close-support-modal-btn').addEventListener('click', () => {
      showSupportModal = false;
      renderDashboard();
    });
    // Click outside backdrop
    document.getElementById('support-modal-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'support-modal-backdrop') {
        showSupportModal = false;
        renderDashboard();
      }
    });

    document.getElementById('support-email-btn').addEventListener('click', () => {
      showSupportModal = false;
      renderDashboard();
      showToast("Seu chat foi iniciado... Redirecionando para central.", "info");
    });

    document.getElementById('support-whatsapp-btn').addEventListener('click', () => {
      showSupportModal = false;
      renderDashboard();
      showToast("Direcionando para o canal de WhatsApp... Por favor, aguarde.", "success");
    });
  }
}

function handleLogout() {
  localStorage.removeItem('vtmcred_current_user');
  currentUser = null;
  activeTab = 'inicio';
  showAnalysisModal = false;
  showSupportModal = false;
  
  // Toggle layout
  document.getElementById('dashboard-viewport').classList.add('hidden');
  document.getElementById('main-viewport-container').classList.remove('hidden');
  
  showToast('Desconectado com sucesso!', 'info');
}
