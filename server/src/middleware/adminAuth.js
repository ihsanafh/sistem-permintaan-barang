const adminAuth = (req, res, next) => {
  // Middleware ini harus dijalankan SETELAH authMiddleware
  if (req.user && req.user.role === 'admin') {
    next(); // Lanjutkan jika user adalah admin
  } else {
    res.status(403).json({ message: 'Akses ditolak. Rute ini hanya untuk admin.' });
  }
};

module.exports = adminAuth;