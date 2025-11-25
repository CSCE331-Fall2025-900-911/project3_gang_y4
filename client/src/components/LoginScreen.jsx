import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { API_ENDPOINTS } from '../config/api';
import '../styles/LoginScreen.css';

function LoginScreen({ onLogin }) {
  const navigate = useNavigate();
  const [showStaffLogin, setShowStaffLogin] = useState(false); // Employee/Manager selection screen
  const [showCredentialForm, setShowCredentialForm] = useState(false); // Username/password form
  const [loginType, setLoginType] = useState(null); // 'employee' or 'manager'
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState(null);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState(null);

  // Google OAuth login handler
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setGoogleLoading(true);
        setGoogleError(null);

        // Get user info from Google using access token
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        if (!userInfoResponse.ok) {
          throw new Error('Failed to fetch user info from Google');
        }

        const googleUserInfo = await userInfoResponse.json();

        // Send user info to your backend for verification and user creation/retrieval
        const response = await fetch(API_ENDPOINTS.AUTH_GOOGLE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            googleId: googleUserInfo.sub,
            email: googleUserInfo.email,
            name: googleUserInfo.name,
            picture: googleUserInfo.picture,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Authentication failed');
        }

        const data = await response.json();

        // Call onLogin with user data from backend
        onLogin({
          id: data.user.id,
          type: 'google',
          name: data.user.name || data.user.username,
          email: data.user.email,
          username: data.user.username,
          picture: data.user.picture_url,
        });

        navigate('/customer');
      } catch (error) {
        console.error('Google login error:', error);
        setGoogleError(error.message || 'Failed to authenticate with Google');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google OAuth error:', error);
      setGoogleError('Google sign-in was cancelled or failed');
      setGoogleLoading(false);
    },
  });

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

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    try {
      setStaffLoading(true);
      setStaffError(null);

      // Determine which endpoint to call based on loginType
      const endpoint = loginType === 'employee' ? API_ENDPOINTS.AUTH_EMPLOYEE : API_ENDPOINTS.AUTH_MANAGER;

      // Send credentials to backend for verification
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      // Read response text first to avoid json() throwing on empty responses
      const raw = await response.text();
      let data = null;
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch (e) {
          console.error('Invalid JSON from server:', raw);
          throw new Error('Invalid JSON received from server');
        }
      }

      if (!response.ok) {
        const errMsg = data?.error || data?.message || raw || `Server error ${response.status}`;
        throw new Error(errMsg);
      }

      // Call onLogin with employee data from backend
      onLogin({
        id: data.user.employeeid,
        type: loginType, // 'employee' or 'manager'
        name: `${data.user.first_name} ${data.user.last_name}`.trim() || data.user.username,
        username: data.user.username,
        employeeid: data.user.employeeid,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        level: data.user.level,
      });

      // Navigate to appropriate view
      if (loginType === 'employee') {
        navigate('/employee');
      } else {
        navigate('/manager');
      }
    } catch (error) {
      console.error('Staff login error:', error);
      setStaffError(error.message || 'Failed to authenticate');
    } finally {
      setStaffLoading(false);
    }
  };

  const handleStaffTypeSelection = (type) => {
    setLoginType(type);
    setShowCredentialForm(true);
  };

  const handleBackToStaffSelection = () => {
    setShowCredentialForm(false);
    setLoginType(null);
    setCredentials({ username: '', password: '' });
    setStaffError(null);
  };

  const handleBackToMain = () => {
    setShowStaffLogin(false);
    setShowCredentialForm(false);
    setLoginType(null);
    setCredentials({ username: '', password: '' });
    setStaffError(null);
  };

  // Show credential form (username/password)
  if (showCredentialForm) {
    return (
      <div className="login-screen">
        <div className="login-container manager-login">
          
          <h1>{loginType === 'employee' ? 'Employee' : 'Manager'} Login</h1>
          <form onSubmit={handleStaffLogin}>
            {staffError && (
              <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
                {staffError}
              </div>
            )}
            <input
              type="text"
              placeholder="Username"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              required
              disabled={staffLoading}
            />
            <input
              type="password"
              placeholder="Password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
              disabled={staffLoading}
            />
            <button type="submit" className="login-button" disabled={staffLoading}>
              {staffLoading ? 'Logging in...' : 'Login'}
            </button>
            <button
            className="back-button"
            onClick={handleBackToStaffSelection}
          >
            ← Back
          </button>
          </form>
        </div>
      </div>
    );
  }

  // Show staff type selection (Employee or Manager)
  if (showStaffLogin) {
    return (
      <div className="login-screen">
        <div className="login-container">
          
          <div className="logo-section">
            <h1>Staff Login</h1>
            <p>Please select your role</p>
          </div>
          <div className="login-options">
            <button
              className="login-button staff-login employee-login-btn"
              onClick={() => handleStaffTypeSelection('employee')}
            >
              <span className="icon">👤</span>
              Employee Login
            </button>
            <button
              className="login-button staff-login manager-login-btn"
              onClick={() => handleStaffTypeSelection('manager')}
            >
              <span className="icon">🔑</span>
              Manager Login
            </button>
            <button
            className="back-button"
            onClick={handleBackToMain}
          >
            ← Back
          </button>
          </div>
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
          {googleError && (
            <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
              {googleError}
            </div>
          )}
          <button
            className="login-button google-login"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            <span className="icon">G</span>
            {googleLoading ? 'Signing in...' : 'Sign in with Google'}
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
          className="manager-login-button-pg1"
          onClick={() => setShowStaffLogin(true)}
        >
          Employee/Manager Login
        </button>
      </div>
    </div>
  );
}

export default LoginScreen;
