const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// In Electron, DB_PATH is set to app.getPath('userData') before this module loads.
// When running with node directly, fall back to the project directory.
const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'data.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

function initDB() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS base_amount (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL DEFAULT 0,
      user_id INTEGER UNIQUE
    )`);
    
    // Initialize base amount row if missing - Removed since it's user specific now

    db.run(`CREATE TABLE IF NOT EXISTS extra_incomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      detail TEXT,
      amount REAL,
      user_id INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS fixed_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      type TEXT,
      totalAmount REAL,
      installments INTEGER,
      monthlyAmount REAL,
      firstDebitMonth TEXT,
      user_id INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS one_time_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      detail TEXT,
      amount REAL,
      date TEXT,
      user_id INTEGER
    )`);

    // Notes table
    db.run(`CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      createdAt TEXT,
      user_id INTEGER
    )`);

    // Passwords table
    db.run(`CREATE TABLE IF NOT EXISTS passwords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service TEXT,
      user TEXT,
      secret TEXT,
      user_id INTEGER
    )`);
  });
}

initDB();

module.exports = db;
