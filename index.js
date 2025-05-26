const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const boardRoutes = require('./routes/board');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api', authRoutes);
app.use('/api', eventRoutes);
app.use('/api', boardRoutes);

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
