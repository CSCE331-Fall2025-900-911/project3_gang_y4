import React from 'react';
import '../styles/ManagerScreen.css';
import SalesScreen from './SalesScreen'

function ManagerScreen({ user, onLogout }) {
  return (
    <div className="manager-screen">
      <div className="manager-header">
        <h1>Manager Screen</h1>
        <div className="manager-info">
          <p>Welcome, {user?.name || user?.username || 'Manager'}</p>
          {user?.level && <p className="manager-level">Level: {user.level}</p>}
        </div>
        <button onClick={onLogout} className="logout-button">
          Logout
        </button>
      </div>
      <div className="manager-content">
        <p>Manager dashboard coming soon...</p>
      </div>
    </div>
  );
}

export default ManagerScreen;

