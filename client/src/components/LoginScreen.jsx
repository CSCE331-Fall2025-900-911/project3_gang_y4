import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginScreen.css';

function LoginScreen({ onLogin }) {
  const navigate = useNavigate();
  const [showManagerLogin, setShowManagerLogin] = useState(false);
  const [managerCredentials, setManagerCredentials] = useState({ username: '', password: '' });

  const handleGoogleLogin = () => {
    // TODO: Implement Google OAuth
    console.log('Google login clicked');
    onLogin({ type: 'google', name: 'Google User' });
    navigate('/customer');
  };

  const handleEmailPhoneLogin = () => {
    // TODO: Implement email/phone authentication
    console.log('Email/Phone login clicked');
    onLogin({ type: 'email', name: 'Email User' });
    navigate('/customer');
  };

  const handleGuestLogin = () => {
    onLogin({ type: 'guest', name: 'Guest' });
    navigate('/customer');
  };

  const handleManagerLogin = (e) => {
    e.preventDefault();
    // TODO: Implement manager authentication
    console.log('Manager login:', managerCredentials);
    onLogin({ type: 'manager', name: 'Manager', ...managerCredentials });
    navigate('/manager'); // Will create this route later
  };

  if (showManagerLogin) {
    return (
      <div className="login-screen">
        <div className="login-container manager-login">
          <button 
            className="back-button"
            onClick={() => setShowManagerLogin(false)}
          >
            ← Back
          </button>
          <h1>Manager Login</h1>
          <form onSubmit={handleManagerLogin}>
            <input
              type="text"
              placeholder="Username"
              value={managerCredentials.username}
              onChange={(e) => setManagerCredentials({ ...managerCredentials, username: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={managerCredentials.password}
              onChange={(e) => setManagerCredentials({ ...managerCredentials, password: e.target.value })}
              required
            />
            <button type="submit" className="login-button">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="logo-section">
          <h1>Boba Kiosk</h1>
          <p>Welcome! Please select a login option</p>
        </div>

        <div className="login-options">
          <button className="login-button google-login" onClick={handleGoogleLogin}>
            <span className="icon">G</span>
            Sign in with Google
          </button>

          <button className="login-button email-login" onClick={handleEmailPhoneLogin}>
            <span className="icon">✉</span>
            Sign in with Email/Phone
          </button>

          <button className="login-button guest-login" onClick={handleGuestLogin}>
            <span className="icon">👤</span>
            Continue as Guest
          </button>
        </div>

        <button 
          className="manager-login-button"
          onClick={() => setShowManagerLogin(true)}
        >
          Manager Login
        </button>
      </div>
    </div>
  );
}

export default LoginScreen;
