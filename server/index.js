const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Pastikan dotenv diimpor

const app = express();
const PORT = process.env.PORT || 5000;

// Import rute
const userRoutes = require('./src/routes/userRoutes');
const itemRoutes = require('./src/routes/itemRoutes');
const requestRoutes = require('./src/routes/requestRoutes');
const reportRoutes = require('./src/routes/reportRoutes');

// Middleware
// Middleware
const corsOptions = {
  origin: 'https://sistem-permintaan-app.vercel.app', // <-- GANTI DENGAN URL FRONTEND ANDA
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json()); // Mem-parsing body request menjadi JSON

// Gunakan Rute
app.use('/api/users', userRoutes); // Semua rute di userRoutes akan diawali dengan /api/users
app.use('/api/items', itemRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/reports', reportRoutes);

// Rute dasar untuk testing
app.get('/', (req, res) => {
  res.send('API Server Sistem Permintaan Barang Berjalan!');
});

// DENGAN BLOK INI:
// Jalankan server HANYA saat development lokal
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Ekspor app agar bisa digunakan oleh Vercel
module.exports = app;