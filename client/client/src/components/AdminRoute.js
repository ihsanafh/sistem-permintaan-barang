import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');

  if (!token || !userString) {
    // Jika tidak ada token atau data user, lempar ke login admin
    return <Navigate to="/login-admin" />;
  }

  const user = JSON.parse(userString);

  // Jika ada token TAPI peran BUKAN admin, lempar ke halaman utama
  if (user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  // Jika token ada dan peran adalah admin, izinkan akses
  return <Outlet />;
};

export default AdminRoute;