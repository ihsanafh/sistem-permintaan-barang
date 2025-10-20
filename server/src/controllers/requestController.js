const db = require('../db');
const { Pool } = require('pg');
require('dotenv').config();

// Buat koneksi pool global (untuk route lain)
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
});

// =========================================================
// CREATE: Karyawan membuat permintaan baru (bisa multi-item)
// =========================================================
exports.createRequest = async (req, res) => {
  const { userId } = req.user;
  const { department, items } = req.body;

  if (!department || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Departemen dan daftar barang harus diisi.' });
  }

  // --- KODE YANG DIPERBAIKI ADA DI SINI ---
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  const client = await pool.connect();
  // --- AKHIR DARI KODE YANG DIPERBAIKI ---

  try {
    await client.query('BEGIN'); // Mulai transaksi

    for (const item of items) {
      if (!item.item_id || !item.quantity_requested || item.quantity_requested <= 0) {
        throw new Error('Setiap barang harus memiliki ID dan jumlah yang valid.');
      }

      // Kunci baris untuk mencegah race condition dan dapatkan nama barang untuk pesan error
      const itemResult = await client.query(
        'SELECT stock_quantity, item_name FROM items WHERE item_id = $1 FOR UPDATE',
        [item.item_id]
      );

      if (itemResult.rows.length === 0) {
        throw new Error(`Barang dengan ID ${item.item_id} tidak ditemukan.`);
      }

      if (itemResult.rows[0].stock_quantity < item.quantity_requested) {
        throw new Error(`Stok untuk "${itemResult.rows[0].item_name}" tidak mencukupi.`);
      }

      await client.query(
        'INSERT INTO requests (user_id, item_id, quantity_requested, department) VALUES ($1, $2, $3, $4)',
        [userId, item.item_id, item.quantity_requested, department]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Semua permintaan berhasil dikirim.' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    // Kirim pesan error yang lebih spesifik ke frontend
    res.status(400).json({ message: err.message || 'Server Error' });
  } finally {
    client.release();
  }
};

// =========================================================
// READ: Karyawan melihat riwayat permintaan pribadinya
// =========================================================
exports.getMyRequests = async (req, res) => {
  const { userId } = req.user;

  try {
    const myRequests = await db.query(
      `SELECT
         r.request_id,
         r.quantity_requested,
         r.status,
         r.department,
         r.request_date,
         i.item_name,
         u.full_name
       FROM requests r
       JOIN items i ON r.item_id = i.item_id
       JOIN users u ON r.user_id = u.user_id
       WHERE r.user_id = $1
       ORDER BY r.request_date DESC`,
      [userId]
    );

    res.status(200).json(myRequests.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// =========================================================
// ADMIN: Mendapatkan semua permintaan dari semua user
// =========================================================
exports.getAllRequests = async (req, res) => {
  try {
    const allRequests = await db.query(
      `SELECT
         r.request_id,
         r.quantity_requested,
         r.status,
         r.department,
         r.request_date,
         i.item_name,
         u.full_name
       FROM requests r
       JOIN items i ON r.item_id = i.item_id
       JOIN users u ON r.user_id = u.user_id
       ORDER BY r.request_date DESC`
    );
    res.status(200).json(allRequests.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// =========================================================
// ADMIN: Memproses permintaan (Setujui atau Tolak)
// =========================================================
exports.processRequest = async (req, res) => {
  const { requestId } = req.params;
  const { action } = req.body; // action bisa "Selesai" atau "Ditolak"

  if (!['Selesai', 'Ditolak'].includes(action)) {
    return res.status(400).json({ message: 'Aksi tidak valid.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const requestResult = await client.query('SELECT * FROM requests WHERE request_id = $1', [requestId]);
    if (requestResult.rows.length === 0) {
      throw new Error('Permintaan tidak ditemukan.');
    }

    const request = requestResult.rows[0];
    if (request.status !== 'Menunggu Persetujuan Admin') {
      throw new Error('Permintaan ini sudah diproses sebelumnya.');
    }

    if (action === 'Selesai') {
      await client.query(
        'UPDATE items SET stock_quantity = stock_quantity - $1 WHERE item_id = $2',
        [request.quantity_requested, request.item_id]
      );
    }

    const updatedRequest = await client.query(
      "UPDATE requests SET status = $1, processed_date = NOW() WHERE request_id = $2 RETURNING *",
      [action, requestId]
    );

    await client.query('COMMIT');
    res.status(200).json({
      message: `Permintaan berhasil diubah menjadi "${action}"`,
      request: updatedRequest.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).json({ message: err.message || 'Server Error' });
  } finally {
    client.release();
  }
};
