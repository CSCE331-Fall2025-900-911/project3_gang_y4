import React from 'react';
import CheckoutInterface from './CheckoutInterface';
import '../styles/EmployeeView.css';

function EmployeeView({ user, onLogout }) {
  return (
    <div className="employee-view">
      {/* Header */}
      <header className="employee-header">
        <h1>Employee POS</h1>
        <div className="employee-info">
          <span>Welcome, {user?.name || user?.username}</span>
          <button className="logout-button" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <CheckoutInterface user={user} />
    </div>
  );
}

export default EmployeeView;
