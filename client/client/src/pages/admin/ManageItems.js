import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../components/RequestForm.css';
import '../../components/RequestHistory.css';

function ManageItems() {
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/items`);
      setItems(response.data);
    } catch (error) {
      console.error('Gagal mengambil data barang:', error);
      alert('Gagal memuat data barang.');
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const resetForm = () => {
    setItemName('');
    setQuantity('');
    setEditingItem(null);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setItemName(item.item_name);
    setQuantity(item.stock_quantity);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const itemData = { item_name: itemName, stock_quantity: parseInt(quantity) };

    try {
      if (editingItem) {
        // --- Mode EDIT ---
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/items/${editingItem.item_id}`,
          itemData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Barang berhasil diperbarui!');
      } else {
        // --- Mode TAMBAH ---
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/items`,
          itemData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Barang berhasil ditambahkan!');
      }
      resetForm();
      fetchItems();
    } catch (err) {
      alert('Operasi gagal.');
      console.error(err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Anda yakin ingin menghapus barang ini?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/items/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Barang berhasil dihapus.');
      fetchItems();
    } catch (err) {
      alert('Gagal menghapus barang.');
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Kelola Inventaris Barang</h2>

      <div className="form-container" style={{ marginBottom: '40px' }}>
        <h3>{editingItem ? 'Edit Barang' : 'Tambah Barang Baru'}</h3>
        <form onSubmit={handleSubmit} className="request-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="item-name">Nama Barang</label>
              <input
                id="item-name"
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="quantity">Jumlah Stok</label>
              <input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="submit-button">
              {editingItem ? 'Simpan Perubahan' : 'Tambah Barang'}
            </button>
            {editingItem && (
              <button
                type="button"
                onClick={resetForm}
                className="action-button reject"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <h3>Daftar Barang Saat Ini</h3>
      <table className="history-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Nama Barang</th>
            <th>Stok Tersisa</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.item_id}>
              <td>{index + 1}</td>
              <td>{item.item_name}</td>
              <td>{item.stock_quantity}</td>
              <td style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleEditClick(item)}
                  className="action-button approve"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteItem(item.item_id)}
                  className="action-button reject"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ManageItems;
