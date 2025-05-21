const express = require('express');
const router = express.Router();
const db = require('../db');

// Register Route
router.post('/register', (req, res) => {
  const { name, email, password, role, reg_id } = req.body;

  if (!email.endsWith('@mgit.ac.in')) {
    return res.status(400).json({ error: 'Only @mgit.ac.in emails allowed' });
  }

  const sql = 'INSERT INTO users (name, email, password, role, reg_id) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [name, email, password, role, reg_id], (err) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ message: 'Registered successfully' });
  });
});

// Login Route
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
  db.query(sql, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = results[0];

    // Send back full user details needed for frontend
    res.json({
      role: user.role,
      user_id: user.id,
      email: user.email,
    });
  });
});


module.exports = router;
