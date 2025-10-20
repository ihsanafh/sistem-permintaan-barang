import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoginForm from '../components/LoginForm';

function LoginPage() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/login`, {
        email,
        password,
      });

      // Simpan token dan data user di localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Cek apakah ini login pertama
      if (response.data.isFirstLogin) {
        // Arahkan ke halaman ganti password jika login pertama
        navigate('/ganti-password');
      } else {
        // Arahkan ke dashboard karyawan jika bukan
        navigate('/dashboard');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Periksa kembali email dan password Anda.');
    }
  };

  return (
    <LoginForm
      title="Login Hukum/Pegawai"
      onLogin={handleLogin}
      error={error}
    />
  );
}

export default LoginPage;