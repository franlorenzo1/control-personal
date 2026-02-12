const STORAGE_KEY = 'controlPersonalData';

const state = loadState();

const elements = {
  incomeForm: document.querySelector('#income-form'),
  totalAmount: document.querySelector('#total-amount'),
  addMoneyForm: document.querySelector('#add-money-form'),
  addMoney: document.querySelector('#add-money'),
  fixedExpenseForm: document.querySelector('#fixed-expense-form'),
  expenseName: document.querySelector('#expense-name'),
  expenseValue: document.querySelector('#expense-value'),
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
    state.totalAmount = Number(elements.totalAmount.value);
    elements.incomeForm.reset();
    saveState();
    renderFinance();
  });

  elements.addMoneyForm.addEventListener('submit', (event) => {
    event.preventDefault();
    state.totalAmount += Number(elements.addMoney.value);
    elements.addMoneyForm.reset();
    saveState();
    renderFinance();
  });

  elements.fixedExpenseForm.addEventListener('submit', (event) => {
    event.preventDefault();

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
