const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all posts
router.get('/posts', (req, res) => {
  const sql = 'SELECT * FROM board ORDER BY timestamp DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching posts:', err);
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }
    res.json(results);
  });
});

// POST a new message
router.post('/posts', (req, res) => {
  const { sender, role, message, type } = req.body;

  if (!sender || !role || !message || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = 'INSERT INTO board (sender, role, message, type) VALUES (?, ?, ?, ?)';
  db.query(sql, [sender, role, message, type], (err) => {
    if (err) {
      console.error('Error inserting post:', err);
      return res.status(500).json({ error: 'Failed to post message' });
    }
    res.json({ message: 'Message posted successfully' });
  });
});

module.exports = router;
