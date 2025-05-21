const express = require('express');
const router = express.Router();
const db = require('../db');

// GET approved events for students
router.get('/events', (req, res) => {
  const sql = 'SELECT * FROM events WHERE status = "approved"';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching events:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});
;

// Register for event
router.post('/register-event', (req, res) => {
  const { studentEmail, eventId } = req.body;

  const sql = 'INSERT INTO registrations (student_email, event_id) VALUES (?, ?)';
  db.query(sql, [studentEmail, eventId], (err) => {
    if (err) {
      console.error('Error registering:', err);
      return res.status(500).json({ error: 'Registration failed' });
    }
    res.json({ message: 'Registered successfully' });
  });
});
// Propose Event
router.post('/propose-event', (req, res) => {
  const { title, description, date, club_name } = req.body;

  const getClubIdSql = 'SELECT id FROM clubs WHERE name = ?';
  db.query(getClubIdSql, [club_name], (err, clubResult) => {
    if (err || clubResult.length === 0) {
      console.error('Club lookup failed', err);
      return res.status(400).json({ error: 'Invalid club name' });
    }
    
    const club_id = clubResult[0].id;
    const insertEventSql = 'INSERT INTO events (title, description, date, club_id, status) VALUES (?, ?, ?, ?, "pending")';

    db.query(insertEventSql, [title, description, date, club_id], (err) => {
      if (err) {
        console.error('Error inserting event:', err);
        return res.status(500).json({ error: 'Event insert failed' });
      }

      const getAdminsSql = 'SELECT email FROM users WHERE role = "admin"';
      db.query(getAdminsSql, (err, admins) => {
        if (err) {
          console.error('Error fetching admins:', err);
          return res.status(500).json({ error: 'Notification error' });
        }
        
        const message = `New event proposed: "${title}"`;
        const notifySql = 'INSERT INTO notifications (receiver_email, message) VALUES ?';
        const values = admins.map(admin => [admin.email, message]);

        db.query(notifySql, [values], (err) => {
          if (err) {
            console.error('Failed to notify admins:', err);
            return res.status(500).json({ error: 'Notification insert failed' });
          }
          
          res.json({ message: 'Event proposal submitted and admins notified' });
        });
      });
    });
  });
});


// Get pending events for admin
router.get('/admin/events', (req, res) => {
  const sql = 'SELECT * FROM events WHERE status = "pending"';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching pending events:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});
router.post('/admin/event-decision', (req, res) => {
  const { eventId, decision } = req.body;

  const updateSql = 'UPDATE events SET status = ? WHERE id = ?';
  db.query(updateSql, [decision, eventId], (err) => {
    if (err) return res.status(500).json({ error: 'Update failed' });

    // Get club_head email from events table
    const getClubHeadSql = `
    SELECT u.email, e.title FROM events e
      JOIN users u ON e.club_id = u.id
      WHERE e.id = ?
    `;
    db.query(getClubHeadSql, [eventId], (err, result) => {
      if (err) return res.status(500).json({ error: 'Email fetch failed' });

      const receiver_email = result[0]?.email;
      const eventTitle = result[0]?.title;
      if (!receiver_email) return res.status(404).json({ error: 'Club head email not found' });
      
      const clubMessage = `Your event "${eventTitle}" was ${decision}.`;
      
      // Notify Club Head
      const notifyClubSql = 'INSERT INTO notifications (receiver_email, message) VALUES (?, ?)';
      db.query(notifyClubSql, [receiver_email, clubMessage], (err) => {
        if (err) return res.status(500).json({ error: 'Notification failed for club head' });
        
        // 🧨 Notify all students if approved
        if (decision === 'approved') {
          const getStudentEmails = 'SELECT email FROM users WHERE role = "student"';
          db.query(getStudentEmails, (err, studentResults) => {
            if (err) return res.status(500).json({ error: 'Fetching student emails failed' });

            const insertNotifications = studentResults.map(student => {
              return [student.email, `New event "${eventTitle}" is now open for registration!`];
            });
            
            const notifyStudentsSql = 'INSERT INTO notifications (receiver_email, message) VALUES ?';
            db.query(notifyStudentsSql, [insertNotifications], (err) => {
              if (err) return res.status(500).json({ error: 'Student notifications failed' });

              res.json({ message: `Event ${decision} & notifications sent` });
            });
          });
        } else {
          res.json({ message: `Event ${decision} & notification sent to club head` });
        }
      });
    });
  });
});

router.get('/notifications/:email', (req, res) => {
  const email = req.params.email;

  const sql = 'SELECT * FROM notifications WHERE receiver_email = ? ORDER BY timestamp DESC';
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error('Notification fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
    res.json(results);
  });
});
// Get single club info
// Get all clubs
router.get('/clubs', (req, res) => {
  db.query('SELECT id, name, logo_url FROM clubs', (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch clubs' });
    res.json(results);
  });
});

// Get club info by ID
router.get('/clubs/:id', (req, res) => {
  const sql = 'SELECT * FROM clubs WHERE id = ?';
  db.query(sql, [req.params.id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Club not found' });
    res.json(results[0]);
  });
});

// Get events by club ID
router.get('/clubs/:id/events', (req, res) => {
  const sql = 'SELECT * FROM events WHERE club_id = ? AND status = "approved" ORDER BY date DESC';
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error fetching events' });
    res.json(results);
  });
});

module.exports = router;
