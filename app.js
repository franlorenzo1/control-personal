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
  summaryBase: document.querySelector('#summary-base'),
  summaryExtra: document.querySelector('#summary-extra'),
  summaryExpenses: document.querySelector('#summary-expenses'),
  summaryRemaining: document.querySelector('#summary-remaining'),
  incomeList: document.querySelector('#income-list'),
  summaryTotal: document.querySelector('#summary-total'),
  summaryExpenses: document.querySelector('#summary-expenses'),
  summaryRemaining: document.querySelector('#summary-remaining'),
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
  itemTemplate: document.querySelector('#item-template'),
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

    // Compatibilidad con versión previa donde sólo existía totalAmount.
    if (typeof normalizedState.baseAmount !== 'number') {
      normalizedState.baseAmount = Number(parsed.totalAmount) || 0;
    }

    if (!Array.isArray(normalizedState.extraIncomes)) {
      normalizedState.extraIncomes = [];
    }

    if (!Array.isArray(normalizedState.fixedExpenses)) {
      normalizedState.fixedExpenses = [];
    }

    return normalizedState;
  } catch {
    return getDefaultState();
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      totalAmount: 0,
      fixedExpenses: [],
      notes: [],
      passwords: [],
    };
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {
      totalAmount: 0,
      fixedExpenses: [],
      notes: [],
      passwords: [],
    };
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

function calculateExpenses() {
  return state.fixedExpenses.reduce((acc, item) => acc + Number(item.monthlyAmount), 0);
function calculateExpenses() {
  return state.fixedExpenses.reduce((acc, item) => acc + Number(item.amount), 0);
}

function createListItem(content, onDelete) {
  const fragment = elements.itemTemplate.content.cloneNode(true);
  const row = fragment.querySelector('.item-row');
  const contentEl = fragment.querySelector('.item-content');
  const button = fragment.querySelector('.delete-btn');

  contentEl.textContent = content;
  button.addEventListener('click', onDelete);

  return row;
}

function renderFinance() {
  const extraIncomesTotal = calculateExtraIncomes();
  const expensesTotal = calculateExpenses();
  const available = state.baseAmount + extraIncomesTotal;
  const remaining = available - expensesTotal;

  elements.summaryBase.textContent = formatCurrency(state.baseAmount);
  elements.summaryExtra.textContent = formatCurrency(extraIncomesTotal);
  elements.summaryExpenses.textContent = formatCurrency(expensesTotal);
  elements.summaryRemaining.textContent = formatCurrency(remaining);

  elements.incomeList.innerHTML = '';
  state.extraIncomes.forEach((income, index) => {
    const row = createListItem(
      `${income.detail} - ${formatCurrency(income.amount)}`,
      () => {
        state.extraIncomes.splice(index, 1);
        saveState();
        renderFinance();
      }
    );

    elements.incomeList.appendChild(row);
  });

  elements.expensesList.innerHTML = '';
  state.fixedExpenses.forEach((expense, index) => {
    const row = createListItem(
      `${expense.name}\nTotal: ${formatCurrency(expense.totalAmount)} | Cuotas: ${expense.installments} | Este período: ${formatCurrency(expense.monthlyAmount)}`,
  const expensesTotal = calculateExpenses();
  const remaining = state.totalAmount - expensesTotal;

  elements.summaryTotal.textContent = formatCurrency(state.totalAmount);
  elements.summaryExpenses.textContent = formatCurrency(expensesTotal);
  elements.summaryRemaining.textContent = formatCurrency(remaining);

  elements.expensesList.innerHTML = '';
  state.fixedExpenses.forEach((expense, index) => {
    const row = createListItem(
      `${expense.name} — ${formatCurrency(expense.amount)}`,
      () => {
        state.fixedExpenses.splice(index, 1);
        saveState();
        renderFinance();
      }
    );
    elements.expensesList.appendChild(row);
  });
}

function renderNotes() {
  elements.notesList.innerHTML = '';

  state.notes.forEach((note, index) => {
    const row = createListItem(`${note.title}\n${note.content}`, () => {
      state.notes.splice(index, 1);
      saveState();
      renderNotes();
    });

    elements.notesList.appendChild(row);
  });
}

function renderPasswords() {
  elements.passwordsList.innerHTML = '';

  state.passwords.forEach((entry, index) => {
    const row = createListItem(
      `${entry.service}\nUsuario: ${entry.user}\nClave: ${entry.secret}`,
      () => {
        state.passwords.splice(index, 1);
        saveState();
        renderPasswords();
      }
    );

    elements.passwordsList.appendChild(row);
  });
}

function attachEvents() {
  elements.incomeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    state.baseAmount = Number(elements.totalAmount.value);
    state.totalAmount = Number(elements.totalAmount.value);
    elements.incomeForm.reset();
    saveState();
    renderFinance();
  });

  elements.addMoneyForm.addEventListener('submit', (event) => {
    event.preventDefault();

    state.extraIncomes.push({
      detail: elements.incomeDetail.value.trim(),
      amount: Number(elements.addMoney.value),
    });

    state.totalAmount += Number(elements.addMoney.value);
    elements.addMoneyForm.reset();
    saveState();
    renderFinance();
  });

  elements.fixedExpenseForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const totalAmount = Number(elements.expenseValue.value);
    const installments = Number(elements.expenseInstallments.value);
    const monthlyAmount = totalAmount / installments;

    state.fixedExpenses.push({
      name: elements.expenseName.value.trim(),
      totalAmount,
      installments,
      monthlyAmount,
    });

    elements.fixedExpenseForm.reset();
    elements.expenseInstallments.value = '1';
    state.fixedExpenses.push({
      name: elements.expenseName.value.trim(),
      amount: Number(elements.expenseValue.value),
    });

    elements.fixedExpenseForm.reset();
    saveState();
    renderFinance();
  });

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

attachEvents();
renderFinance();
renderNotes();
renderPasswords();
