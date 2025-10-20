import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Outlet akan merender komponen anak (misal: DashboardPage) jika otentikasi berhasil
const ProtectedRoute = () => {
  const token = localStorage.getItem('token');

  // Jika ada token, izinkan akses ke halaman yang dituju (Outlet).
  // Jika tidak, arahkan ke halaman login.
  return token ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;