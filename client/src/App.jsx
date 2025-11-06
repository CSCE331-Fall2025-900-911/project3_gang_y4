import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import CustomerKiosk from './components/CustomerKiosk';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoginScreen onLogin={handleLogin} />} />
          <Route 
            path="/customer" 
            element={user ? <CustomerKiosk user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
          />
          {/* Future routes for employee and manager screens */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
