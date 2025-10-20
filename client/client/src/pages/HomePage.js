import React from 'react';
import { Link } from 'react-router-dom'; // Import Link untuk navigasi
import './HomePage.css'; // Kita akan buat file CSS ini nanti

function HomePage() {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Sistem Permintaan Barang</h1>
        <p>Silakan pilih menu di bawah ini untuk melanjutkan.</p>
      </header>
      <nav className="home-navigation">
        <Link to="/login" className="nav-button">
          Menu Permintaan Barang
        </Link>
        <Link to="/login-admin" className="nav-button">
          Dashboard Admin
        </Link>
        <Link to="/stok" className="nav-button nav-button-secondary">
          Lihat Stok Barang
        </Link>
      </nav>
    </div>
  );
}

export default HomePage;