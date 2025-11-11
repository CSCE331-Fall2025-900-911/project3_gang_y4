import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { API_ENDPOINTS } from '../config/api';
import '../styles/LoginScreen.css';

function LoginScreen({ onLogin }) {
  const navigate = useNavigate();
  const [showManagerLogin, setShowManagerLogin] = useState(false);
  const [managerCredentials, setManagerCredentials] = useState({ username: '', password: '' });
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState(null);
  const [managerLoading, setManagerLoading] = useState(false);
  const [managerError, setManagerError] = useState(null);

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

  const handleManagerLogin = async (e) => {
    e.preventDefault();
    try {
      setManagerLoading(true);
      setManagerError(null);

      // Send credentials to backend for verification
      const response = await fetch(API_ENDPOINTS.AUTH_MANAGER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: managerCredentials.username,
          password: managerCredentials.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const data = await response.json();
      
      // Call onLogin with employee data from backend
      onLogin({
        id: data.user.employeeid,
        type: 'manager',
        name: `${data.user.first_name} ${data.user.last_name}`.trim() || data.user.username,
        username: data.user.username,
        employeeid: data.user.employeeid,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        level: data.user.level,
      });

      navigate('/manager');
    } catch (error) {
      console.error('Manager login error:', error);
      setManagerError(error.message || 'Failed to authenticate');
    } finally {
      setManagerLoading(false);
    }
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
            {managerError && (
              <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
                {managerError}
              </div>
            )}
            <input
              type="text"
              placeholder="Username"
              value={managerCredentials.username}
              onChange={(e) => setManagerCredentials({ ...managerCredentials, username: e.target.value })}
              required
              disabled={managerLoading}
            />
            <input
              type="password"
              placeholder="Password"
              value={managerCredentials.password}
              onChange={(e) => setManagerCredentials({ ...managerCredentials, password: e.target.value })}
              required
              disabled={managerLoading}
            />
            <button type="submit" className="login-button" disabled={managerLoading}>
              {managerLoading ? 'Logging in...' : 'Login'}
            </button>
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