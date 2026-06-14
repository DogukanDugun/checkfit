# CheckFit Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CheckFit Android uygulamasının tam özellikli web versiyonunu React + Express + SQLite ile inşa et.

**Architecture:** Express REST API (port 3001) + React SPA (Vite, port 5173). Geliştirmede Vite proxy ile CORS sorunları aşılır. Veri SQLite'ta user-scoped olarak saklanır. Auth JWT ile httpOnly cookie üzerinden yönetilir.

**Tech Stack:** Node.js 18+, Express, better-sqlite3, bcrypt, jsonwebtoken, cookie-parser; React 18, Vite, React Router v6, Axios, CSS Modules

---

## Dosya Yapısı

```
checkfit/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.js       — SQLite bağlantı singleton
│   │   │   └── schema.js         — CREATE TABLE + migrate
│   │   ├── middleware/
│   │   │   └── auth.js           — JWT doğrulama middleware
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── gunTipleri.js
│   │   │   ├── varyasyonlar.js
│   │   │   ├── egzersizler.js
│   │   │   ├── seanslar.js
│   │   │   └── etiketler.js
│   │   └── index.js              — Express app
│   ├── tests/
│   │   ├── auth.test.js
│   │   └── gunTipleri.test.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.js          — Axios instance + tüm API fonksiyonları
    │   ├── components/
    │   │   ├── Layout/Layout.jsx + Layout.module.css
    │   │   ├── SetGrid/SetGrid.jsx + SetGrid.module.css
    │   │   ├── ExerciseCard/ExerciseCard.jsx + ExerciseCard.module.css
    │   │   └── TagPicker/TagPicker.jsx + TagPicker.module.css
    │   ├── pages/
    │   │   ├── Giris/Giris.jsx + Giris.module.css
    │   │   ├── Kayit/Kayit.jsx + Kayit.module.css
    │   │   ├── Dashboard/Dashboard.jsx + Dashboard.module.css
    │   │   ├── VaryasyonSecimi/VaryasyonSecimi.jsx + .module.css
    │   │   ├── AktifSeans/AktifSeans.jsx + AktifSeans.module.css
    │   │   ├── EgzersizGecmisi/EgzersizGecmisi.jsx + .module.css
    │   │   ├── ProgramYonetimi/ProgramYonetimi.jsx + .module.css
    │   │   └── EtiketYonetimi/EtiketYonetimi.jsx + .module.css
    │   ├── hooks/
    │   │   └── useAuth.js
    │   ├── styles/
    │   │   └── global.css         — CSS değişkenleri, reset, tipografi
    │   ├── App.jsx                — Router + ProtectedRoute
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Task 1: Backend Kurulum

**Files:**
- Create: `backend/package.json`
- Create: `backend/src/index.js`
- Create: `backend/src/db/database.js`
- Create: `backend/src/db/schema.js`

- [ ] **Adım 1: backend klasörünü oluştur ve bağımlılıkları kur**

```bash
cd C:\Users\Doğukan\Desktop\checkfit
mkdir backend
cd backend
npm init -y
npm install express better-sqlite3 bcrypt jsonwebtoken cookie-parser cors
npm install --save-dev nodemon jest supertest
```

- [ ] **Adım 2: package.json scripts ekle**

`backend/package.json` içine scripts:
```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest --runInBand"
  },
  "jest": {
    "testEnvironment": "node"
  }
}
```

- [ ] **Adım 3: DB bağlantı singleton'ı yaz**

`backend/src/db/database.js`:
```js
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../checkfit.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
```

- [ ] **Adım 4: Schema yaz ve migrate et**

`backend/src/db/schema.js`:
```js
const db = require('./database');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS day_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    short_label TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS variations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_type_id INTEGER NOT NULL REFERENCES day_types(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    variation_id INTEGER NOT NULL REFERENCES variations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    planned_sets INTEGER NOT NULL DEFAULT 3,
    is_archived INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    variation_id INTEGER NOT NULL REFERENCES variations(id),
    day_type_id INTEGER NOT NULL REFERENCES day_types(id),
    performed_at TEXT DEFAULT (datetime('now')),
    completed INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS session_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id),
    note TEXT,
    substituted_name TEXT,
    flagged INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS set_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_exercise_id INTEGER NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    weight_kg REAL,
    reps INTEGER,
    completed INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS session_exercise_tags (
    session_exercise_id INTEGER NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (session_exercise_id, tag_id)
  );
`);

module.exports = db;
```

- [ ] **Adım 5: Express app yaz**

`backend/src/index.js`:
```js
require('./db/schema');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/gun-tipleri', require('./routes/gunTipleri'));
app.use('/api/varyasyonlar', require('./routes/varyasyonlar'));
app.use('/api/egzersizler', require('./routes/egzersizler'));
app.use('/api/seanslar', require('./routes/seanslar'));
app.use('/api/etiketler', require('./routes/etiketler'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`CheckFit API: http://localhost:${PORT}`));

module.exports = app;
```

- [ ] **Adım 6: Sunucunun ayağa kalktığını doğrula**

```bash
cd backend && npm run dev
```
Beklenen: `CheckFit API: http://localhost:3001`

---

## Task 2: Auth Middleware + Routes

**Files:**
- Create: `backend/src/middleware/auth.js`
- Create: `backend/src/routes/auth.js`
- Create: `backend/tests/auth.test.js`

- [ ] **Adım 1: auth middleware yaz**

`backend/src/middleware/auth.js`:
```js
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'checkfit-secret-key';

module.exports = function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Oturum gerekli' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Geçersiz oturum' });
  }
};
```

- [ ] **Adım 2: auth routes yaz**

`backend/src/routes/auth.js`:
```js
const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

const SECRET = process.env.JWT_SECRET || 'checkfit-secret-key';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

router.post('/kayit', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
  if (password.length < 6) return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ error: 'Bu kullanıcı adı alınmış' });
  const hash = await bcrypt.hash(password, 10);
  const { lastInsertRowid } = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
  const token = jwt.sign({ id: lastInsertRowid, username }, SECRET);
  res.cookie('token', token, COOKIE_OPTS).json({ id: lastInsertRowid, username });
});

router.post('/giris', async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
  const token = jwt.sign({ id: user.id, username: user.username }, SECRET);
  res.cookie('token', token, COOKIE_OPTS).json({ id: user.id, username: user.username });
});

router.post('/cikis', (_req, res) => {
  res.clearCookie('token').json({ ok: true });
});

router.get('/ben', requireAuth, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
});

module.exports = router;
```

- [ ] **Adım 3: test yaz**

`backend/tests/auth.test.js`:
```js
const request = require('supertest');
const app = require('../src/index');

describe('Auth', () => {
  const user = { username: `test_${Date.now()}`, password: 'sifre123' };

  it('kayıt olur', async () => {
    const res = await request(app).post('/api/auth/kayit').send(user);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe(user.username);
  });

  it('aynı kullanıcı adıyla tekrar kayıt olmaz', async () => {
    const res = await request(app).post('/api/auth/kayit').send(user);
    expect(res.status).toBe(409);
  });

  it('giriş yapar', async () => {
    const res = await request(app).post('/api/auth/giris').send(user);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe(user.username);
  });

  it('yanlış şifreyle giriş yapamaz', async () => {
    const res = await request(app).post('/api/auth/giris').send({ ...user, password: 'yanlis' });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Adım 4: testleri çalıştır**

```bash
cd backend && npm test -- tests/auth.test.js
```
Beklenen: 4 test geçer

- [ ] **Adım 5: commit**

```bash
git add backend/
git commit -m "feat: backend kurulum, schema, auth routes"
```

---

## Task 3: Gün Tipleri + Varyasyonlar Routes

**Files:**
- Create: `backend/src/routes/gunTipleri.js`
- Create: `backend/src/routes/varyasyonlar.js`
- Create: `backend/tests/gunTipleri.test.js`

- [ ] **Adım 1: gunTipleri route yaz**

`backend/src/routes/gunTipleri.js`:
```js
const router = require('express').Router();
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.get('/', (req, res) => {
  const dayTypes = db.prepare(
    'SELECT * FROM day_types WHERE user_id = ? ORDER BY order_index'
  ).all(req.user.id);

  const result = dayTypes.map(dt => {
    const variations = db.prepare(
      'SELECT * FROM variations WHERE day_type_id = ? ORDER BY order_index'
    ).all(dt.id);

    let nextVariation = null;
    if (variations.length > 0) {
      const lastSession = db.prepare(
        'SELECT variation_id FROM sessions WHERE day_type_id = ? AND user_id = ? AND completed = 1 ORDER BY performed_at DESC LIMIT 1'
      ).get(dt.id, req.user.id);

      if (!lastSession) {
        nextVariation = variations[0];
      } else {
        const idx = variations.findIndex(v => v.id === lastSession.variation_id);
        nextVariation = variations[(idx + 1) % variations.length];
      }
    }

    return { ...dt, variations, nextVariation };
  });

  res.json(result);
});

