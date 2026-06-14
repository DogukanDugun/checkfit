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

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Sunucu hatası' });
});

const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => console.log(`CheckFit API: http://localhost:${PORT}`));
}

module.exports = app;
