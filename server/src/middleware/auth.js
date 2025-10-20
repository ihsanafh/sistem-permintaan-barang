const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ message: 'Akses ditolak. Tidak ada token.' });
  }

  // Menghapus spasi di awal/akhir dan memecah string
  const parts = authHeader.trim().split(' ');

  // LOG UNTUK DEBUGGING FINAL
  console.log('Header setelah trim:', authHeader.trim());
  console.log('Array "parts" setelah split:', parts);
  console.log('Panjang array "parts":', parts.length);

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Format token salah, harus "Bearer <token>".' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(400).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
};