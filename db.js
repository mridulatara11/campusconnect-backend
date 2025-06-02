// db.js
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'aws.connect.psdb.io',
  user: 'your-user-id',
  password: 'your-super-secret-password',
  database: 'campusconnect',
  ssl: {
    rejectUnauthorized: true
  }
});

db.connect((err) => {
  if (err) {
    console.error('MySQL connection failed:', err.message);
    return;
  }
  console.log('✅ MySQL connected!');
});

module.exports = db;
