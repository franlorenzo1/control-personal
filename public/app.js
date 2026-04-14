const TOKEN_KEY = 'cp_token';
const API_URL = '/api';

const token = localStorage.getItem(TOKEN_KEY);
if (!token && !window.location.pathname.includes('login.html')) {
  window.location.href = './login.html';
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

let state = {
  baseAmount: 0,
  extraIncomes: [],
  fixedExpenses: [],
  oneTimeExpenses: [],
  notes: [],
  passwords: [],
};

let editingNoteId = null;
let editingPasswordId = null;

// ===================== ELEMENTS =====================
const elements = {
  incomeForm: document.querySelector('#income-form'),
  totalAmount: document.querySelector('#total-amount'),
  saveBaseAmountBtn: document.querySelector('#save-base-amount-btn'),
  addMoneyForm: document.querySelector('#add-money-form'),
  incomeDetail: document.querySelector('#income-detail'),
  addMoney: document.querySelector('#add-money'),
  fixedExpenseForm: document.querySelector('#fixed-expense-form'),
  expenseName: document.querySelector('#expense-name'),
  expenseType: document.querySelector('#expense-type'),
  expenseValueLabel: document.querySelector('#expense-value-label'),
  expenseValue: document.querySelector('#expense-value'),
  expenseInstallmentsWrap: document.querySelector('#expense-installments-wrap'),
  expenseInstallments: document.querySelector('#expense-installments'),
  expenseFirstDebit: document.querySelector('#expense-first-debit'),
  summaryBase: document.querySelector('#summary-base'),
  summaryExtra: document.querySelector('#summary-extra'),
  summaryExpenses: document.querySelector('#summary-expenses'),
  summaryRemaining: document.querySelector('#summary-remaining'),
  progressFill: document.querySelector('#progress-fill'),
  progressLabel: document.querySelector('#progress-label'),
  incomeList: document.querySelector('#income-list'),
  expensesList: document.querySelector('#expenses-list'),
  noteForm: document.querySelector('#note-form'),
  noteTitle: document.querySelector('#note-title'),
  noteContent: document.querySelector('#note-content'),
  notesList: document.querySelector('#notes-list'),
  notesSearch: document.querySelector('#notes-search'),
  passwordForm: document.querySelector('#password-form'),
  passwordService: document.querySelector('#password-service'),
  passwordUser: document.querySelector('#password-user'),
  passwordSecret: document.querySelector('#password-secret'),
  passwordsList: document.querySelector('#passwords-list'),
  passwordsSearch: document.querySelector('#passwords-search'),
  importFile: document.querySelector('#import-file'),
  oneTimeForm: document.querySelector('#one-time-form'),
  oneTimeDetail: document.querySelector('#one-time-detail'),
  oneTimeAmount: document.querySelector('#one-time-amount'),
  oneTimeList: document.querySelector('#one-time-list'),
  oneTimeTotalLabel: document.querySelector('#one-time-total'),
  logoutBtn: null, // we will create this dynamically or add to HTML
};

// ===================== API UTILS =====================
async function apiGet(route) {
  const res = await fetch(`${API_URL}${route}`, { headers });
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = './login.html';
  }
  return res.json();
}

async function apiPost(route, data) {
  const res = await fetch(`${API_URL}${route}`, { method: 'POST', headers, body: JSON.stringify(data) });
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = './login.html';
  }
  if (!res.ok) throw new Error('API Error');
  return res.json();
}

