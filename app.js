const STORAGE_KEY = 'controlPersonalData';

const isStorageAvailable = checkStorageAvailability();
const memoryFallback = getDefaultState();
const state = loadState();

let editingNoteIndex = null;
let editingPasswordIndex = null;

const elements = {
  incomeForm: document.querySelector('#income-form'),
  totalAmount: document.querySelector('#total-amount'),
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

function checkStorageAvailability() {
  try {
    const key = '__cp_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

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
  const paidInstallments = Math.max(0, Math.min(expense.installments, currentIndex - firstDebitIndex + 1));
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
    name: expense.name || 'Gasto sin nombre',
    type,
    totalAmount,
    installments,
    monthlyAmount,
    firstDebitMonth,
  };
}

function loadState() {
  if (!isStorageAvailable) {
    return { ...memoryFallback };
  }

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
  if (!isStorageAvailable) {
    Object.assign(memoryFallback, JSON.parse(JSON.stringify(state)));
    return;
  }

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
  row.className = 'item-row';

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

function updateExpenseFormByType() {
  if (!elements.expenseType) {
    return;
  }

  const isMonthly = elements.expenseType.value === 'monthly';

  if (elements.expenseValueLabel) {
    elements.expenseValueLabel.textContent = isMonthly ? 'Monto mensual' : 'Monto total';
  }

  if (elements.expenseInstallmentsWrap) {
    elements.expenseInstallmentsWrap.style.display = isMonthly ? 'none' : 'grid';
  }

  if (elements.expenseInstallments) {
    elements.expenseInstallments.required = !isMonthly;
    if (isMonthly) {
      elements.expenseInstallments.value = '1';
    }
  }
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
    const description =
      expense.type === 'monthly'
        ? `${expense.name}\nTipo: Mensual | Monto mensual: ${formatCurrency(expense.monthlyAmount)}\nPrimer débito: ${formatMonth(expense.firstDebitMonth)} | Finaliza: Sin fin`
        : `${expense.name}\nTipo: Cuotas | Total: ${formatCurrency(expense.totalAmount)} | Cuotas: ${expense.installments}\nPrimer débito: ${formatMonth(expense.firstDebitMonth)} | Termina: ${formatMonth(status.endMonth)}\nCuotas restantes: ${status.remainingInstallments}`;

    const row = createListItem(description, [
      {
        label: 'Eliminar',
        className: 'delete-btn',
        onClick: () => {
          state.fixedExpenses.splice(index, 1);
          saveState();
          renderFinance();
        },
      },
    ]);

    elements.expensesList.appendChild(row);
  });
}

function renderNotes() {
  if (!elements.notesList) {
    return;
  }

  elements.notesList.innerHTML = '';

  state.notes.forEach((note, index) => {
    const row = document.createElement('li');
    row.className = 'item-row';

    const actionsEl = document.createElement('div');
    actionsEl.className = 'item-actions';

    if (editingNoteIndex === index) {
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
        createActionButton('Guardar', '', () => {
          state.notes[index] = {
            title: titleInput.value.trim() || note.title,
            content: contentInput.value.trim() || note.content,
          };
          editingNoteIndex = null;
          saveState();
          renderNotes();
        })
      );
      actionsEl.appendChild(
        createActionButton('Cancelar', 'edit-btn', () => {
          editingNoteIndex = null;
          renderNotes();
        })
      );

      row.append(editor, actionsEl);
    } else {
      const contentEl = document.createElement('div');
      contentEl.className = 'item-content';
      contentEl.textContent = `${note.title}\n${note.content}`;

      actionsEl.appendChild(
        createActionButton('Editar', 'edit-btn', () => {
          editingNoteIndex = index;
          renderNotes();
        })
      );
      actionsEl.appendChild(
        createActionButton('Eliminar', 'delete-btn', () => {
          state.notes.splice(index, 1);
          if (editingNoteIndex === index) {
            editingNoteIndex = null;
          }
          saveState();
          renderNotes();
        })
      );

      row.append(contentEl, actionsEl);
    }

    elements.notesList.appendChild(row);
  });
}

function renderPasswords() {
  if (!elements.passwordsList) {
    return;
  }

  elements.passwordsList.innerHTML = '';

  state.passwords.forEach((entry, index) => {
    const row = document.createElement('li');
    row.className = 'item-row';

    const actionsEl = document.createElement('div');
    actionsEl.className = 'item-actions';

    if (editingPasswordIndex === index) {
      const editor = document.createElement('div');
      editor.className = 'inline-form edit-inline';

      const serviceInput = document.createElement('input');
      serviceInput.type = 'text';
      serviceInput.value = entry.service;

      const userInput = document.createElement('input');
      userInput.type = 'text';
      userInput.value = entry.user;

      const secretInput = document.createElement('input');
      secretInput.type = 'text';
      secretInput.value = entry.secret;

      editor.append(serviceInput, userInput, secretInput);

      actionsEl.appendChild(
        createActionButton('Guardar', '', () => {
          state.passwords[index] = {
            service: serviceInput.value.trim() || entry.service,
            user: userInput.value.trim() || entry.user,
            secret: secretInput.value.trim() || entry.secret,
          };
          editingPasswordIndex = null;
          saveState();
          renderPasswords();
        })
      );
      actionsEl.appendChild(
        createActionButton('Cancelar', 'edit-btn', () => {
          editingPasswordIndex = null;
          renderPasswords();
        })
      );

      row.append(editor, actionsEl);
    } else {
      const contentEl = document.createElement('div');
      contentEl.className = 'item-content';
      contentEl.textContent = `${entry.service}\nUsuario: ${entry.user}\nClave: ${entry.secret}`;

      actionsEl.appendChild(
        createActionButton('Editar', 'edit-btn', () => {
          editingPasswordIndex = index;
          renderPasswords();
        })
      );
      actionsEl.appendChild(
        createActionButton('Eliminar', 'delete-btn', () => {
          state.passwords.splice(index, 1);
          if (editingPasswordIndex === index) {
            editingPasswordIndex = null;
          }
          saveState();
          renderPasswords();
        })
      );

      row.append(contentEl, actionsEl);
    }

    elements.passwordsList.appendChild(row);
  });
}

function attachEvents() {
  if (elements.expenseType) {
    elements.expenseType.addEventListener('change', updateExpenseFormByType);
    updateExpenseFormByType();
  }

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

      const type = elements.expenseType?.value === 'monthly' ? 'monthly' : 'installments';
      const amount = Number(elements.expenseValue.value);
      const installments = type === 'monthly' ? 1 : Number(elements.expenseInstallments.value);

      state.fixedExpenses.push({
        name: elements.expenseName.value.trim(),
        type,
        totalAmount: type === 'monthly' ? amount : amount,
        installments,
        monthlyAmount: type === 'monthly' ? amount : amount / installments,
        firstDebitMonth: elements.expenseFirstDebit.value,
      });

      elements.fixedExpenseForm.reset();
      if (elements.expenseType) {
        elements.expenseType.value = 'installments';
      }
      if (elements.expenseInstallments) {
        elements.expenseInstallments.value = '1';
      }
      updateExpenseFormByType();
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

if (!isStorageAvailable) {
  console.warn('localStorage no está disponible en este navegador/contexto.');
}

attachEvents();
renderFinance();
renderNotes();
renderPasswords();
