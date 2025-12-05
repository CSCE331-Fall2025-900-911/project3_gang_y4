import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginScreen from './components/LoginScreen';
import LandingPage from './components/LandingPage';
import CustomerKiosk from './components/CustomerKiosk';
import EmployeeView from './components/EmployeeView';
import ManagerView from './components/ManagerView';
import './styles/App.css';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.error('VITE_GOOGLE_CLIENT_ID is not set in environment variables');
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || ''}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage onLogin={handleLogin} />} />
            <Route path="/kiosk-login" element={<LoginScreen onLogin={handleLogin} />} />
            <Route
              path="/customer"
              element={user ? <CustomerKiosk user={user} onLogout={handleLogout} /> : <Navigate to="/kiosk-login" />}
            />
            <Route
              path="/employee"
              element={user && user.type === 'employee' ? <EmployeeView user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
            />
            <Route
              path="/manager"
              element={user && user.type === 'manager' ? <ManagerView user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
