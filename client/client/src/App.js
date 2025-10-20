import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// Komponen
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Halaman Publik
import HomePage from './pages/HomePage';
import StockPage from './pages/StockPage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';

// Halaman Karyawan (Dilindungi)
import ChangePasswordPage from './pages/ChangePasswordPage';
import DashboardPage from './pages/DashboardPage';

// Halaman Admin (Dilindungi)
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* === RUTE PUBLIK === */}
        <Route path="/" element={<HomePage />} />
        <Route path="/stok" element={<StockPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login-admin" element={<AdminLoginPage />} />

        {/* === RUTE KARYAWAN YANG DILINDUNGI === */}
        <Route element={<ProtectedRoute />}>
          <Route path="/ganti-password" element={<ChangePasswordPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* === RUTE ADMIN YANG DILINDUNGI === */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;