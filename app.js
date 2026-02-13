const STORAGE_KEY = 'controlPersonalData';

const state = loadState();

const elements = {
  incomeForm: document.querySelector('#income-form'),
  totalAmount: document.querySelector('#total-amount'),
  addMoneyForm: document.querySelector('#add-money-form'),
  incomeDetail: document.querySelector('#income-detail'),
  addMoney: document.querySelector('#add-money'),
  fixedExpenseForm: document.querySelector('#fixed-expense-form'),
  expenseName: document.querySelector('#expense-name'),
  expenseValue: document.querySelector('#expense-value'),
  expenseInstallments: document.querySelector('#expense-installments'),
  expenseFirstDebit: document.querySelector('#expense-first-debit'),
  summaryBase: document.querySelector('#summary-base'),
  summaryExtra: document.querySelector('#summary-extra'),
  summaryExpenses: document.querySelector('#summary-expenses'),
  summaryRemaining: document.querySelector('#summary-remaining'),
  incomeList: document.querySelector('#income-list'),
  expensesList: document.querySelector('#expenses-list'),
  noteForm: document.querySelector('#note-form'),
  noteTitle: document.querySelector('#note-title'),
  noteContent: document.querySelector('#note-content'),
  notesList: document.querySelector('#notes-list'),
  passwordForm: document.querySelector('#password-form'),
  passwordService: document.querySelector('#password-service'),
  passwordUser: document.querySelector('#password-user'),
  passwordSecret: document.querySelector('#password-secret'),
  passwordsList: document.querySelector('#passwords-list'),
};

function getDefaultState() {
  return {
    baseAmount: 0,
    extraIncomes: [],
    fixedExpenses: [],
    notes: [],
    passwords: [],
  };
}

function toMonthIndex(monthString) {
  const [year, month] = String(monthString).split('-').map(Number);
  if (!year || !month) {
    return null;
  }

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
  return new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getCurrentMonthString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getExpenseStatus(expense) {
  const firstDebitIndex = toMonthIndex(expense.firstDebitMonth);
  if (firstDebitIndex === null) {
    return {
      remainingInstallments: expense.installments,
      endMonth: expense.firstDebitMonth,
      isActiveThisMonth: false,
    };
  }

  const currentIndex = toMonthIndex(getCurrentMonthString());
  const endIndex = firstDebitIndex + expense.installments - 1;
  const paidInstallments = Math.max(0, Math.min(expense.installments, currentIndex - firstDebitIndex + 1));
  const remainingInstallments = expense.installments - paidInstallments;
  const isActiveThisMonth = currentIndex >= firstDebitIndex && currentIndex <= endIndex;

  return {
    remainingInstallments,
    endMonth: monthFromIndex(endIndex),
    isActiveThisMonth,
  };
}

function normalizeExpense(expense) {
  const totalAmount = Number(expense.totalAmount ?? expense.amount ?? 0);
  const installments = Number(expense.installments ?? 1) || 1;
  const firstDebitMonth = expense.firstDebitMonth || getCurrentMonthString();

  return {
    name: expense.name || 'Gasto sin nombre',
    totalAmount,
    installments,
    monthlyAmount: totalAmount / installments,
    firstDebitMonth,
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return getDefaultState();
  }

  try {
    const parsed = JSON.parse(raw);

    const normalizedState = {
      ...getDefaultState(),
      ...parsed,
    };

    if (typeof normalizedState.baseAmount !== 'number') {
      normalizedState.baseAmount = Number(parsed.totalAmount) || 0;
    }

    if (!Array.isArray(normalizedState.extraIncomes)) {
      normalizedState.extraIncomes = [];
    }

    if (!Array.isArray(normalizedState.fixedExpenses)) {
      normalizedState.fixedExpenses = [];
    }

    normalizedState.fixedExpenses = normalizedState.fixedExpenses.map(normalizeExpense);

    if (!Array.isArray(normalizedState.notes)) {
      normalizedState.notes = [];
    }

    if (!Array.isArray(normalizedState.passwords)) {
      normalizedState.passwords = [];
    }

    return normalizedState;
  } catch {
    return getDefaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value);
}

function calculateExtraIncomes() {
  return state.extraIncomes.reduce((acc, item) => acc + Number(item.amount), 0);
}

function calculateMonthlyActiveExpenses() {
  return state.fixedExpenses.reduce((acc, expense) => {
    const status = getExpenseStatus(expense);
    if (!status.isActiveThisMonth) {
      return acc;
    }

    return acc + Number(expense.monthlyAmount);
  }, 0);
}

function createListItem(content, actions) {
  const row = document.createElement('li');
  row.className = 'item-row';

  const contentEl = document.createElement('div');
  contentEl.className = 'item-content';
  contentEl.textContent = content;

  const actionsEl = document.createElement('div');
  actionsEl.className = 'item-actions';

  actions.forEach((action) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `action-btn ${action.className || ''}`.trim();
    button.textContent = action.label;
    button.addEventListener('click', action.onClick);
    actionsEl.appendChild(button);
  });

  row.append(contentEl, actionsEl);
  return row;
}

