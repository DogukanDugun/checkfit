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
