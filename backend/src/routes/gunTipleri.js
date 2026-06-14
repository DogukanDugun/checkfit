const router = require('express').Router();
const db = require('../db/database');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

router.get('/', (req, res) => {
  const dayTypes = db.prepare('SELECT * FROM day_types WHERE user_id = ? ORDER BY order_index').all(req.user.id);

  const result = dayTypes.map(dt => {
    const variations = db.prepare('SELECT * FROM variations WHERE day_type_id = ? ORDER BY order_index').all(dt.id);

    const variationsWithExercises = variations.map(v => ({
      ...v,
      exercises: db.prepare('SELECT * FROM exercises WHERE variation_id = ? AND is_archived = 0 ORDER BY order_index').all(v.id),
    }));

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

    return { ...dt, variations: variationsWithExercises, nextVariation };
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
