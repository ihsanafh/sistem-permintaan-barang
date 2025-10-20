const db = require('../db');

exports.generateReport = async (req, res) => {
  const { startDate, endDate } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Tanggal awal dan tanggal akhir harus diisi.' });
  }

  try {
    const reportData = await db.query(
      `SELECT
         r.processed_date,
         i.item_name,
         r.quantity_requested,
         u.full_name,
         r.department
       FROM requests r
       JOIN items i ON r.item_id = i.item_id
       JOIN users u ON r.user_id = u.user_id
       WHERE r.status = 'Selesai'
         AND r.processed_date >= $1
         AND r.processed_date <= $2
       ORDER BY r.processed_date ASC`,
      [startDate, endDate]
    );

    res.status(200).json(reportData.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};