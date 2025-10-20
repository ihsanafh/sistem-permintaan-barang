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
const cors = require('cors');

// Daftar domain yang diizinkan
const allowedOrigins = ['https://sistem-permintaan-app.vercel.app']; // <-- GANTI DENGAN URL FRONTEND ANDA

const corsOptions = {
  origin: (origin, callback) => {
    // Izinkan permintaan jika asalnya ada di daftar atau jika tidak ada asal (seperti dari Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Izinkan semua metode
  credentials: true,
};

// Aktifkan CORS dengan konfigurasi di atas
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