router.post('/', (req, res) => {
  const { name, short_label } = req.body;
  if (!name || !short_label) return res.status(400).json({ error: 'name ve short_label gerekli' });
  const maxOrder = db.prepare('SELECT MAX(order_index) as m FROM day_types WHERE user_id = ?').get(req.user.id).m ?? -1;
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO day_types (user_id, name, short_label, order_index) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, name, short_label, maxOrder + 1);
  res.json(db.prepare('SELECT * FROM day_types WHERE id = ?').get(lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const dt = db.prepare('SELECT * FROM day_types WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!dt) return res.status(404).json({ error: 'Bulunamadı' });
  const { name, short_label } = req.body;
  db.prepare('UPDATE day_types SET name = ?, short_label = ? WHERE id = ?').run(
    name ?? dt.name, short_label ?? dt.short_label, dt.id
  );
  res.json(db.prepare('SELECT * FROM day_types WHERE id = ?').get(dt.id));
});

router.delete('/:id', (req, res) => {
  const dt = db.prepare('SELECT * FROM day_types WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!dt) return res.status(404).json({ error: 'Bulunamadı' });
  db.prepare('DELETE FROM day_types WHERE id = ?').run(dt.id);
  res.json({ ok: true });
});

router.patch('/siralama', (req, res) => {
  const { items } = req.body;
  const update = db.prepare('UPDATE day_types SET order_index = ? WHERE id = ? AND user_id = ?');
  const tx = db.transaction(() => items.forEach(({ id, order_index }) => update.run(order_index, id, req.user.id)));
  tx();
  res.json({ ok: true });
});

module.exports = router;
```

- [ ] **Adım 2: varyasyonlar route yaz**

`backend/src/routes/varyasyonlar.js`:
```js
const router = require('express').Router();
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

function ownsDayType(dayTypeId, userId) {
  return db.prepare('SELECT id FROM day_types WHERE id = ? AND user_id = ?').get(dayTypeId, userId);
}

router.get('/:dayTypeId', (req, res) => {
  if (!ownsDayType(req.params.dayTypeId, req.user.id)) return res.status(404).json({ error: 'Bulunamadı' });
  res.json(db.prepare('SELECT * FROM variations WHERE day_type_id = ? ORDER BY order_index').all(req.params.dayTypeId));
});

router.post('/', (req, res) => {
  const { day_type_id, code } = req.body;
  if (!ownsDayType(day_type_id, req.user.id)) return res.status(404).json({ error: 'Bulunamadı' });
  const maxOrder = db.prepare('SELECT MAX(order_index) as m FROM variations WHERE day_type_id = ?').get(day_type_id).m ?? -1;
  const { lastInsertRowid } = db.prepare('INSERT INTO variations (day_type_id, code, order_index) VALUES (?, ?, ?)').run(day_type_id, code, maxOrder + 1);
  res.json(db.prepare('SELECT * FROM variations WHERE id = ?').get(lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const v = db.prepare('SELECT v.* FROM variations v JOIN day_types dt ON dt.id = v.day_type_id WHERE v.id = ? AND dt.user_id = ?').get(req.params.id, req.user.id);
  if (!v) return res.status(404).json({ error: 'Bulunamadı' });
  db.prepare('UPDATE variations SET code = ? WHERE id = ?').run(req.body.code ?? v.code, v.id);
  res.json(db.prepare('SELECT * FROM variations WHERE id = ?').get(v.id));
});

router.delete('/:id', (req, res) => {
  const v = db.prepare('SELECT v.* FROM variations v JOIN day_types dt ON dt.id = v.day_type_id WHERE v.id = ? AND dt.user_id = ?').get(req.params.id, req.user.id);
  if (!v) return res.status(404).json({ error: 'Bulunamadı' });
  db.prepare('DELETE FROM variations WHERE id = ?').run(v.id);
  res.json({ ok: true });
});

module.exports = router;
```

- [ ] **Adım 3: test yaz**

`backend/tests/gunTipleri.test.js`:
```js
const request = require('supertest');
const app = require('../src/index');

let cookie;
beforeAll(async () => {
  const username = `gt_${Date.now()}`;
  const res = await request(app).post('/api/auth/kayit').send({ username, password: 'sifre123' });
  cookie = res.headers['set-cookie'];
});

describe('Gün Tipleri', () => {
  let dtId;

  it('gün tipi oluşturur', async () => {
    const res = await request(app).post('/api/gun-tipleri').set('Cookie', cookie).send({ name: 'Göğüs/Sırt', short_label: 'GS' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Göğüs/Sırt');
    dtId = res.body.id;
  });

  it('gün tiplerini listeler', async () => {
    const res = await request(app).get('/api/gun-tipleri').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('gün tipini günceller', async () => {
    const res = await request(app).put(`/api/gun-tipleri/${dtId}`).set('Cookie', cookie).send({ name: 'Göğüs' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Göğüs');
  });

  it('gün tipini siler', async () => {
    const res = await request(app).delete(`/api/gun-tipleri/${dtId}`).set('Cookie', cookie);
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Adım 4: testleri çalıştır**

```bash
cd backend && npm test -- tests/gunTipleri.test.js
```
Beklenen: 4 test geçer

- [ ] **Adım 5: commit**

```bash
git commit -am "feat: gun tipleri ve varyasyonlar routes"
```

---

## Task 4: Egzersizler + Etiketler Routes

**Files:**
- Create: `backend/src/routes/egzersizler.js`
- Create: `backend/src/routes/etiketler.js`

- [ ] **Adım 1: egzersizler route yaz**

`backend/src/routes/egzersizler.js`:
```js
const router = require('express').Router();
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

function ownsVariation(variationId, userId) {
  return db.prepare('SELECT v.id FROM variations v JOIN day_types dt ON dt.id = v.day_type_id WHERE v.id = ? AND dt.user_id = ?').get(variationId, userId);
}

function ownsExercise(exerciseId, userId) {
  return db.prepare('SELECT e.* FROM exercises e JOIN variations v ON v.id = e.variation_id JOIN day_types dt ON dt.id = v.day_type_id WHERE e.id = ? AND dt.user_id = ?').get(exerciseId, userId);
}

router.get('/:variationId', (req, res) => {
  if (!ownsVariation(req.params.variationId, req.user.id)) return res.status(404).json({ error: 'Bulunamadı' });
  res.json(db.prepare('SELECT * FROM exercises WHERE variation_id = ? AND is_archived = 0 ORDER BY order_index').all(req.params.variationId));
});

router.post('/', (req, res) => {
  const { variation_id, name, planned_sets = 3 } = req.body;
  if (!ownsVariation(variation_id, req.user.id)) return res.status(404).json({ error: 'Bulunamadı' });
  const maxOrder = db.prepare('SELECT MAX(order_index) as m FROM exercises WHERE variation_id = ?').get(variation_id).m ?? -1;
  const { lastInsertRowid } = db.prepare('INSERT INTO exercises (variation_id, name, planned_sets, order_index) VALUES (?, ?, ?, ?)').run(variation_id, name, planned_sets, maxOrder + 1);
  res.json(db.prepare('SELECT * FROM exercises WHERE id = ?').get(lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const e = ownsExercise(req.params.id, req.user.id);
  if (!e) return res.status(404).json({ error: 'Bulunamadı' });
  db.prepare('UPDATE exercises SET name = ?, planned_sets = ? WHERE id = ?').run(req.body.name ?? e.name, req.body.planned_sets ?? e.planned_sets, e.id);
  res.json(db.prepare('SELECT * FROM exercises WHERE id = ?').get(e.id));
});

router.patch('/:id/arsiv', (req, res) => {
  const e = ownsExercise(req.params.id, req.user.id);
  if (!e) return res.status(404).json({ error: 'Bulunamadı' });
  db.prepare('UPDATE exercises SET is_archived = ? WHERE id = ?').run(e.is_archived ? 0 : 1, e.id);
  res.json(db.prepare('SELECT * FROM exercises WHERE id = ?').get(e.id));
});

router.delete('/:id', (req, res) => {
  const e = ownsExercise(req.params.id, req.user.id);
  if (!e) return res.status(404).json({ error: 'Bulunamadı' });
  db.prepare('DELETE FROM exercises WHERE id = ?').run(e.id);
  res.json({ ok: true });
});

router.patch('/siralama', (req, res) => {
  const update = db.prepare('UPDATE exercises SET order_index = ? WHERE id = ?');
  db.transaction(() => req.body.items.forEach(({ id, order_index }) => update.run(order_index, id)))();
  res.json({ ok: true });
});

module.exports = router;
```

- [ ] **Adım 2: etiketler route yaz**

`backend/src/routes/etiketler.js`:
```js
const router = require('express').Router();
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

const DEFAULT_TAGS = ['Vakitsiz kaldım', 'Ağrı/Sakatlık', 'Ekipman meşguldü', 'Düşük enerji'];

router.get('/', (req, res) => {
  let tags = db.prepare('SELECT * FROM tags WHERE user_id = ? AND is_archived = 0 ORDER BY order_index').all(req.user.id);
  if (tags.length === 0) {
    const insert = db.prepare('INSERT INTO tags (user_id, label, order_index) VALUES (?, ?, ?)');
    db.transaction(() => DEFAULT_TAGS.forEach((label, i) => insert.run(req.user.id, label, i)))();
    tags = db.prepare('SELECT * FROM tags WHERE user_id = ? AND is_archived = 0 ORDER BY order_index').all(req.user.id);
  }
  res.json(tags);
});

router.post('/', (req, res) => {
  const { label } = req.body;
  const maxOrder = db.prepare('SELECT MAX(order_index) as m FROM tags WHERE user_id = ?').get(req.user.id).m ?? -1;
  const { lastInsertRowid } = db.prepare('INSERT INTO tags (user_id, label, order_index) VALUES (?, ?, ?)').run(req.user.id, label, maxOrder + 1);
  res.json(db.prepare('SELECT * FROM tags WHERE id = ?').get(lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const tag = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!tag) return res.status(404).json({ error: 'Bulunamadı' });
  db.prepare('UPDATE tags SET label = ? WHERE id = ?').run(req.body.label ?? tag.label, tag.id);
  res.json(db.prepare('SELECT * FROM tags WHERE id = ?').get(tag.id));
});

router.delete('/:id', (req, res) => {
  const tag = db.prepare('SELECT * FROM tags WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!tag) return res.status(404).json({ error: 'Bulunamadı' });
  db.prepare('UPDATE tags SET is_archived = 1 WHERE id = ?').run(tag.id);
  res.json({ ok: true });
});

module.exports = router;
```

- [ ] **Adım 3: commit**

```bash
git commit -am "feat: egzersizler ve etiketler routes"
```

---

## Task 5: Seanslar Routes

**Files:**
- Create: `backend/src/routes/seanslar.js`

- [ ] **Adım 1: seanslar route yaz**

`backend/src/routes/seanslar.js`:
```js
const router = require('express').Router();
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

// Önceki referans: aynı varyasyon + egzersiz için son tamamlanan seans
router.get('/onceki/:variationId/:exerciseId', (req, res) => {
  const lastSession = db.prepare(
    'SELECT s.id FROM sessions s WHERE s.variation_id = ? AND s.user_id = ? AND s.completed = 1 ORDER BY s.performed_at DESC LIMIT 1'
  ).get(req.params.variationId, req.user.id);

  if (!lastSession) return res.json(null);

  const se = db.prepare('SELECT * FROM session_exercises WHERE session_id = ? AND exercise_id = ?').get(lastSession.id, req.params.exerciseId);
  if (!se) return res.json(null);

  const sets = db.prepare('SELECT * FROM set_logs WHERE session_exercise_id = ? ORDER BY set_number').all(se.id);
  const tags = db.prepare(
    'SELECT t.* FROM tags t JOIN session_exercise_tags st ON st.tag_id = t.id WHERE st.session_exercise_id = ?'
  ).all(se.id);
  const session = db.prepare('SELECT performed_at FROM sessions WHERE id = ?').get(lastSession.id);

  res.json({ ...se, sets, tags, performed_at: session.performed_at });
});

// Egzersiz geçmişi
router.get('/gecmis/:exerciseId', (req, res) => {
  const rows = db.prepare(
    `SELECT s.id as session_id, s.performed_at, se.id as se_id, se.note, se.substituted_name, se.flagged
     FROM sessions s
     JOIN session_exercises se ON se.session_id = s.id
     WHERE s.user_id = ? AND se.exercise_id = ? AND s.completed = 1
     ORDER BY s.performed_at DESC`
  ).all(req.user.id, req.params.exerciseId);

  const result = rows.map(row => {
    const sets = db.prepare('SELECT * FROM set_logs WHERE session_exercise_id = ? ORDER BY set_number').all(row.se_id);
    const tags = db.prepare(
      'SELECT t.* FROM tags t JOIN session_exercise_tags st ON st.tag_id = t.id WHERE st.session_exercise_id = ?'
    ).all(row.se_id);
    return { ...row, sets, tags };
  });

  res.json(result);
});

// Yeni seans oluştur
router.post('/', (req, res) => {
  const { variation_id, day_type_id } = req.body;
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO sessions (user_id, variation_id, day_type_id) VALUES (?, ?, ?)'
  ).run(req.user.id, variation_id, day_type_id);
  res.json(db.prepare('SELECT * FROM sessions WHERE id = ?').get(lastInsertRowid));
});

// Seansı tamamla (tüm veriyi tek seferde yaz)
router.post('/:id/tamamla', (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!session) return res.status(404).json({ error: 'Bulunamadı' });

  const { exercises } = req.body;
  // exercises: [{ exercise_id, note, substituted_name, flagged, tag_ids, sets: [{set_number, weight_kg, reps, completed}] }]

  const insertSE = db.prepare('INSERT INTO session_exercises (session_id, exercise_id, note, substituted_name, flagged) VALUES (?, ?, ?, ?, ?)');
  const insertSet = db.prepare('INSERT INTO set_logs (session_exercise_id, set_number, weight_kg, reps, completed) VALUES (?, ?, ?, ?, ?)');
  const insertTag = db.prepare('INSERT OR IGNORE INTO session_exercise_tags (session_exercise_id, tag_id) VALUES (?, ?)');

  db.transaction(() => {
    for (const ex of exercises) {
      const { lastInsertRowid: seId } = insertSE.run(session.id, ex.exercise_id, ex.note ?? null, ex.substituted_name ?? null, ex.flagged ? 1 : 0);
      for (const set of (ex.sets ?? [])) {
        insertSet.run(seId, set.set_number, set.weight_kg ?? null, set.reps ?? null, set.completed ? 1 : 0);
      }
      for (const tagId of (ex.tag_ids ?? [])) {
        insertTag.run(seId, tagId);
      }
    }
    db.prepare('UPDATE sessions SET completed = 1, performed_at = datetime(\'now\') WHERE id = ?').run(session.id);
  })();

  res.json({ ok: true });
});

module.exports = router;
```

- [ ] **Adım 2: commit**

```bash
git commit -am "feat: seanslar routes (onceki referans, gecmis, tamamla)"
```

---

## Task 6: Frontend Kurulum

**Files:**
- Create: `frontend/` (Vite projesi)
- Create: `frontend/src/styles/global.css`
- Create: `frontend/vite.config.js`

- [ ] **Adım 1: Vite + React projesi oluştur**

```bash
cd C:\Users\Doğukan\Desktop\checkfit
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios react-router-dom
```

- [ ] **Adım 2: vite.config.js yaz (proxy ayarı)**

`frontend/vite.config.js`:
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Adım 3: global CSS değişkenleri yaz**

`frontend/src/styles/global.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@600;700&family=Inter:wght@400;500;600&family=Roboto+Mono:wght@500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg-outer:   #0d0c0a;
  --bg-screen:  #141310;
  --bg-card:    #1d1b16;
  --bg-input:   #27241e;

  --text-main:  #f1ece1;
  --text-muted: #9d988a;
  --text-hint:  #6f6a5e;

  --accent:     #ff7a45;
  --accent-dim: #c9572b;
  --success:    #54d2a6;
  --warning:    #ffc24d;

  --radius-card:  14px;
  --radius-input: 8px;
  --radius-pill:  999px;

  --font-heading: 'Oswald', sans-serif;
  --font-body:    'Inter', sans-serif;
  --font-mono:    'Roboto Mono', monospace;
}

html, body, #root {
  min-height: 100vh;
  background: var(--bg-outer);
  color: var(--text-main);
  font-family: var(--font-body);
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
}

button { cursor: pointer; font-family: var(--font-body); }
input, textarea { font-family: var(--font-body); }
a { color: inherit; text-decoration: none; }

.page {
  max-width: 520px;
  margin: 0 auto;
  padding: 0 16px 100px;
  min-height: 100vh;
  background: var(--bg-screen);
}
```

- [ ] **Adım 4: main.jsx güncelle**

`frontend/src/main.jsx`:
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Adım 5: frontend çalıştığını doğrula**

```bash
cd frontend && npm run dev
```
Beklenen: `http://localhost:5173` açılır, default Vite ekranı görünür.

---

## Task 7: API Client + useAuth Hook

**Files:**
- Create: `frontend/src/api/client.js`
- Create: `frontend/src/hooks/useAuth.js`

- [ ] **Adım 1: Axios client yaz**

`frontend/src/api/client.js`:
```js
import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

export const auth = {
  kayit: (data) => api.post('/auth/kayit', data),
  giris: (data) => api.post('/auth/giris', data),
  cikis: () => api.post('/auth/cikis'),
  ben: () => api.get('/auth/ben'),
};

export const gunTipleri = {
  liste: () => api.get('/gun-tipleri'),
  ekle: (data) => api.post('/gun-tipleri', data),
  guncelle: (id, data) => api.put(`/gun-tipleri/${id}`, data),
  sil: (id) => api.delete(`/gun-tipleri/${id}`),
  sirala: (items) => api.patch('/gun-tipleri/siralama', { items }),
};

export const varyasyonlar = {
  liste: (dayTypeId) => api.get(`/varyasyonlar/${dayTypeId}`),
  ekle: (data) => api.post('/varyasyonlar', data),
  guncelle: (id, data) => api.put(`/varyasyonlar/${id}`, data),
  sil: (id) => api.delete(`/varyasyonlar/${id}`),
};

export const egzersizler = {
  liste: (variationId) => api.get(`/egzersizler/${variationId}`),
  ekle: (data) => api.post('/egzersizler', data),
  guncelle: (id, data) => api.put(`/egzersizler/${id}`, data),
  arsivle: (id) => api.patch(`/egzersizler/${id}/arsiv`),
  sil: (id) => api.delete(`/egzersizler/${id}`),
};

export const seanslar = {
  olustur: (data) => api.post('/seanslar', data),
  tamamla: (id, data) => api.post(`/seanslar/${id}/tamamla`, data),
  onceki: (variationId, exerciseId) => api.get(`/seanslar/onceki/${variationId}/${exerciseId}`),
  gecmis: (exerciseId) => api.get(`/seanslar/gecmis/${exerciseId}`),
};

export const etiketler = {
  liste: () => api.get('/etiketler'),
  ekle: (data) => api.post('/etiketler', data),
  guncelle: (id, data) => api.put(`/etiketler/${id}`, data),
  sil: (id) => api.delete(`/etiketler/${id}`),
};
```

- [ ] **Adım 2: useAuth hook yaz**

`frontend/src/hooks/useAuth.js`:
```js
import { useState, useEffect, createContext, useContext } from 'react';
import { auth } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    auth.ben()
      .then(r => setUser(r.data))
      .catch(() => setUser(null));
  }, []);

  const giris = async (data) => {
    const r = await auth.giris(data);
    setUser(r.data);
  };

  const kayit = async (data) => {
    const r = await auth.kayit(data);
    setUser(r.data);
  };

  const cikis = async () => {
    await auth.cikis();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, giris, kayit, cikis }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

## Task 8: App Router + Layout

**Files:**
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/components/Layout/Layout.jsx`
- Create: `frontend/src/components/Layout/Layout.module.css`

- [ ] **Adım 1: App.jsx yaz**

`frontend/src/App.jsx`:
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout/Layout';
import Giris from './pages/Giris/Giris';
import Kayit from './pages/Kayit/Kayit';
import Dashboard from './pages/Dashboard/Dashboard';
import VaryasyonSecimi from './pages/VaryasyonSecimi/VaryasyonSecimi';
import AktifSeans from './pages/AktifSeans/AktifSeans';
import EgzersizGecmisi from './pages/EgzersizGecmisi/EgzersizGecmisi';
import ProgramYonetimi from './pages/ProgramYonetimi/ProgramYonetimi';
import EtiketYonetimi from './pages/EtiketYonetimi/EtiketYonetimi';

function Protected({ children }) {
  const { user } = useAuth();
  if (user === undefined) return null;
  if (!user) return <Navigate to="/giris" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/giris" element={<Giris />} />
          <Route path="/kayit" element={<Kayit />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Protected><Dashboard /></Protected>} />
            <Route path="/gun/:dayTypeId" element={<Protected><VaryasyonSecimi /></Protected>} />
            <Route path="/seans/:variationId" element={<Protected><AktifSeans /></Protected>} />
            <Route path="/gecmis/:exerciseId" element={<Protected><EgzersizGecmisi /></Protected>} />
            <Route path="/program" element={<Protected><ProgramYonetimi /></Protected>} />
            <Route path="/etiketler" element={<Protected><EtiketYonetimi /></Protected>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

- [ ] **Adım 2: Layout bileşeni yaz**

`frontend/src/components/Layout/Layout.jsx`:
```jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './Layout.module.css';

export default function Layout() {
  const { user, cikis } = useAuth();
  const navigate = useNavigate();

  const handleCikis = async () => {
    await cikis();
    navigate('/giris');
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.logo}>CHECKFIT</span>
        <nav className={styles.nav}>
          <NavLink to="/" end className={({ isActive }) => isActive ? styles.active : ''}>Antrenman</NavLink>
          <NavLink to="/program" className={({ isActive }) => isActive ? styles.active : ''}>Program</NavLink>
          <NavLink to="/etiketler" className={({ isActive }) => isActive ? styles.active : ''}>Etiketler</NavLink>
        </nav>
        <button className={styles.cikis} onClick={handleCikis}>Çıkış</button>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
```

`frontend/src/components/Layout/Layout.module.css`:
```css
.root { min-height: 100vh; background: var(--bg-outer); }

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
  height: 56px;
  background: var(--bg-card);
  border-bottom: 1px solid #2a271f;
  position: sticky;
  top: 0;
  z-index: 10;
  max-width: 100%;
}

.logo {
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 2px;
  flex-shrink: 0;
}

.nav {
  display: flex;
  gap: 4px;
  flex: 1;
}

.nav a {
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  transition: color 0.15s, background 0.15s;
}

.nav a:hover { color: var(--text-main); background: var(--bg-input); }
.active { color: var(--text-main) !important; background: var(--bg-input) !important; }

.cikis {
  background: none;
  border: none;
  color: var(--text-hint);
  font-size: 13px;
  padding: 6px 8px;
  border-radius: var(--radius-input);
  flex-shrink: 0;
}
.cikis:hover { color: var(--text-muted); }

.main { max-width: 520px; margin: 0 auto; }
```

---

## Task 9: Auth Sayfaları (Giriş + Kayıt)

**Files:**
- Create: `frontend/src/pages/Giris/Giris.jsx`
- Create: `frontend/src/pages/Giris/Giris.module.css`
- Create: `frontend/src/pages/Kayit/Kayit.jsx`
- Create: `frontend/src/pages/Kayit/Kayit.module.css`

- [ ] **Adım 1: Giris sayfası yaz**

`frontend/src/pages/Giris/Giris.jsx`:
```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './Giris.module.css';

export default function Giris() {
  const { giris } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const gonder = async (e) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);
    try {
      await giris(form);
      navigate('/');
    } catch (err) {
      setHata(err.response?.data?.error ?? 'Bir hata oluştu');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className={styles.root}>
      <h1 className={styles.logo}>CHECKFIT</h1>
      <form onSubmit={gonder} className={styles.form}>
        <h2 className={styles.baslik}>GİRİŞ</h2>
        {hata && <p className={styles.hata}>{hata}</p>}
        <input
          className={styles.input}
          placeholder="Kullanıcı adı"
          value={form.username}
          onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
          required
        />
        <input
          className={styles.input}
          type="password"
          placeholder="Şifre"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          required
        />
        <button className={styles.btn} disabled={yukleniyor}>
          {yukleniyor ? 'GİRİŞ YAPILIYOR...' : 'GİRİŞ YAP'}
        </button>
        <p className={styles.link}>Hesabın yok mu? <Link to="/kayit">Kayıt ol</Link></p>
      </form>
    </div>
  );
}
```

`frontend/src/pages/Giris/Giris.module.css`:
```css
.root {
  min-height: 100vh;
  background: var(--bg-screen);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.logo {
  font-family: var(--font-heading);
  font-size: 36px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 4px;
  margin-bottom: 40px;
}

.form {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.baslik {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 2px;
  margin-bottom: 4px;
}

.hata {
  background: rgba(255, 122, 69, 0.12);
  border: 1px solid var(--accent-dim);
  color: var(--accent);
  padding: 10px 14px;
  border-radius: var(--radius-input);
  font-size: 14px;
}

.input {
  background: var(--bg-input);
  border: 1px solid #35322a;
  border-radius: var(--radius-input);
  color: var(--text-main);
  padding: 14px 16px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.15s;
}
.input:focus { border-color: var(--accent); }
.input::placeholder { color: var(--text-hint); }

.btn {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-pill);
  padding: 16px;
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  margin-top: 4px;
  transition: background 0.15s;
}
.btn:hover:not(:disabled) { background: var(--accent-dim); }
.btn:disabled { opacity: 0.5; }

.link { text-align: center; font-size: 14px; color: var(--text-muted); }
.link a { color: var(--accent); }
```

- [ ] **Adım 2: Kayit sayfası yaz**

`frontend/src/pages/Kayit/Kayit.jsx`:
```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from '../Giris/Giris.module.css';

export default function Kayit() {
  const { kayit } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const gonder = async (e) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);
    try {
      await kayit(form);
      navigate('/');
    } catch (err) {
      setHata(err.response?.data?.error ?? 'Bir hata oluştu');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className={styles.root}>
      <h1 className={styles.logo}>CHECKFIT</h1>
      <form onSubmit={gonder} className={styles.form}>
        <h2 className={styles.baslik}>KAYIT OL</h2>
        {hata && <p className={styles.hata}>{hata}</p>}
        <input className={styles.input} placeholder="Kullanıcı adı" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
        <input className={styles.input} type="password" placeholder="Şifre (en az 6 karakter)" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
        <button className={styles.btn} disabled={yukleniyor}>{yukleniyor ? 'KAYIT YAPILIYOR...' : 'KAYIT OL'}</button>
        <p className={styles.link}>Hesabın var mı? <Link to="/giris">Giriş yap</Link></p>
      </form>
    </div>
  );
}
```

- [ ] **Adım 3: commit**

```bash
git commit -am "feat: auth sayfaları, layout, router"
```

---

## Task 10: Dashboard

**Files:**
- Create: `frontend/src/pages/Dashboard/Dashboard.jsx`
- Create: `frontend/src/pages/Dashboard/Dashboard.module.css`

- [ ] **Adım 1: Dashboard yaz**

`frontend/src/pages/Dashboard/Dashboard.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gunTipleri } from '../../api/client';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [liste, setListe] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    gunTipleri.liste().then(r => setListe(r.data)).finally(() => setYukleniyor(false));
  }, []);

  if (yukleniyor) return <div className={styles.yukleniyor}>Yükleniyor...</div>;

  if (liste.length === 0) return (
    <div className={styles.bos}>
      <p>Henüz program eklemedin.</p>
      <button className={styles.btn} onClick={() => navigate('/program')}>PROGRAM OLUŞTUR</button>
    </div>
  );

  return (
    <div className="page">
      <h1 className={styles.baslik}>ANTRENMAN</h1>
      <div className={styles.liste}>
        {liste.map(dt => (
          <div key={dt.id} className={styles.kart} onClick={() => navigate(`/gun/${dt.id}`)}>
            <div className={styles.kartUst}>
              <span className={styles.etiket}>{dt.short_label}</span>
              <span className={styles.ad}>{dt.name}</span>
            </div>
            {dt.nextVariation && (
              <div className={styles.siradaki}>
                <span className={styles.siradakiEtiket}>SIRADAKI</span>
                <span className={styles.varyasyon}>{dt.nextVariation.code}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

`frontend/src/pages/Dashboard/Dashboard.module.css`:
```css
.yukleniyor { padding: 40px 16px; color: var(--text-muted); text-align: center; }

.bos {
  padding: 60px 16px;
  text-align: center;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.btn {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-pill);
  padding: 14px 28px;
  font-family: var(--font-heading);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
}
.btn:hover { background: var(--accent-dim); }

.baslik {
  font-family: var(--font-heading);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-hint);
  letter-spacing: 2px;
  padding: 20px 0 12px;
}

.liste { display: flex; flex-direction: column; gap: 10px; }

.kart {
  background: var(--bg-card);
  border-radius: var(--radius-card);
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background 0.15s;
}
.kart:hover { background: #232019; }

.kartUst { display: flex; align-items: center; gap: 12px; }

.etiket {
  background: var(--bg-input);
  color: var(--text-muted);
  font-family: var(--font-heading);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
}

.ad { font-size: 16px; font-weight: 600; color: var(--text-main); }

.siradaki { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.siradakiEtiket { font-size: 10px; font-weight: 600; letter-spacing: 1px; color: var(--text-hint); }
.varyasyon { font-family: var(--font-heading); font-size: 22px; font-weight: 700; color: var(--success); }
```

---

## Task 11: Varyasyon Seçimi

**Files:**
- Create: `frontend/src/pages/VaryasyonSecimi/VaryasyonSecimi.jsx`
- Create: `frontend/src/pages/VaryasyonSecimi/VaryasyonSecimi.module.css`

- [ ] **Adım 1: VaryasyonSecimi yaz**

`frontend/src/pages/VaryasyonSecimi/VaryasyonSecimi.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gunTipleri, seanslar } from '../../api/client';
import styles from './VaryasyonSecimi.module.css';

export default function VaryasyonSecimi() {
  const { dayTypeId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [secili, setSecili] = useState(null);
  const [baslatiliyor, setBaslatiliyor] = useState(false);

  useEffect(() => {
    gunTipleri.liste().then(r => {
      const dt = r.data.find(d => d.id === Number(dayTypeId));
      if (dt) { setData(dt); setSecili(dt.nextVariation?.id); }
    });
  }, [dayTypeId]);

  const baslat = async () => {
    if (!secili) return;
    setBaslatiliyor(true);
    const r = await seanslar.olustur({ variation_id: secili, day_type_id: Number(dayTypeId) });
    navigate(`/seans/${secili}?seansId=${r.data.id}`);
  };

  if (!data) return <div className={styles.yukleniyor}>Yükleniyor...</div>;

  return (
    <div className="page">
      <button className={styles.geri} onClick={() => navigate('/')}>← Geri</button>
      <h1 className={styles.baslik}>{data.name}</h1>
      <p className={styles.alt}>Hangi varyasyonu yapacaksın?</p>
      <div className={styles.liste}>
        {data.variations.map(v => (
          <div
            key={v.id}
            className={`${styles.kart} ${secili === v.id ? styles.secili : ''} ${data.nextVariation?.id === v.id ? styles.siradaki : ''}`}
            onClick={() => setSecili(v.id)}
          >
            <span className={styles.kod}>{v.code}</span>
            {data.nextVariation?.id === v.id && <span className={styles.siradakiBadge}>SIRADAKI</span>}
          </div>
        ))}
      </div>
      <button className={styles.btn} onClick={baslat} disabled={!secili || baslatiliyor}>
        {baslatiliyor ? 'BAŞLATILIYOR...' : 'ANTRENMANÍ BAŞLAT'}
      </button>
    </div>
  );
}
```

`frontend/src/pages/VaryasyonSecimi/VaryasyonSecimi.module.css`:
```css
.yukleniyor { padding: 40px 16px; color: var(--text-muted); text-align: center; }
.geri { background: none; border: none; color: var(--text-muted); font-size: 14px; padding: 16px 0 0; display: block; }
.geri:hover { color: var(--text-main); }
.baslik { font-family: var(--font-heading); font-size: 28px; font-weight: 700; color: var(--text-main); padding: 16px 0 4px; }
.alt { color: var(--text-muted); font-size: 14px; margin-bottom: 24px; }
.liste { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; margin-bottom: 32px; }
.kart {
  background: var(--bg-card);
  border-radius: var(--radius-card);
  padding: 20px 12px;
  text-align: center;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.15s, background 0.15s;
  position: relative;
}
.kart:hover { background: #232019; }
.secili { border-color: var(--accent) !important; }
.siradaki { border-color: var(--success); }
.kod { font-family: var(--font-heading); font-size: 28px; font-weight: 700; color: var(--text-main); }
.siradakiBadge {
  position: absolute;
  top: -8px; left: 50%;
  transform: translateX(-50%);
  background: var(--success);
  color: #0d0c0a;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
}
.btn {
  width: 100%;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-pill);
  padding: 18px;
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  transition: background 0.15s;
}
.btn:hover:not(:disabled) { background: var(--accent-dim); }
.btn:disabled { opacity: 0.5; }
```

---

## Task 12: SetGrid + ExerciseCard + TagPicker Bileşenleri

**Files:**
- Create: `frontend/src/components/SetGrid/SetGrid.jsx + .module.css`
- Create: `frontend/src/components/ExerciseCard/ExerciseCard.jsx + .module.css`
- Create: `frontend/src/components/TagPicker/TagPicker.jsx + .module.css`

- [ ] **Adım 1: SetGrid yaz**

`frontend/src/components/SetGrid/SetGrid.jsx`:
```jsx
import styles from './SetGrid.module.css';

export default function SetGrid({ sets, onceki, onChange }) {
  const updateSet = (i, field, val) => {
    const next = sets.map((s, idx) => idx === i ? { ...s, [field]: val } : s);
    onChange(next);
  };

  const toggleTamamla = (i) => updateSet(i, 'completed', !sets[i].completed);

  return (
    <div className={styles.root}>
      <div className={styles.baslikSatir}>
        <span className={styles.setNo}>#</span>
        <span className={styles.onceki}>Önceki</span>
        <span className={styles.kg}>KG</span>
        <span className={styles.tekrar}>TEKRAR</span>
        <span className={styles.check}></span>
      </div>
      {sets.map((set, i) => {
        const ref = onceki?.sets?.[i];
        const prVar = ref && set.completed &&
          (set.weight_kg > ref.weight_kg || (set.weight_kg === ref.weight_kg && set.reps > ref.reps));
        return (
          <div key={i} className={`${styles.satir} ${set.completed ? styles.tamamlandi : ''} ${prVar ? styles.pr : ''}`}>
            <span className={styles.setNo}>{i + 1}</span>
            <span className={styles.oncekiVal}>
              {ref ? <>{ref.weight_kg ?? 'bw'} × {ref.reps ?? '-'}</> : '-'}
            </span>
            <input
              className={styles.input}
              type="number"
              placeholder="0"
              value={set.weight_kg ?? ''}
              onChange={e => updateSet(i, 'weight_kg', e.target.value === '' ? null : Number(e.target.value))}
              min="0"
            />
            <input
              className={styles.input}
              type="number"
              placeholder="0"
              value={set.reps ?? ''}
              onChange={e => updateSet(i, 'reps', e.target.value === '' ? null : Number(e.target.value))}
              min="0"
            />
            <button className={`${styles.checkBtn} ${set.completed ? styles.checkAktif : ''}`} onClick={() => toggleTamamla(i)}>
              {set.completed ? '✓' : '○'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

`frontend/src/components/SetGrid/SetGrid.module.css`:
```css
.root { display: flex; flex-direction: column; gap: 4px; }
.baslikSatir, .satir {
  display: grid;
  grid-template-columns: 24px 1fr 72px 72px 40px;
  align-items: center;
  gap: 8px;
}
.baslikSatir { padding: 0 4px 4px; }
.baslikSatir span { font-size: 10px; font-weight: 600; letter-spacing: 1px; color: var(--text-hint); text-align: center; }
.satir {
  background: var(--bg-input);
  border-radius: var(--radius-input);
  padding: 8px;
  transition: background 0.15s;
}
.tamamlandi { background: rgba(84, 210, 166, 0.08); }
.pr { background: rgba(84, 210, 166, 0.15); }
.setNo { font-size: 13px; color: var(--text-hint); text-align: center; }
.oncekiVal { font-family: var(--font-mono); font-size: 12px; color: var(--text-hint); text-align: center; }
.onceki { text-align: center; }
.kg, .tekrar { text-align: center; }
.input {
  width: 100%;
  background: transparent;
  border: 1px solid #35322a;
  border-radius: 6px;
  color: var(--text-main);
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 600;
  padding: 6px 4px;
  text-align: center;
  outline: none;
}
.input:focus { border-color: var(--accent); }
.input::placeholder { color: var(--text-hint); }
.checkBtn {
  background: none;
  border: 1px solid #35322a;
  border-radius: 6px;
  color: var(--text-hint);
  font-size: 16px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.checkAktif { background: var(--success); border-color: var(--success); color: #0d0c0a; }
```

- [ ] **Adım 2: TagPicker yaz**

`frontend/src/components/TagPicker/TagPicker.jsx`:
```jsx
import styles from './TagPicker.module.css';

export default function TagPicker({ etiketler, seciliIds, onChange }) {
  const toggle = (id) => {
    const next = seciliIds.includes(id) ? seciliIds.filter(t => t !== id) : [...seciliIds, id];
    onChange(next);
  };

  return (
    <div className={styles.root}>
      {etiketler.map(t => (
        <button
          key={t.id}
          className={`${styles.tag} ${seciliIds.includes(t.id) ? styles.secili : ''}`}
          onClick={() => toggle(t.id)}
          type="button"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
```

`frontend/src/components/TagPicker/TagPicker.module.css`:
```css
.root { display: flex; flex-wrap: wrap; gap: 8px; }
.tag {
  background: var(--bg-input);
  border: 1px solid #35322a;
  border-radius: var(--radius-pill);
  color: var(--text-muted);
  font-size: 13px;
  padding: 6px 14px;
  transition: all 0.15s;
}
.tag:hover { border-color: var(--warning); color: var(--warning); }
.secili { background: rgba(255, 194, 77, 0.12); border-color: var(--warning); color: var(--warning); }
```

- [ ] **Adım 3: ExerciseCard yaz**

`frontend/src/components/ExerciseCard/ExerciseCard.jsx`:
```jsx
import { useState } from 'react';
import SetGrid from '../SetGrid/SetGrid';
import TagPicker from '../TagPicker/TagPicker';
import styles from './ExerciseCard.module.css';

export default function ExerciseCard({ egzersiz, onceki, etiketler, data, onChange }) {
  const [acik, setAcik] = useState(true);

  return (
    <div className={`${styles.root} ${data.flagged ? styles.flagged : ''}`}>
      <div className={styles.header} onClick={() => setAcik(a => !a)}>
        <div className={styles.headerSol}>
          <span className={styles.ad}>{data.substituted_name || egzersiz.name}</span>
          {data.substituted_name && <span className={styles.sub}>({egzersiz.name})</span>}
        </div>
        <span className={styles.acikKapat}>{acik ? '▲' : '▼'}</span>
      </div>

      {acik && (
        <div className={styles.icerik}>
          {onceki && (
            <p className={styles.oncekiInfo}>
              Önceki: {new Date(onceki.performed_at).toLocaleDateString('tr-TR')}
            </p>
          )}

          <SetGrid sets={data.sets} onceki={onceki} onChange={sets => onChange({ ...data, sets })} />

          <div className={styles.bolum}>
            <label className={styles.etiketBaslik}>ETİKETLER</label>
            <TagPicker
              etiketler={etiketler}
              seciliIds={data.tag_ids}
              onChange={tag_ids => onChange({ ...data, tag_ids })}
            />
          </div>

          <div className={styles.bolum}>
            <label className={styles.etiketBaslik}>NOT</label>
            <textarea
              className={styles.textarea}
              placeholder="Bu seans için not..."
              value={data.note}
              onChange={e => onChange({ ...data, note: e.target.value })}
              rows={2}
            />
          </div>

          <div className={styles.bolum}>
            <label className={styles.etiketBaslik}>EGZERSİZ DEĞİŞİKLİĞİ</label>
            <input
              className={styles.inputField}
              placeholder="Farklı egzersiz yaptıysan yaz..."
              value={data.substituted_name}
              onChange={e => onChange({ ...data, substituted_name: e.target.value })}
            />
          </div>

          <div className={styles.bolum}>
            <button
              className={`${styles.flagBtn} ${data.flagged ? styles.flagAktif : ''}`}
              onClick={() => onChange({ ...data, flagged: !data.flagged })}
              type="button"
            >
              {data.flagged ? '⚠ Flaglendi' : '⚠ Flagle'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

`frontend/src/components/ExerciseCard/ExerciseCard.module.css`:
```css
.root {
  background: var(--bg-card);
  border-radius: var(--radius-card);
  margin-bottom: 12px;
  border: 1px solid transparent;
  overflow: hidden;
}
.flagged { border-color: var(--warning); }
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  cursor: pointer;
}
.headerSol { display: flex; flex-direction: column; gap: 2px; }
.ad { font-size: 17px; font-weight: 600; color: var(--text-main); }
.sub { font-size: 12px; color: var(--text-muted); }
.acikKapat { color: var(--text-hint); font-size: 12px; }
.icerik { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 16px; }
.oncekiInfo { font-size: 12px; color: var(--text-muted); }
.bolum { display: flex; flex-direction: column; gap: 8px; }
.etiketBaslik { font-size: 10px; font-weight: 600; letter-spacing: 1px; color: var(--text-hint); }
.textarea {
  background: var(--bg-input);
  border: 1px solid #35322a;
  border-radius: var(--radius-input);
  color: var(--text-main);
  padding: 10px 12px;
  font-size: 14px;
  resize: none;
  outline: none;
}
.textarea:focus { border-color: var(--accent); }
.textarea::placeholder { color: var(--text-hint); }
.inputField {
  background: var(--bg-input);
  border: 1px solid #35322a;
  border-radius: var(--radius-input);
  color: var(--text-main);
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
}
.inputField:focus { border-color: var(--accent); }
.inputField::placeholder { color: var(--text-hint); }
.flagBtn {
  background: none;
  border: 1px solid #35322a;
  border-radius: var(--radius-pill);
  color: var(--text-muted);
  font-size: 13px;
  padding: 6px 14px;
  align-self: flex-start;
}
.flagAktif { background: rgba(255, 194, 77, 0.12); border-color: var(--warning); color: var(--warning); }
```

- [ ] **Adım 4: commit**

```bash
git commit -am "feat: SetGrid, ExerciseCard, TagPicker bileşenleri"
```

---

## Task 13: Aktif Seans Sayfası

**Files:**
- Create: `frontend/src/pages/AktifSeans/AktifSeans.jsx`
- Create: `frontend/src/pages/AktifSeans/AktifSeans.module.css`

- [ ] **Adım 1: AktifSeans yaz**

`frontend/src/pages/AktifSeans/AktifSeans.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { egzersizler, seanslar, etiketler as etiketApi } from '../../api/client';
import ExerciseCard from '../../components/ExerciseCard/ExerciseCard';
import styles from './AktifSeans.module.css';

function bosSetler(n) {
  return Array.from({ length: n }, (_, i) => ({ set_number: i + 1, weight_kg: null, reps: null, completed: false }));
}

export default function AktifSeans() {
  const { variationId } = useParams();
  const [searchParams] = useSearchParams();
  const seansId = searchParams.get('seansId');
  const navigate = useNavigate();

  const [egzList, setEgzList] = useState([]);
  const [etiketList, setEtiketList] = useState([]);
  const [sesData, setSesData] = useState([]);
  const [oncekiler, setOncekiler] = useState({});
  const [yukleniyor, setYukleniyor] = useState(true);
  const [bitiyor, setBitiyor] = useState(false);

  useEffect(() => {
    Promise.all([
      egzersizler.liste(variationId),
      etiketApi.liste(),
    ]).then(([egzRes, etRes]) => {
      const egz = egzRes.data;
      setEgzList(egz);
      setEtiketList(etRes.data);
      setSesData(egz.map(e => ({
        exercise_id: e.id,
        sets: bosSetler(e.planned_sets),
        tag_ids: [],
        note: '',
        substituted_name: '',
        flagged: false,
      })));
      Promise.all(egz.map(e => seanslar.onceki(variationId, e.id))).then(results => {
        const map = {};
        egz.forEach((e, i) => { map[e.id] = results[i].data; });
        setOncekiler(map);
      });
    }).finally(() => setYukleniyor(false));
  }, [variationId]);

  const updateEgz = (i, data) => setSesData(s => s.map((d, idx) => idx === i ? data : d));

  const bitir = async () => {
    setBitiyor(true);
    await seanslar.tamamla(seansId, { exercises: sesData });
    navigate('/');
  };

  if (yukleniyor) return <div className={styles.yukleniyor}>Yükleniyor...</div>;

  return (
    <div className="page">
      <button className={styles.geri} onClick={() => navigate(-1)}>← Geri</button>
      <h1 className={styles.baslik}>SEANS</h1>
      {egzList.map((e, i) => (
        <ExerciseCard
          key={e.id}
          egzersiz={e}
          onceki={oncekiler[e.id]}
          etiketler={etiketList}
          data={sesData[i]}
          onChange={data => updateEgz(i, data)}
        />
      ))}
      <div className={styles.altBar}>
        <button className={styles.bitirBtn} onClick={bitir} disabled={bitiyor}>
          {bitiyor ? 'KAYDEDİLİYOR...' : 'SEANSI BİTİR'}
        </button>
      </div>
    </div>
  );
}
```

`frontend/src/pages/AktifSeans/AktifSeans.module.css`:
```css
.yukleniyor { padding: 40px 16px; color: var(--text-muted); text-align: center; }
.geri { background: none; border: none; color: var(--text-muted); font-size: 14px; padding: 16px 0 0; display: block; }
.geri:hover { color: var(--text-main); }
.baslik { font-family: var(--font-heading); font-size: 13px; font-weight: 600; color: var(--text-hint); letter-spacing: 2px; padding: 16px 0 16px; }
.altBar {
  position: fixed;
  bottom: 0; left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 520px;
  padding: 12px 16px;
  background: linear-gradient(to top, var(--bg-screen) 80%, transparent);
}
.bitirBtn {
  width: 100%;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-pill);
  padding: 18px;
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
  transition: background 0.15s;
}
.bitirBtn:hover:not(:disabled) { background: var(--accent-dim); }
.bitirBtn:disabled { opacity: 0.6; }
```

---

## Task 14: Egzersiz Geçmişi

**Files:**
- Create: `frontend/src/pages/EgzersizGecmisi/EgzersizGecmisi.jsx`
- Create: `frontend/src/pages/EgzersizGecmisi/EgzersizGecmisi.module.css`

- [ ] **Adım 1: EgzersizGecmisi yaz**

`frontend/src/pages/EgzersizGecmisi/EgzersizGecmisi.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { seanslar } from '../../api/client';
import styles from './EgzersizGecmisi.module.css';

export default function EgzersizGecmisi() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const [gecmis, setGecmis] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    seanslar.gecmis(exerciseId).then(r => setGecmis(r.data)).finally(() => setYukleniyor(false));
  }, [exerciseId]);

  if (yukleniyor) return <div className={styles.yukleniyor}>Yükleniyor...</div>;

  return (
    <div className="page">
      <button className={styles.geri} onClick={() => navigate(-1)}>← Geri</button>
      <h1 className={styles.baslik}>GEÇMİŞ</h1>
      {gecmis.length === 0 && <p className={styles.bos}>Henüz seans kaydı yok.</p>}
      {gecmis.map((kayit, i) => (
        <div key={i} className={styles.kart}>
          <p className={styles.tarih}>{new Date(kayit.performed_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          {kayit.substituted_name && <p className={styles.sub}>Yerine: {kayit.substituted_name}</p>}
          <div className={styles.setler}>
            {kayit.sets.filter(s => s.completed).map((s, j) => (
              <span key={j} className={styles.set}>{s.weight_kg ?? 'bw'} × {s.reps}</span>
            ))}
          </div>
          {kayit.note && <p className={styles.not}>{kayit.note}</p>}
          {kayit.tags?.length > 0 && (
            <div className={styles.tags}>
              {kayit.tags.map(t => <span key={t.id} className={styles.tag}>{t.label}</span>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

`frontend/src/pages/EgzersizGecmisi/EgzersizGecmisi.module.css`:
```css
.yukleniyor { padding: 40px 16px; color: var(--text-muted); text-align: center; }
.geri { background: none; border: none; color: var(--text-muted); font-size: 14px; padding: 16px 0 0; display: block; }
.baslik { font-family: var(--font-heading); font-size: 13px; font-weight: 600; color: var(--text-hint); letter-spacing: 2px; padding: 16px 0 16px; }
.bos { color: var(--text-muted); text-align: center; padding: 40px 0; }
.kart { background: var(--bg-card); border-radius: var(--radius-card); padding: 16px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 8px; }
.tarih { font-size: 13px; font-weight: 600; color: var(--text-muted); }
.sub { font-size: 12px; color: var(--warning); }
.setler { display: flex; flex-wrap: wrap; gap: 8px; }
.set { font-family: var(--font-mono); font-size: 15px; font-weight: 600; color: var(--text-main); background: var(--bg-input); padding: 4px 10px; border-radius: var(--radius-input); }
.not { font-size: 13px; color: var(--text-muted); font-style: italic; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag { font-size: 12px; color: var(--warning); background: rgba(255, 194, 77, 0.1); padding: 3px 10px; border-radius: var(--radius-pill); }
```

---

## Task 15: Program Yönetimi

**Files:**
- Create: `frontend/src/pages/ProgramYonetimi/ProgramYonetimi.jsx`
- Create: `frontend/src/pages/ProgramYonetimi/ProgramYonetimi.module.css`

- [ ] **Adım 1: ProgramYonetimi yaz**

`frontend/src/pages/ProgramYonetimi/ProgramYonetimi.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { gunTipleri as gtApi, varyasyonlar as varApi, egzersizler as egzApi } from '../../api/client';
import styles from './ProgramYonetimi.module.css';

export default function ProgramYonetimi() {
  const [liste, setListe] = useState([]);
  const [acikDt, setAcikDt] = useState(null);
  const [acikVar, setAcikVar] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  const yukle = () => gtApi.liste().then(r => setListe(r.data)).finally(() => setYukleniyor(false));
  useEffect(() => { yukle(); }, []);

  const dtEkle = async () => {
    const name = prompt('Gün tipi adı:');
    if (!name) return;
    const label = prompt('Kısa etiket (2-3 harf):');
    if (!label) return;
    await gtApi.ekle({ name, short_label: label });
    yukle();
  };

  const dtSil = async (id) => {
    if (!confirm('Bu gün tipini ve tüm içeriğini silmek istiyor musun?')) return;
    await gtApi.sil(id);
    yukle();
  };

  const varEkle = async (dayTypeId) => {
    const code = prompt('Varyasyon kodu (örn: 1A, 2B):');
    if (!code) return;
    await varApi.ekle({ day_type_id: dayTypeId, code });
    yukle();
  };

  const varSil = async (id) => {
    if (!confirm('Bu varyasyonu silmek istiyor musun?')) return;
    await varApi.sil(id);
    yukle();
  };

  const egzEkle = async (variationId) => {
    const name = prompt('Egzersiz adı:');
    if (!name) return;
    const setsStr = prompt('Kaç set? (varsayılan 3):', '3');
    const planned_sets = parseInt(setsStr) || 3;
    await egzApi.ekle({ variation_id: variationId, name, planned_sets });
    yukle();
  };

  const egzSil = async (id) => {
    if (!confirm('Bu egzersizi silmek istiyor musun?')) return;
    await egzApi.sil(id);
    yukle();
  };

  if (yukleniyor) return <div className={styles.yukleniyor}>Yükleniyor...</div>;

  return (
    <div className="page">
      <h1 className={styles.baslik}>PROGRAM YÖNETİMİ</h1>

      {liste.map(dt => (
        <div key={dt.id} className={styles.dtKart}>
          <div className={styles.dtHeader}>
            <div className={styles.dtSol}>
              <span className={styles.dtEtiket}>{dt.short_label}</span>
              <span className={styles.dtAd}>{dt.name}</span>
            </div>
            <div className={styles.aksiyonlar}>
              <button className={styles.ekleBtn} onClick={() => varEkle(dt.id)}>+ Varyasyon</button>
              <button className={styles.silBtn} onClick={() => dtSil(dt.id)}>×</button>
            </div>
          </div>

          {dt.variations.map(v => (
            <div key={v.id} className={styles.varKart}>
              <div className={styles.varHeader}>
                <span className={styles.varKod}>{v.code}</span>
                <div className={styles.aksiyonlar}>
                  <button className={styles.ekleBtn} onClick={() => egzEkle(v.id)}>+ Egzersiz</button>
                  <button className={styles.silBtn} onClick={() => varSil(v.id)}>×</button>
                </div>
              </div>
              {v.exercises?.map(e => (
                <div key={e.id} className={styles.egzSatir}>
                  <span className={styles.egzAd}>{e.name}</span>
                  <span className={styles.egzSet}>{e.planned_sets} set</span>
                  <button className={styles.silBtn} onClick={() => egzSil(e.id)}>×</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      <button className={styles.buyukEkleBtn} onClick={dtEkle}>+ GÜN TİPİ EKLE</button>
    </div>
  );
}
```

`frontend/src/pages/ProgramYonetimi/ProgramYonetimi.module.css`:
```css
.yukleniyor { padding: 40px 16px; color: var(--text-muted); text-align: center; }
.baslik { font-family: var(--font-heading); font-size: 13px; font-weight: 600; color: var(--text-hint); letter-spacing: 2px; padding: 20px 0 16px; }
.dtKart { background: var(--bg-card); border-radius: var(--radius-card); margin-bottom: 12px; overflow: hidden; }
.dtHeader { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; }
.dtSol { display: flex; align-items: center; gap: 10px; }
.dtEtiket { font-family: var(--font-heading); font-size: 12px; font-weight: 700; background: var(--bg-input); color: var(--text-muted); padding: 3px 8px; border-radius: var(--radius-pill); }
.dtAd { font-size: 16px; font-weight: 600; color: var(--text-main); }
.aksiyonlar { display: flex; gap: 8px; align-items: center; }
.ekleBtn { background: none; border: 1px solid #35322a; border-radius: var(--radius-pill); color: var(--accent); font-size: 12px; padding: 4px 10px; }
.ekleBtn:hover { background: rgba(255, 122, 69, 0.1); }
.silBtn { background: none; border: none; color: var(--text-hint); font-size: 18px; padding: 2px 6px; }
.silBtn:hover { color: #e55; }
.varKart { background: var(--bg-input); margin: 0 12px 10px; border-radius: var(--radius-input); padding: 10px 12px; }
.varHeader { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.varKod { font-family: var(--font-heading); font-size: 20px; font-weight: 700; color: var(--success); }
.egzSatir { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-top: 1px solid #35322a; }
.egzAd { flex: 1; font-size: 14px; color: var(--text-main); }
.egzSet { font-size: 12px; color: var(--text-muted); }
.buyukEkleBtn {
  width: 100%;
  background: none;
  border: 2px dashed #35322a;
  border-radius: var(--radius-card);
  color: var(--text-muted);
  font-family: var(--font-heading);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 1px;
  padding: 18px;
  margin: 8px 0 24px;
  transition: all 0.15s;
}
.buyukEkleBtn:hover { border-color: var(--accent); color: var(--accent); }
```

**Not:** Program sayfası egzersizleri göstermek için `variations` içinde `exercises` bekliyor ama `GET /api/gun-tipleri` sadece `variations` döner. Egzersizleri de dahil etmek için `gunTipleri.js` route'unu güncelle:

`backend/src/routes/gunTipleri.js` — `GET /` içindeki `result` map'inde variations'a exercises'i ekle:
```js
const result = dayTypes.map(dt => {
  const variations = db.prepare('SELECT * FROM variations WHERE day_type_id = ? ORDER BY order_index').all(dt.id);

  const variationsWithExercises = variations.map(v => ({
    ...v,
    exercises: db.prepare('SELECT * FROM exercises WHERE variation_id = ? AND is_archived = 0 ORDER BY order_index').all(v.id),
  }));

  // ... nextVariation hesabı aynı kalır, sadece variations -> variationsWithExercises
  return { ...dt, variations: variationsWithExercises, nextVariation };
});
```

---

## Task 16: Etiket Yönetimi

**Files:**
- Create: `frontend/src/pages/EtiketYonetimi/EtiketYonetimi.jsx`
- Create: `frontend/src/pages/EtiketYonetimi/EtiketYonetimi.module.css`

- [ ] **Adım 1: EtiketYonetimi yaz**

`frontend/src/pages/EtiketYonetimi/EtiketYonetimi.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { etiketler as etApi } from '../../api/client';
import styles from './EtiketYonetimi.module.css';

export default function EtiketYonetimi() {
  const [liste, setListe] = useState([]);
  const [yeniLabel, setYeniLabel] = useState('');

  const yukle = () => etApi.liste().then(r => setListe(r.data));
  useEffect(() => { yukle(); }, []);

  const ekle = async (e) => {
    e.preventDefault();
    if (!yeniLabel.trim()) return;
    await etApi.ekle({ label: yeniLabel.trim() });
    setYeniLabel('');
    yukle();
  };

  const sil = async (id) => {
    await etApi.sil(id);
    yukle();
  };

  return (
    <div className="page">
      <h1 className={styles.baslik}>ETİKETLER</h1>
      <form onSubmit={ekle} className={styles.form}>
        <input
          className={styles.input}
          placeholder="Yeni etiket..."
          value={yeniLabel}
          onChange={e => setYeniLabel(e.target.value)}
        />
        <button className={styles.ekleBtn} type="submit">Ekle</button>
      </form>
      <div className={styles.liste}>
        {liste.map(t => (
          <div key={t.id} className={styles.kart}>
            <span className={styles.label}>{t.label}</span>
            <button className={styles.silBtn} onClick={() => sil(t.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

`frontend/src/pages/EtiketYonetimi/EtiketYonetimi.module.css`:
```css
.baslik { font-family: var(--font-heading); font-size: 13px; font-weight: 600; color: var(--text-hint); letter-spacing: 2px; padding: 20px 0 16px; }
.form { display: flex; gap: 10px; margin-bottom: 20px; }
.input { flex: 1; background: var(--bg-input); border: 1px solid #35322a; border-radius: var(--radius-input); color: var(--text-main); padding: 12px 14px; font-size: 15px; outline: none; }
.input:focus { border-color: var(--accent); }
.input::placeholder { color: var(--text-hint); }
.ekleBtn { background: var(--accent); color: #fff; border: none; border-radius: var(--radius-input); padding: 12px 20px; font-weight: 600; font-size: 14px; }
.ekleBtn:hover { background: var(--accent-dim); }
.liste { display: flex; flex-direction: column; gap: 8px; }
.kart { background: var(--bg-card); border-radius: var(--radius-input); padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; }
.label { font-size: 15px; color: var(--text-main); }
.silBtn { background: none; border: none; color: var(--text-hint); font-size: 20px; padding: 0 4px; }
.silBtn:hover { color: #e55; }
```

- [ ] **Adım 2: final commit**

```bash
git commit -am "feat: tüm sayfalar tamamlandı"
```

---

## Task 17: Lokal Test

- [ ] **Adım 1: Backend'i başlat**

```bash
cd C:\Users\Doğukan\Desktop\checkfit\backend && npm run dev
```
Beklenen: `CheckFit API: http://localhost:3001`

- [ ] **Adım 2: Frontend'i başlat (yeni terminal)**

```bash
cd C:\Users\Doğukan\Desktop\checkfit\frontend && npm run dev
```
Beklenen: `http://localhost:5173` çalışıyor

- [ ] **Adım 3: Manuel test akışı**

Tarayıcıda aşağıdaki akışı test et:
1. `/kayit` → kullanıcı adı + şifre ile kayıt ol → dashboard'a yönlenir
2. `/program` → gün tipi ekle → varyasyon ekle → egzersiz ekle
3. `/` → Dashboard'da gün tipi görünür, "SIRADAKI" badgeli varyasyon görünür
4. Gün tipine tıkla → varyasyon seçim ekranı → "ANTRENMANÍ BAŞLAT"
5. Seans ekranı → set grid doldur → egzersizi tamamla → "SEANSI BİTİR"
6. Tekrar aynı gün tipine tıkla → rotasyon bir sonraki varyasyona geçmiş olmalı
7. `/etiketler` → varsayılan etiketler görünür, yeni ekle
8. Çıkış yap → `/giris`'e yönlendirir → giris yap → dashboard'a döner

- [ ] **Adım 4: Sorunları not et, gerekirse düzelt**

---

## Özet

| Task | İçerik |
|------|--------|
| 1 | Backend kurulum, DB schema, Express app |
| 2 | Auth middleware + routes + testler |
| 3 | Gün tipleri + varyasyonlar routes |
| 4 | Egzersizler + etiketler routes |
| 5 | Seanslar routes |
| 6 | Frontend Vite kurulum, CSS değişkenleri |
| 7 | Axios client, useAuth hook |
| 8 | App router, Layout, ProtectedRoute |
| 9 | Giriş + Kayıt sayfaları |
| 10 | Dashboard |
| 11 | Varyasyon seçimi |
| 12 | SetGrid + ExerciseCard + TagPicker |
| 13 | Aktif seans sayfası |
| 14 | Egzersiz geçmişi |
| 15 | Program yönetimi |
| 16 | Etiket yönetimi |
| 17 | Lokal test |
