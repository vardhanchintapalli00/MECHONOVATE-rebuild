// MECHONOVATE backend
// Currently just serves the static frontend. Registration is handled by an
// external Google Form (see js/main.js -> GOOGLE_FORM_URL) rather than this
// server, so there's no API here right now — add routes below if/when you
// need another dynamic feature.

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

app.use(cors());
app.use(express.json());
app.use(express.static(FRONTEND_DIR));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Fallback: send index.html for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`MECHONOVATE server running at http://localhost:${PORT}`);
});