function renderFinance() {
  if (!elements.summaryBase) {
    return;
  }

  const extraIncomesTotal = calculateExtraIncomes();
  const monthlyExpensesTotal = calculateMonthlyActiveExpenses();
  const available = state.baseAmount + extraIncomesTotal;
  const remaining = available - monthlyExpensesTotal;

  elements.summaryBase.textContent = formatCurrency(state.baseAmount);
  elements.summaryExtra.textContent = formatCurrency(extraIncomesTotal);
  elements.summaryExpenses.textContent = formatCurrency(monthlyExpensesTotal);
  elements.summaryRemaining.textContent = formatCurrency(remaining);

  elements.incomeList.innerHTML = '';
  state.extraIncomes.forEach((income, index) => {
    const row = createListItem(`${income.detail} - ${formatCurrency(income.amount)}`, [
      {
        label: 'Eliminar',
        className: 'delete-btn',
        onClick: () => {
          state.extraIncomes.splice(index, 1);
          saveState();
          renderFinance();
        },
      },
    ]);

    elements.incomeList.appendChild(row);
  });

  elements.expensesList.innerHTML = '';
  state.fixedExpenses.forEach((expense, index) => {
    const status = getExpenseStatus(expense);

    const row = createListItem(
      `${expense.name}\nTotal: ${formatCurrency(expense.totalAmount)} | Cuotas: ${expense.installments}\nPrimer débito: ${formatMonth(expense.firstDebitMonth)} | Termina: ${formatMonth(status.endMonth)}\nCuotas restantes: ${status.remainingInstallments}`,
      [
        {
          label: 'Eliminar',
          className: 'delete-btn',
          onClick: () => {
            state.fixedExpenses.splice(index, 1);
            saveState();
            renderFinance();
          },
        },
      ]
    );

    elements.expensesList.appendChild(row);
  });
}

function editNote(index) {
  const note = state.notes[index];
  const newTitle = prompt('Editar título de la nota:', note.title);
  if (newTitle === null) {
    return;
  }

  const newContent = prompt('Editar contenido de la nota:', note.content);
  if (newContent === null) {
    return;
  }

  state.notes[index] = {
    title: newTitle.trim() || note.title,
    content: newContent.trim() || note.content,
  };

  saveState();
  renderNotes();
}

function renderNotes() {
  if (!elements.notesList) {
    return;
  }

  elements.notesList.innerHTML = '';

  state.notes.forEach((note, index) => {
    const row = createListItem(`${note.title}\n${note.content}`, [
      {
        label: 'Editar',
        className: 'edit-btn',
        onClick: () => editNote(index),
      },
      {
        label: 'Eliminar',
        className: 'delete-btn',
        onClick: () => {
          state.notes.splice(index, 1);
          saveState();
          renderNotes();
        },
      },
    ]);

    elements.notesList.appendChild(row);
  });
}

function editPassword(index) {
  const entry = state.passwords[index];
  const service = prompt('Editar servicio:', entry.service);
  if (service === null) {
    return;
  }

  const user = prompt('Editar usuario:', entry.user);
  if (user === null) {
    return;
  }

  const secret = prompt('Editar contraseña:', entry.secret);
  if (secret === null) {
    return;
  }

  state.passwords[index] = {
    service: service.trim() || entry.service,
    user: user.trim() || entry.user,
    secret: secret.trim() || entry.secret,
  };

  saveState();
  renderPasswords();
}

function renderPasswords() {
  if (!elements.passwordsList) {
    return;
  }

  elements.passwordsList.innerHTML = '';

  state.passwords.forEach((entry, index) => {
    const row = createListItem(`${entry.service}\nUsuario: ${entry.user}\nClave: ${entry.secret}`, [
      {
        label: 'Editar',
        className: 'edit-btn',
        onClick: () => editPassword(index),
      },
      {
        label: 'Eliminar',
        className: 'delete-btn',
        onClick: () => {
          state.passwords.splice(index, 1);
          saveState();
          renderPasswords();
        },
      },
    ]);

    elements.passwordsList.appendChild(row);
  });
}

function attachEvents() {
  if (elements.incomeForm) {
    elements.incomeForm.addEventListener('submit', (event) => {
      event.preventDefault();
      state.baseAmount = Number(elements.totalAmount.value);
      elements.incomeForm.reset();
      saveState();
      renderFinance();
    });
  }

  if (elements.addMoneyForm) {
    elements.addMoneyForm.addEventListener('submit', (event) => {
      event.preventDefault();

      state.extraIncomes.push({
        detail: elements.incomeDetail.value.trim(),
        amount: Number(elements.addMoney.value),
      });

      elements.addMoneyForm.reset();
      saveState();
      renderFinance();
    });
  }

  if (elements.fixedExpenseForm) {
    elements.fixedExpenseForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const totalAmount = Number(elements.expenseValue.value);
      const installments = Number(elements.expenseInstallments.value);

      state.fixedExpenses.push({
        name: elements.expenseName.value.trim(),
        totalAmount,
        installments,
        monthlyAmount: totalAmount / installments,
        firstDebitMonth: elements.expenseFirstDebit.value,
      });

      elements.fixedExpenseForm.reset();
      elements.expenseInstallments.value = '1';
      saveState();
      renderFinance();
    });
  }

  if (elements.noteForm) {
    elements.noteForm.addEventListener('submit', (event) => {
      event.preventDefault();

      state.notes.push({
        title: elements.noteTitle.value.trim(),
        content: elements.noteContent.value.trim(),
      });

      elements.noteForm.reset();
      saveState();
      renderNotes();
    });
  }

  if (elements.passwordForm) {
    elements.passwordForm.addEventListener('submit', (event) => {
      event.preventDefault();

      state.passwords.push({
        service: elements.passwordService.value.trim(),
        user: elements.passwordUser.value.trim(),
        secret: elements.passwordSecret.value.trim(),
      });

      elements.passwordForm.reset();
      saveState();
      renderPasswords();
    });
  }
}

attachEvents();
renderFinance();
renderNotes();
renderPasswords();
