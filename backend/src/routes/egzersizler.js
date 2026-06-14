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

router.patch('/siralama', (req, res) => {
  const update = db.prepare('UPDATE exercises SET order_index = ? WHERE id = ?');
  db.transaction(() => req.body.items.forEach(({ id, order_index }) => update.run(order_index, id)))();
  res.json({ ok: true });
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

module.exports = router;
