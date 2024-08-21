const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/book-search-engine', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

db.once('open', () => {
  console.log('MongoDB connected successfully');
  mongoose.connection.close();
});