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
