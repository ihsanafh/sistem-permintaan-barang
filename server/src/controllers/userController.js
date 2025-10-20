const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Fungsi untuk membuat user baru (oleh admin)
exports.createUser = async (req, res) => {
  const { email, full_name, role } = req.body;
  const defaultPassword = '123456';

  try {
    // Cek apakah email sudah terdaftar
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar.' });
    }

    // Hash password default
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    // Simpan user baru ke database
    const newUser = await db.query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING user_id, email, full_name, role',
      [email, passwordHash, full_name, role || 'Hukum/Pegawai'] // Jika role tidak diisi, default ke 'karyawan'
    );

    res.status(201).json({
      message: 'User berhasil dibuat.',
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Fungsi untuk Login User
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Cari user berdasarkan email
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }
    const user = userResult.rows[0];

    // 2. Bandingkan password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    // 3. Buat JSON Web Token (JWT)
    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Token berlaku selama 24 jam
    );

    // 4. Kirim respons
    res.status(200).json({
      message: 'Login berhasil.',
      token,
      isFirstLogin: user.is_first_login, // Kirim status login pertama
      user: {
         userId: user.user_id,
         fullName: user.full_name,
         email: user.email,
         role: user.role
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};


// Fungsi untuk mengganti password
exports.changePassword = async (req, res) => {
  const { newPassword } = req.body;
  const userId = req.user.userId; // Ambil userId dari token yang sudah diverifikasi middleware

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Password baru harus minimal 6 karakter.' });
  }

  try {
    // Hash password baru
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password dan status is_first_login di database
    await db.query(
      'UPDATE users SET password_hash = $1, is_first_login = FALSE WHERE user_id = $2',
      [newPasswordHash, userId]
    );

    res.status(200).json({ message: 'Password berhasil diperbarui.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// ADMIN: Mendapatkan semua user
exports.getAllUsers = async (req, res) => {
  try {
    const users = await db.query('SELECT user_id, email, full_name, role FROM users ORDER BY user_id ASC');
    res.status(200).json(users.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// ADMIN: Memperbarui akun user
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, role } = req.body;

  try {
    const updatedUser = await db.query(
      'UPDATE users SET full_name = $1, email = $2, role = $3 WHERE user_id = $4 RETURNING user_id, full_name, email, role',
      [full_name, email, role, id]
    );

    if (updatedUser.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }
    res.status(200).json(updatedUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    // Tangani error jika email sudah ada
    if (err.code === '23505') {
        return res.status(400).json({ message: 'Email sudah digunakan oleh akun lain.' });
    }
    res.status(500).send('Server Error');
  }
};