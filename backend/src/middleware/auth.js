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
