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
        <span class="font-semibold text-base">Instruções enviadas!</span>
        <span class="text-xs text-emerald-600 mt-1 max-w-[280px]">
          Enviamos um link de redefinição para <strong id="forgot-confirmed-email"></strong>. Verifique sua caixa de entrada.
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

    setLoading(submitBtn, true, 'Verificando...');

    setTimeout(() => {
      setLoading(submitBtn, false, 'Entrar');
      closeActiveSheet();
      showToast(`Olá! Acesso autorizado com sucesso para: ${formatCPF(transitionCpf)}`, 'success');
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
      closeActiveSheet();

      const firstName = trimmedName.split(' ')[0];
      showToast(`Cadastro criado para ${firstName}! Um e-mail de ativação foi enviado para ${emailStr}.`, 'success');
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
