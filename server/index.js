import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const ADVISOR_FILE = path.join(DATA_DIR, 'advisor.json');

const PORT = Number(process.env.PORT || 4000);
const TOKEN_SECRET = process.env.FINLINE_TOKEN_SECRET || 'finline_gfi_portal_secret_key_2026';

fs.mkdirSync(DATA_DIR, { recursive: true });

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash: derived };
}

function verifyPassword(password, salt, expectedHash) {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(expectedHash, 'hex'));
}

function loadAdvisor() {
  if (!fs.existsSync(ADVISOR_FILE)) {
    const { salt, hash } = hashPassword('FINLine2026!');
    const initial = {
      email: 'advisor@finline.com',
      name: 'FIN-Line Senior Strategist',
      salt,
      hash,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(ADVISOR_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(ADVISOR_FILE, 'utf8'));
}

function saveAdvisor(record) {
  fs.writeFileSync(ADVISOR_FILE, JSON.stringify(record, null, 2));
}

function loadSubmissions() {
  if (!fs.existsSync(SUBMISSIONS_FILE)) {
    fs.writeFileSync(SUBMISSIONS_FILE, '[]');
    return [];
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSubmissions(list) {
  const tmp = `${SUBMISSIONS_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2));
  fs.renameSync(tmp, SUBMISSIONS_FILE);
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function requireAdvisor(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Advisor login required' });
  }
  req.advisor = payload;
  next();
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'finline-portal-api' });
});

// PUBLIC: Client submits application
app.post('/api/submissions', (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'Invalid application payload' });
  }
  const now = new Date().toISOString();
  const id = payload.id || 'sub_' + Date.now().toString(36) + '_' + crypto.randomBytes(3).toString('hex');
  const record = {
    ...payload,
    id,
    status: payload.status || 'In Review',
    createdAt: payload.createdAt || now,
    updatedAt: now
  };

  const list = loadSubmissions();
  list.unshift(record);
  saveSubmissions(list);

  return res.status(201).json({ submission: record });
});

// AUTH: Advisor Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const advisor = loadAdvisor();
  const normalizedInput = String(email || '').trim().toLowerCase();

  if (
    normalizedInput !== advisor.email.toLowerCase() ||
    !verifyPassword(String(password || ''), advisor.salt, advisor.hash)
  ) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken({
    email: advisor.email,
    name: advisor.name,
    exp: Date.now() + 1000 * 60 * 60 * 12 // 12 hours
  });

  return res.json({
    token,
    advisor: { email: advisor.email, name: advisor.name }
  });
});

// AUTH: Check current session
app.get('/api/auth/me', requireAdvisor, (req, res) => {
  res.json({ advisor: { email: req.advisor.email, name: req.advisor.name } });
});

// AUTH: Update advisor password
app.post('/api/auth/change-password', requireAdvisor, (req, res) => {
  const { currentPassword, newPassword, newEmail } = req.body || {};
  const advisor = loadAdvisor();

  if (!verifyPassword(String(currentPassword || ''), advisor.salt, advisor.hash)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const { salt, hash } = hashPassword(String(newPassword));
  const updated = {
    ...advisor,
    email: newEmail ? String(newEmail).trim().toLowerCase() : advisor.email,
    salt,
    hash,
    updatedAt: new Date().toISOString()
  };
  saveAdvisor(updated);
  res.json({ ok: true, email: updated.email });
});

// PROTECTED: Advisor lists all client submissions
app.get('/api/submissions', requireAdvisor, (_req, res) => {
  const list = loadSubmissions();
  res.json({ submissions: list });
});

// PROTECTED: Advisor updates a client submission
app.patch('/api/submissions/:id', requireAdvisor, (req, res) => {
  const { id } = req.params;
  const list = loadSubmissions();
  const idx = list.findIndex((item) => item.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  const updated = {
    ...list[idx],
    ...req.body,
    id,
    updatedAt: new Date().toISOString()
  };
  list[idx] = updated;
  saveSubmissions(list);
  res.json({ submission: updated });
});

// PROTECTED: Advisor deletes a client submission
app.delete('/api/submissions/:id', requireAdvisor, (req, res) => {
  const { id } = req.params;
  const list = loadSubmissions();
  const filtered = list.filter((item) => item.id !== id);
  if (filtered.length === list.length) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  saveSubmissions(filtered);
  res.json({ ok: true });
});

// Serve compiled production frontend (dist/)
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
    next();
  });
}

// Ensure advisor credentials file is initialized on startup
loadAdvisor();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FIN-Line Portal server listening on http://0.0.0.0:${PORT} (serving dist: ${fs.existsSync(DIST_DIR)})`);
});
