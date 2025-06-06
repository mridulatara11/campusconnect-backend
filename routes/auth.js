const express = require('express');
const router = express.Router();
const db = require('../db');

// ✅ Allowed departments for admin registration
const validDepartments = [
  'cse',
  'it',
  'ece',
  'eee',
  'mech',
  'civil',
  'mct',
  'csbs',
  'mme',
  'et' // csm and csd are treated as et
];

// ✅ Email validation helper
const isValidAdminEmail = (email) => {
  const regex = /^[^@]+_([a-z]+)@mgit\.ac\.in$/i;
  const match = email.match(regex);
  if (!match) return false;

  const dept = match[1].toLowerCase();
  return validDepartments.includes(dept);
};

// ✅ Register Route
router.post('/register', (req, res) => {
  const { name, email, password, role, reg_id } = req.body;

  if (!email.endsWith('@mgit.ac.in')) {
    return res.status(400).json({ error: 'Only @mgit.ac.in emails allowed' });
  }

  if (role === 'admin' && !isValidAdminEmail(email)) {
    return res.status(400).json({ error: 'Invalid department for admin registration.' });
  }

  const sql = 'INSERT INTO users (name, email, password, role, reg_id) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [name, email, password, role, reg_id], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ message: 'Registered successfully' });
  });
});

// ✅ Login Route
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.query(sql, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = results[0];

    res.json({
      role: user.role,
      user_id: user.id,
      email: user.email,
    });
  });
});

module.exports = router;
