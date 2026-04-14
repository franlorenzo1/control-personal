require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_control_personal';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // Must be 32 bytes
const IV_LENGTH = 16; // For AES, this is always 16

function encryptText(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptText(text) {
  try {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    return "ErrorDecrypting";
  }
}

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acceso denegado' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

// --- AUTH ROUTES ---

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'El usuario ya existe' });
        }
        return res.status(500).json({ error: 'Error del servidor' });
      }
      res.json({ message: 'Usuario registrado correctamente' });
    });
  } catch (err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });

  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Error interno' });
    if (!user) return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username });
  });
});

// --- DATA ROUTES ---

// Helper function to turn query into a Promise
const dbAll = (query, params) => new Promise((resolve, reject) => {
  db.all(query, params, (err, rows) => err ? reject(err) : resolve(rows));
});
const dbGet = (query, params) => new Promise((resolve, reject) => {
  db.get(query, params, (err, row) => err ? reject(err) : resolve(row));
});
const dbRun = (query, params) => new Promise((resolve, reject) => {
  db.run(query, params, function(err) { err ? reject(err) : resolve(this) });
});

// Get all state data for a user
app.get('/api/data', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const baseRow = await dbGet(`SELECT amount FROM base_amount WHERE user_id = ?`, [userId]);
    const extraIncomes = await dbAll(`SELECT * FROM extra_incomes WHERE user_id = ?`, [userId]);
    const fixedExpenses = await dbAll(`SELECT * FROM fixed_expenses WHERE user_id = ?`, [userId]);
    const oneTimeExpenses = await dbAll(`SELECT * FROM one_time_expenses WHERE user_id = ?`, [userId]);
    const notes = await dbAll(`SELECT * FROM notes WHERE user_id = ?`, [userId]);
    let passwords = await dbAll(`SELECT * FROM passwords WHERE user_id = ?`, [userId]);
    // Decrypt passwords
    if (passwords && passwords.length > 0) {
      passwords = passwords.map(p => ({ ...p, secret: decryptText(p.secret) }));
    }

    res.json({
      baseAmount: baseRow ? baseRow.amount : 0,
      extraIncomes: extraIncomes || [],
      fixedExpenses: fixedExpenses || [],
      oneTimeExpenses: oneTimeExpenses || [],
      notes: notes || [],
      passwords: passwords || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Error cargando datos' });
  }
});

// Update base amount
app.post('/api/base_amount', authenticateToken, async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.id;
  try {
    await dbRun(`INSERT INTO base_amount (amount, user_id) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET amount=excluded.amount`, [amount, userId]);
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Add items
app.post('/api/extra_incomes', authenticateToken, async (req, res) => {
  const { detail, amount } = req.body;
  try {
    const result = await dbRun(`INSERT INTO extra_incomes (detail, amount, user_id) VALUES (?, ?, ?)`, [detail, amount, req.user.id]);
    res.json({ id: result.lastID, detail, amount });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/fixed_expenses', authenticateToken, async (req, res) => {
  const { name, type, totalAmount, installments, monthlyAmount, firstDebitMonth } = req.body;
  try {
    const result = await dbRun(
      `INSERT INTO fixed_expenses (name, type, totalAmount, installments, monthlyAmount, firstDebitMonth, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
      [name, type, totalAmount, installments, monthlyAmount, firstDebitMonth, req.user.id]
    );
    res.json({ id: result.lastID });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/one_time_expenses', authenticateToken, async (req, res) => {
  const { detail, amount, date } = req.body;
  try {
    const result = await dbRun(`INSERT INTO one_time_expenses (detail, amount, date, user_id) VALUES (?, ?, ?, ?)`, [detail, amount, date, req.user.id]);
    res.json({ id: result.lastID });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/notes', authenticateToken, async (req, res) => {
  const { title, content, createdAt } = req.body;
  try {
    const result = await dbRun(`INSERT INTO notes (title, content, createdAt, user_id) VALUES (?, ?, ?, ?)`, [title, content, createdAt, req.user.id]);
    res.json({ id: result.lastID });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/passwords', authenticateToken, async (req, res) => {
  const { service, user, secret } = req.body;
  try {
    const encryptedSecret = encryptText(secret);
    const result = await dbRun(`INSERT INTO passwords (service, user, secret, user_id) VALUES (?, ?, ?, ?)`, [service, user, encryptedSecret, req.user.id]);
    res.json({ id: result.lastID });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// Update items (Edit)
app.put('/api/notes/:id', authenticateToken, async (req, res) => {
  const { title, content } = req.body;
  try {
    await dbRun(`UPDATE notes SET title = ?, content = ? WHERE id = ? AND user_id = ?`, [title, content, req.params.id, req.user.id]);
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/passwords/:id', authenticateToken, async (req, res) => {
  const { service, user, secret } = req.body;
  try {
    const encryptedSecret = encryptText(secret);
    await dbRun(`UPDATE passwords SET service = ?, user = ?, secret = ? WHERE id = ? AND user_id = ?`, [service, user, encryptedSecret, req.params.id, req.user.id]);
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// Delete items
app.delete('/api/:table/:id', authenticateToken, async (req, res) => {
  const { table, id } = req.params;
  const validTables = ['extra_incomes', 'fixed_expenses', 'one_time_expenses', 'notes', 'passwords'];
  if (!validTables.includes(table)) return res.status(400).json({ error: 'Invalid table' });

  try {
    await dbRun(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`, [id, req.user.id]);
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
