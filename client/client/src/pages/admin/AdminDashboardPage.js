import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ManageRequests from './ManageRequests';
import ManageItems from './ManageItems';
import ManageUsers from './ManageUsers';
import './AdminDashboardPage.css';
import ManageReports from './ManageReports';

function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('requests');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login-admin');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'requests':
        return <ManageRequests />;
      case 'items':
        return <ManageItems />;
      case 'users':
        return <ManageUsers />;
        case 'reports':
        return <ManageReports />;
      default:
        return <ManageRequests />;
    }
  };

  return (
    <div className="admin-dashboard">
      <aside className="sidebar">
        <h3>Admin Panel</h3>
        <nav>
          <button onClick={() => setActiveTab('requests')} className={activeTab === 'requests' ? 'active' : ''}>
            Kelola Permintaan
          </button>
          <button onClick={() => setActiveTab('items')} className={activeTab === 'items' ? 'active' : ''}>
            Kelola Barang
          </button>
          <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'active' : ''}>
            Kelola Akun
          </button>
          <button onClick={() => setActiveTab('reports')} className={activeTab === 'reports' ? 'active' : ''}>
            Kelola Laporan
          </button>
        </nav>
        <div className="user-info">
          <span>{user.fullName}</span>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </aside>
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default AdminDashboardPage;