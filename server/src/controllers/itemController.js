const db = require('../db');

// CREATE: Menambah item baru (Admin)
exports.createItem = async (req, res) => {
  const { item_name, stock_quantity } = req.body;
  if (!item_name || stock_quantity === undefined) {
    return res.status(400).json({ message: 'Nama item dan kuantitas stok diperlukan.' });
  }

  try {
    const newItem = await db.query(
      'INSERT INTO items (item_name, stock_quantity) VALUES ($1, $2) RETURNING *',
      [item_name, parseInt(stock_quantity)]
    );
    res.status(201).json(newItem.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// READ: Mendapatkan semua item (Publik)
exports.getAllItems = async (req, res) => {
  try {
    const allItems = await db.query('SELECT * FROM items ORDER BY item_id ASC');
    res.status(200).json(allItems.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// UPDATE: Memperbarui item (Admin)
exports.updateItem = async (req, res) => {
  const { id } = req.params;
  const { item_name, stock_quantity } = req.body;
  if (!item_name || stock_quantity === undefined) {
    return res.status(400).json({ message: 'Nama item dan kuantitas stok diperlukan.' });
  }

  try {
    const updatedItem = await db.query(
      'UPDATE items SET item_name = $1, stock_quantity = $2 WHERE item_id = $3 RETURNING *',
      [item_name, parseInt(stock_quantity), id]
    );

    if (updatedItem.rows.length === 0) {
      return res.status(404).json({ message: 'Item tidak ditemukan.' });
    }
    res.status(200).json(updatedItem.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// DELETE: Menghapus item (Admin)
exports.deleteItem = async (req, res) => {
  const { id } = req.params;
  try {
    const deleteOp = await db.query('DELETE FROM items WHERE item_id = $1 RETURNING *', [id]);
    if (deleteOp.rowCount === 0) {
        return res.status(404).json({ message: 'Item tidak ditemukan.' });
    }
    res.status(200).json({ message: 'Item berhasil dihapus.' });
  } catch (err) {
    // Error ini bisa terjadi jika item sudah pernah diminta oleh user (foreign key constraint)
    console.error(err.message);
    res.status(500).json({ message: 'Server Error. Item ini mungkin tidak dapat dihapus karena memiliki riwayat permintaan.' });
  }
};