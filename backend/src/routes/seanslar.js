const router = require('express').Router();
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

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

router.post('/', (req, res) => {
  const { variation_id, day_type_id } = req.body;
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO sessions (user_id, variation_id, day_type_id) VALUES (?, ?, ?)'
  ).run(req.user.id, variation_id, day_type_id);
  res.json(db.prepare('SELECT * FROM sessions WHERE id = ?').get(lastInsertRowid));
});

router.post('/:id/tamamla', (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!session) return res.status(404).json({ error: 'Bulunamadı' });

  const { exercises } = req.body;

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
    db.prepare("UPDATE sessions SET completed = 1, performed_at = datetime('now') WHERE id = ?").run(session.id);
  })();

  res.json({ ok: true });
});

module.exports = router;
