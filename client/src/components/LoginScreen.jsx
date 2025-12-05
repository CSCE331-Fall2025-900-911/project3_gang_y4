import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { API_ENDPOINTS } from '../config/api';
import '../styles/LoginScreen.css';

function LoginScreen({ onLogin }) {
  const navigate = useNavigate();
  const [showEmailLogin, setShowEmailLogin] = useState(false); // Email/password login form
  const [emailCredentials, setEmailCredentials] = useState({ email: '', password: '' });
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState(null);

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
    setShowEmailLogin(true);
  };

  const handleEmailLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      setEmailLoading(true);
      setEmailError(null);

      // Send email and password to backend for verification
      const response = await fetch(API_ENDPOINTS.AUTH_EMAIL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailCredentials.email,
          password: emailCredentials.password,
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

      // Call onLogin with customer data from backend
      onLogin({
        id: data.user.custid,
        type: 'email',
        name: `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim() || data.user.username,
        email: data.user.username, // username field stores email
        username: data.user.username,
        custid: data.user.custid,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        rewards_points: data.user.rewards_points,
      });

      // Navigate to customer view
      navigate('/customer');
    } catch (error) {
      console.error('Email login error:', error);
      setEmailError(error.message || 'Failed to authenticate');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleBackFromEmailLogin = () => {
    setShowEmailLogin(false);
    setEmailCredentials({ email: '', password: '' });
    setEmailError(null);
  };

  const handleGuestLogin = () => {
    onLogin({ type: 'guest', name: 'Guest' });
    navigate('/customer');
  };

  // Show email login form
  if (showEmailLogin) {
    return (
      <div className="login-screen">
        <div className="login-container manager-login">
          <h1>Sign in with Email</h1>
          <form onSubmit={handleEmailLoginSubmit}>
            {emailError && (
              <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
                {emailError}
              </div>
            )}
            <input
              type="email"
              placeholder="Email"
              value={emailCredentials.email}
              onChange={(e) => setEmailCredentials({ ...emailCredentials, email: e.target.value })}
              required
              disabled={emailLoading}
            />
            <input
              type="password"
              placeholder="Password"
              value={emailCredentials.password}
              onChange={(e) => setEmailCredentials({ ...emailCredentials, password: e.target.value })}
              required
              disabled={emailLoading}
            />
            <button type="submit" className="login-button" disabled={emailLoading}>
              {emailLoading ? 'Logging in...' : 'Login'}
            </button>
            <button
              type="button"
              className="back-button"
              onClick={handleBackFromEmailLogin}
            >
              ← Back
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
      </div>
    </div>
  );
}

export default LoginScreen;
