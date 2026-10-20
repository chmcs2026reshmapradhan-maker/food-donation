require('dns').setServers(['8.8.8.8','8.8.4.4']);
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/donation', require('./routes/donations'));
app.use('/api/request', require('./routes/requests'));
app.use('/api/deliveries', require('./routes/deliveries'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/', (req, res) => res.send('API running'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on ${PORT}`))