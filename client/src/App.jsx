import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
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

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.error('VITE_GOOGLE_CLIENT_ID is not set in environment variables');
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || ''}>
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
    </GoogleOAuthProvider>
  );
}

export default App;