async function apiPut(route, data) {
  const res = await fetch(`${API_URL}${route}`, { method: 'PUT', headers, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('API Error');
  return res.json();
}

async function apiDelete(route) {
  const res = await fetch(`${API_URL}${route}`, { method: 'DELETE', headers });
  if (!res.ok) throw new Error('API Error');
  return res.json();
}

async function fetchState() {
  try {
    const data = await apiGet('/data');
    state = { ...state, ...data };
    
    if (!Array.isArray(state.fixedExpenses)) state.fixedExpenses = [];
    state.fixedExpenses = state.fixedExpenses.map(normalizeExpense);

    renderFinance();
    renderNotes();
    renderPasswords();
  } catch(e) {
    console.error("Error fetching state", e);
  }
}

// ===================== DATE / FORMAT UTILS =====================
function toMonthIndex(monthString) {
  const [year, month] = String(monthString).split('-').map(Number);
  if (!year || !month) return null;
  return year * 12 + (month - 1);
}

function monthFromIndex(index) {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

function formatMonth(monthString) {
  const [year, month] = monthString.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(date);
}

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getCurrentMonthString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
}

// ===================== EXPENSE UTILS =====================
function getExpenseStatus(expense) {
  const firstDebitIndex = toMonthIndex(expense.firstDebitMonth);
  if (firstDebitIndex === null) {
    return {
      remainingInstallments: expense.installments,
      endMonth: expense.firstDebitMonth,
      isActiveThisMonth: false,
      isMonthly: expense.type === 'monthly',
    };
  }

  const currentIndex = toMonthIndex(getCurrentMonthString());

  if (expense.type === 'monthly') {
    return {
      remainingInstallments: null,
      endMonth: null,
      isActiveThisMonth: currentIndex >= firstDebitIndex,
      isMonthly: true,
    };
  }

  const endIndex = firstDebitIndex + expense.installments - 1;
  const paidInstallments = Math.max(
    0,
    Math.min(expense.installments, currentIndex - firstDebitIndex + 1)
  );
  const remainingInstallments = expense.installments - paidInstallments;
  const isActiveThisMonth = currentIndex >= firstDebitIndex && currentIndex <= endIndex;

  return {
    remainingInstallments,
    endMonth: monthFromIndex(endIndex),
    isActiveThisMonth,
    isMonthly: false,
  };
}

function normalizeExpense(expense) {
  const type = expense.type === 'monthly' ? 'monthly' : 'installments';
  const totalAmount = Number(expense.totalAmount ?? expense.amount ?? expense.monthlyAmount ?? 0);
  const installments = type === 'installments' ? Number(expense.installments ?? 1) || 1 : 1;
  const firstDebitMonth = expense.firstDebitMonth || getCurrentMonthString();
  const monthlyAmount =
    type === 'monthly'
      ? Number(expense.monthlyAmount ?? totalAmount)
      : Number(expense.monthlyAmount ?? totalAmount / installments);

  return {
    ...expense,
    name: expense.name || 'Gasto sin nombre',
    type,
    totalAmount,
    installments,
    monthlyAmount,
    firstDebitMonth,
  };
}

// ===================== CALCULATIONS =====================
function calculateExtraIncomes() {
  return state.extraIncomes.reduce((acc, item) => acc + Number(item.amount), 0);
}

function calculateMonthlyActiveExpenses() {
  return state.fixedExpenses.reduce((acc, expense) => {
    const status = getExpenseStatus(expense);
    if (!status.isActiveThisMonth) return acc;
    return acc + Number(expense.monthlyAmount);
  }, 0);
}

function calculateOneTimeExpenses() {
  return (state.oneTimeExpenses || []).reduce((acc, item) => acc + Number(item.amount), 0);
}

// ===================== UI HELPERS =====================
function createActionButton(label, className, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `action-btn ${className || ''}`.trim();
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

function createListItem(content, actions) {
  const row = document.createElement('li');
  row.className = 'item-row fade-in';

  const contentEl = document.createElement('div');
  contentEl.className = 'item-content';
  contentEl.textContent = content;

  const actionsEl = document.createElement('div');
  actionsEl.className = 'item-actions';

  actions.forEach((action) => {
    actionsEl.appendChild(createActionButton(action.label, action.className, action.onClick));
  });

  row.append(contentEl, actionsEl);
  return row;
}

// ===================== EXPENSE FORM =====================
function updateExpenseFormByType() {
  if (!elements.expenseType) return;

  const isMonthly = elements.expenseType.value === 'monthly';

  if (elements.expenseValueLabel) {
    elements.expenseValueLabel.textContent = isMonthly ? 'Monto mensual' : 'Monto total';
  }
  if (elements.expenseInstallmentsWrap) {
    elements.expenseInstallmentsWrap.style.display = isMonthly ? 'none' : 'grid';
  }
  if (elements.expenseInstallments) {
    elements.expenseInstallments.required = !isMonthly;
    if (isMonthly) elements.expenseInstallments.value = '1';
  }
  if (elements.expenseFirstDebit) {
    elements.expenseFirstDebit.required = !isMonthly;
    elements.expenseFirstDebit.disabled = isMonthly;
    if (isMonthly) elements.expenseFirstDebit.value = '';
  }
}

// ===================== RENDER FINANCE =====================
function renderFinance() {
  if (!elements.summaryBase) return;

  const extraIncomesTotal = calculateExtraIncomes();
  const monthlyExpensesTotal = calculateMonthlyActiveExpenses();
  const oneTimeTotal = calculateOneTimeExpenses();
  const available = state.baseAmount + extraIncomesTotal;
  const totalSpent = monthlyExpensesTotal + oneTimeTotal;
  const remaining = available - totalSpent;

  elements.summaryBase.textContent = formatCurrency(state.baseAmount);
  if (elements.totalAmount) {
    elements.totalAmount.value = state.baseAmount > 0 ? state.baseAmount : '';
  }
  elements.summaryExtra.textContent = formatCurrency(extraIncomesTotal);
  elements.summaryExpenses.textContent = formatCurrency(monthlyExpensesTotal);
  elements.summaryRemaining.textContent = formatCurrency(remaining);

  if (elements.oneTimeTotalLabel) {
    elements.oneTimeTotalLabel.textContent =
      oneTimeTotal > 0 ? `— Total: ${formatCurrency(oneTimeTotal)}` : '';
  }

  if (elements.progressFill) {
    const pct = available > 0 ? Math.min((totalSpent / available) * 100, 100) : 0;
    elements.progressFill.style.width = `${pct.toFixed(1)}%`;
    elements.progressFill.className = 'progress-fill';
    if (pct >= 100) elements.progressFill.classList.add('danger');
    else if (pct >= 80) elements.progressFill.classList.add('warn');
    if (elements.progressLabel) {
      elements.progressLabel.textContent = `Gastos totales: ${pct.toFixed(0)}% del ingreso disponible`;
    }
  }

  elements.incomeList.innerHTML = '';
  state.extraIncomes.forEach((income) => {
    const row = createListItem(`${income.detail} — ${formatCurrency(income.amount)}`, [
      {
        label: 'Eliminar',
        className: 'delete-btn',
        onClick: async () => {
          if (!confirm('¿Eliminar este ingreso extra?')) return;
          await apiDelete(`/extra_incomes/${income.id}`);
          fetchState();
        },
      },
    ]);
    elements.incomeList.appendChild(row);
  });

  elements.expensesList.innerHTML = '';
  state.fixedExpenses.forEach((expense) => {
    const status = getExpenseStatus(expense);
    const description =
      expense.type === 'monthly'
        ? `${expense.name}\nTipo: Mensual | Monto mensual: ${formatCurrency(expense.monthlyAmount)}\nPrimer débito: ${formatMonth(expense.firstDebitMonth)} | Finaliza: Sin fin`
        : `${expense.name}\nTipo: Cuotas | Total: ${formatCurrency(expense.totalAmount)} | Cuotas: ${expense.installments}\nPrimer débito: ${formatMonth(expense.firstDebitMonth)} | Termina: ${formatMonth(status.endMonth)}\nCuotas restantes: ${status.remainingInstallments}`;

    const row = createListItem(description, [
      {
        label: 'Eliminar',
        className: 'delete-btn',
        onClick: async () => {
          if (!confirm('¿Eliminar este gasto fijo?')) return;
          await apiDelete(`/fixed_expenses/${expense.id}`);
          fetchState();
        },
      },
    ]);
    elements.expensesList.appendChild(row);
  });

  if (elements.oneTimeList) {
    elements.oneTimeList.innerHTML = '';
    (state.oneTimeExpenses || []).forEach((item) => {
      const dateStr = item.date ? formatDate(item.date) : '';
      const label = dateStr
        ? `${item.detail} — ${formatCurrency(item.amount)}\n${dateStr}`
        : `${item.detail} — ${formatCurrency(item.amount)}`;
      const row = createListItem(label, [
        {
          label: 'Eliminar',
          className: 'delete-btn',
          onClick: async () => {
            if (!confirm('¿Eliminar este gasto puntual?')) return;
            await apiDelete(`/one_time_expenses/${item.id}`);
            fetchState();
          },
        },
      ]);
      elements.oneTimeList.appendChild(row);
    });
  }
}

// ===================== RENDER NOTES =====================
function renderNotes() {
  if (!elements.notesList) return;

  const query = elements.notesSearch ? elements.notesSearch.value.toLowerCase().trim() : '';

  const filteredNotes = state.notes
    .filter((n) =>
      query ? n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query) : true
    );

  elements.notesList.innerHTML = '';

  filteredNotes.forEach((note) => {
    const row = document.createElement('li');
    row.className = 'item-row fade-in';

    const actionsEl = document.createElement('div');
    actionsEl.className = 'item-actions';

    if (editingNoteId === note.id) {
      const editor = document.createElement('div');
      editor.className = 'inline-form edit-inline';

      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.value = note.title;

      const contentInput = document.createElement('textarea');
      contentInput.rows = 3;
      contentInput.value = note.content;

      editor.append(titleInput, contentInput);

      actionsEl.appendChild(
        createActionButton('Guardar', '', async () => {
          await apiPut(`/notes/${note.id}`, {
            title: titleInput.value.trim() || note.title,
            content: contentInput.value.trim() || note.content,
          });
          editingNoteId = null;
          fetchState();
        })
      );
      actionsEl.appendChild(
        createActionButton('Cancelar', 'edit-btn', () => {
          editingNoteId = null;
          renderNotes();
        })
      );

      row.append(editor, actionsEl);
    } else {
      const contentEl = document.createElement('div');
      contentEl.className = 'item-content';
      contentEl.textContent = `${note.title}\n${note.content}`;

      if (note.createdAt) {
        const dateEl = document.createElement('span');
        dateEl.className = 'item-date';
        dateEl.textContent = `Creada: ${formatDate(note.createdAt)}`;
        contentEl.appendChild(dateEl);
      }

      actionsEl.appendChild(
        createActionButton('Editar', 'edit-btn', () => {
          editingNoteId = note.id;
          renderNotes();
        })
      );
      actionsEl.appendChild(
        createActionButton('Eliminar', 'delete-btn', async () => {
          if (!confirm('¿Eliminar esta nota?')) return;
          await apiDelete(`/notes/${note.id}`);
          if (editingNoteId === note.id) editingNoteId = null;
          fetchState();
        })
      );

      row.append(contentEl, actionsEl);
    }

    elements.notesList.appendChild(row);
  });
}

// ===================== RENDER PASSWORDS =====================
function renderPasswords() {
  if (!elements.passwordsList) return;

  const query = elements.passwordsSearch
    ? elements.passwordsSearch.value.toLowerCase().trim()
    : '';

  const filteredPasswords = state.passwords
    .filter((p) =>
      query
        ? p.service.toLowerCase().includes(query) || p.user.toLowerCase().includes(query)
        : true
    );

  elements.passwordsList.innerHTML = '';

  filteredPasswords.forEach((entry) => {
    const row = document.createElement('li');
    row.className = 'item-row fade-in';

    const actionsEl = document.createElement('div');
    actionsEl.className = 'item-actions';

    if (editingPasswordId === entry.id) {
      const editor = document.createElement('div');
      editor.className = 'inline-form edit-inline';

      const serviceInput = document.createElement('input');
      serviceInput.type = 'text';
      serviceInput.value = entry.service;

      const userInput = document.createElement('input');
      userInput.type = 'text';
      userInput.value = entry.user;

      const secretWrap = document.createElement('div');
      secretWrap.className = 'password-field-wrap';

      const secretInput = document.createElement('input');
      secretInput.type = 'password';
      secretInput.value = entry.secret;

      const revealEditBtn = document.createElement('button');
      revealEditBtn.type = 'button';
      revealEditBtn.className = 'toggle-secret';
      revealEditBtn.textContent = '👁';
      revealEditBtn.addEventListener('click', () => {
        secretInput.type = secretInput.type === 'password' ? 'text' : 'password';
        revealEditBtn.textContent = '👁';
      });

      secretWrap.append(secretInput, revealEditBtn);
      editor.append(serviceInput, userInput, secretWrap);

      actionsEl.appendChild(
        createActionButton('Guardar', '', async () => {
          await apiPut(`/passwords/${entry.id}`, {
            service: serviceInput.value.trim() || entry.service,
            user: userInput.value.trim() || entry.user,
            secret: secretInput.value.trim() || entry.secret,
          });
          editingPasswordId = null;
          fetchState();
        })
      );
      actionsEl.appendChild(
        createActionButton('Cancelar', 'edit-btn', () => {
          editingPasswordId = null;
          renderPasswords();
        })
      );

      row.append(editor, actionsEl);
    } else {
      const contentEl = document.createElement('div');
      contentEl.className = 'item-content';

      // Service + user as plain text; password masked
      const headerText = document.createTextNode(`${entry.service}\nUsuario: ${entry.user}\nClave: `);
      const secretSpan = document.createElement('span');
      let revealed = false;
      secretSpan.textContent = '••••••••';

      const revealBtn = document.createElement('button');
      revealBtn.type = 'button';
      revealBtn.className = 'toggle-secret action-btn';
      revealBtn.style.cssText = 'min-width:unset;padding:0.2rem 0.45rem;margin-left:0.3rem;font-size:0.95rem;vertical-align:middle;';
      revealBtn.textContent = '👁';
      revealBtn.addEventListener('click', () => {
        revealed = !revealed;
        secretSpan.textContent = revealed ? entry.secret : '••••••••';
        revealBtn.textContent = '👁';
      });

      contentEl.append(headerText, secretSpan, revealBtn);

      actionsEl.appendChild(
        createActionButton('Editar', 'edit-btn', () => {
          editingPasswordId = entry.id;
          renderPasswords();
        })
      );
      actionsEl.appendChild(
        createActionButton('Eliminar', 'delete-btn', async () => {
          if (!confirm('¿Eliminar esta contraseña?')) return;
          await apiDelete(`/passwords/${entry.id}`);
          if (editingPasswordId === entry.id) editingPasswordId = null;
          fetchState();
        })
      );

      row.append(contentEl, actionsEl);
    }

    elements.passwordsList.appendChild(row);
  });
}

// ===================== LOGOUT =====================
function appendLogoutBtn() {
  const topbar = document.querySelector('.data-btns');
  if (topbar && !document.getElementById('logout-btn')) {
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.className = 'data-btn delete-btn';
    logoutBtn.textContent = 'Salir / Logout';
    logoutBtn.onclick = () => {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = './login.html';
    };
    topbar.appendChild(logoutBtn);
  }
}

// ===================== EVENTS =====================
function attachEvents() {
  appendLogoutBtn();

  // Search listeners
  if (elements.notesSearch) {
    elements.notesSearch.addEventListener('input', renderNotes);
  }
  if (elements.passwordsSearch) {
    elements.passwordsSearch.addEventListener('input', renderPasswords);
  }

  // Password form secret toggle
  const passwordSecretToggle = document.querySelector('#password-secret-toggle');
  if (passwordSecretToggle && elements.passwordSecret) {
    passwordSecretToggle.addEventListener('click', () => {
      elements.passwordSecret.type =
        elements.passwordSecret.type === 'password' ? 'text' : 'password';
      passwordSecretToggle.textContent = '👁';
    });
  }

  // Finance forms
  if (elements.expenseType) {
    elements.expenseType.addEventListener('change', updateExpenseFormByType);
    updateExpenseFormByType();
  }

  if (elements.incomeForm) {
    elements.incomeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await apiPost('/base_amount', { amount: Number(elements.totalAmount.value) });
      fetchState();
    });
  }

  if (elements.addMoneyForm) {
    elements.addMoneyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await apiPost('/extra_incomes', {
        detail: elements.incomeDetail.value.trim(),
        amount: Number(elements.addMoney.value)
      });
      elements.addMoneyForm.reset();
      fetchState();
    });
  }

  if (elements.fixedExpenseForm) {
    elements.fixedExpenseForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const type = elements.expenseType?.value === 'monthly' ? 'monthly' : 'installments';
      const amount = Number(elements.expenseValue.value);
      const installments = type === 'monthly' ? 1 : Number(elements.expenseInstallments.value);

      await apiPost('/fixed_expenses', {
        name: elements.expenseName.value.trim(),
        type,
        totalAmount: amount,
        installments,
        monthlyAmount: type === 'monthly' ? amount : amount / installments,
        firstDebitMonth: type === 'monthly'
            ? getCurrentMonthString()
            : elements.expenseFirstDebit.value || getCurrentMonthString(),
      });

      elements.fixedExpenseForm.reset();
      if (elements.expenseType) elements.expenseType.value = 'installments';
      if (elements.expenseInstallments) elements.expenseInstallments.value = '1';
      updateExpenseFormByType();
      fetchState();
    });
  }

  if (elements.noteForm) {
    elements.noteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await apiPost('/notes', {
        title: elements.noteTitle.value.trim(),
        content: elements.noteContent.value.trim(),
        createdAt: new Date().toISOString(),
      });
      elements.noteForm.reset();
      fetchState();
    });
  }

  if (elements.oneTimeForm) {
    elements.oneTimeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await apiPost('/one_time_expenses', {
        detail: elements.oneTimeDetail.value.trim(),
        amount: Number(elements.oneTimeAmount.value),
        date: new Date().toISOString(),
      });
      elements.oneTimeForm.reset();
      fetchState();
    });
  }

  if (elements.passwordForm) {
    elements.passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await apiPost('/passwords', {
        service: elements.passwordService.value.trim(),
        user: elements.passwordUser.value.trim(),
        secret: elements.passwordSecret.value.trim(),
      });
      elements.passwordForm.reset();
      fetchState();
    });
  }
}

// ===================== PWA =====================
function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => { });
    });
  }
}

// ===================== INIT =====================
attachEvents();
// Only fetch state if we have a token (since otherwise we redirect anyway)
if (localStorage.getItem(TOKEN_KEY)) {
  fetchState();
}
registerSW();
