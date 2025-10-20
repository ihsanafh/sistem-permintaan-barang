import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './StockPage.css';

function StockPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        // Gunakan environment variable untuk URL API
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/items`);
        setItems(response.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Gagal memuat data barang. Coba lagi nanti.');
        setLoading(false);
      }
    };

    fetchItems();
  }, []); // Efek dijalankan sekali saat komponen dimuat

  if (loading) {
    return (
      <div className="stock-container">
        <p>Memuat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stock-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="stock-container">
      <header className="stock-header">
        <h1>Daftar Stok Barang</h1>
        <Link to="/" className="back-button">Kembali ke Halaman Utama</Link>
      </header>
      <table className="stock-table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Nama Barang</th>
            <th>Jumlah Stok</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.item_id}>
              <td>{index + 1}</td>
              <td>{item.item_name}</td>
              <td>{item.stock_quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StockPage;
