import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { API_ENDPOINTS } from '../config/api';
import WeatherBackground from './WeatherBackground';
import { useWeather } from '../context/WeatherContext';
import '../styles/LoginScreen.css';
import TranslateMenu from './TranslateMenu';
import { useTranslation } from '../context/TranslationContext';

function LoginScreen({ onLogin }) {
  const navigate = useNavigate();
  const [lowContrast, setLowContrast] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kiosk_low_contrast')) || false; } catch (e) { return false; }
  });
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [emailCredentials, setEmailCredentials] = useState({ email: '', password: '' });
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const {getStringsForPage, setAppLanguage} = useTranslation();
  const strings = getStringsForPage('login');
  const { refreshWeather } = useWeather();

  const { debugCycleWeather, weatherLabel } = useWeather();

  const handleTranslate = async (targetLang) => {
      await setAppLanguage(targetLang, ['login']);
      refreshWeather();
  };

  useEffect(() => {
          console.log('StaffLogin strings:', strings);
          console.log('testText:', strings.testText);
  }, [strings]);

  // Google OAuth login handler
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setGoogleLoading(true);
        setGoogleError(null);

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

      onLogin({
        id: data.user.custid,
        type: 'email',
        name: `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim() || data.user.username,
        email: data.user.username,
        username: data.user.username,
        custid: data.user.custid,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        rewards_points: data.user.rewards_points,
      });

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
    onLogin({ type: 'guest', name: strings.guestName });
    navigate('/customer');
  };

  // Keep body-level low-contrast class in sync for cross-page styling
  useEffect(() => {
    try {
      const host = document.body || document.documentElement;
      if (lowContrast) host.classList.add('low-contrast'); else host.classList.remove('low-contrast');
    } catch (e) {}
  }, [lowContrast]);

  // Email Login Form
  if (showEmailLogin) {
    return (
      <WeatherBackground>
        <main className="login">
          <div className="login__bg">
            <div className="login__bg-orb login__bg-orb--1" />
            <div className="login__bg-orb login__bg-orb--2" />
          </div>

          <section className="login__card login__card--form">
            <header className="login__header">
              <span className="login__icon">✉️</span>
              <h1 className="login__title">{strings.signIn}</h1>
              <p className="login__subtitle">{strings.signInSubtitle}</p>
            </header>

            <form className="login__form" onSubmit={handleEmailLoginSubmit}>
              {emailError && (
                <div className="login__error" role="alert">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span>{emailError}</span>
                </div>
              )}

              <div className="login__field">
                <label className="login__label" htmlFor="email">{strings.emailLabel}</label>
                <input
                  id="email"
                  type="email"
                  className="login__input"
                  placeholder="your@email.com"
                  value={emailCredentials.email}
                  onChange={(e) => setEmailCredentials({ ...emailCredentials, email: e.target.value })}
                  required
                  disabled={emailLoading}
                />
              </div>

              <div className="login__field">
                <label className="login__label" htmlFor="password">{strings.passwordLabel}</label>
                <input
                  id="password"
                  type="password"
                  className="login__input"
                  placeholder="••••••••"
                  value={emailCredentials.password}
                  onChange={(e) => setEmailCredentials({ ...emailCredentials, password: e.target.value })}
                  required
                  disabled={emailLoading}
                />
              </div>

              <button type="submit" className="login__btn login__btn--primary" disabled={emailLoading}>
                {emailLoading ? (
                  <>
                    <span className="login__spinner" />
                    {strings.googleLoading1}
                  </>
                ) : (
                  strings.signIn
                )}
              </button>

              <button
                type="button"
                className="login__btn login__btn--ghost"
                onClick={handleBackFromEmailLogin}
              >
                ← {strings.back}
              </button>
            </form>
          </section>
        </main>
      </WeatherBackground>
    );
  }

  // Main Login Options
  return (
    <WeatherBackground>
      <main className="login">
        <div className="login__bg">
          <div className="login__bg-orb login__bg-orb--1" />
          <div className="login__bg-orb login__bg-orb--2" />
        </div>

        <section className="login__card">
          <header className="login__header">
            <div className="login__logo">
              <span className="login__logo-icon">🧋</span>
            </div>
            <h1 className="login__title">{strings.loginTitle}</h1>
            <p className="login__subtitle">{strings.loginSubtitle}</p>
          </header>

          {googleError && (
            <div className="login__error" role="alert">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>{googleError}</span>
            </div>
          )}

          <div className="login__options">
            <button
              className="login__btn login__btn--google"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              <svg className="login__btn-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {googleLoading ? strings.googleLoading1 : strings.googleLoading2}
            </button>

            <button
              className="login__btn login__btn--email"
              onClick={handleEmailPhoneLogin}
            >
              <svg className="login__btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
              {strings.emailLogin}
            </button>

            <div className="login__divider">
              <span>{strings.or}</span>
            </div>

            <button
              className="login__btn login__btn--guest"
              onClick={handleGuestLogin}
            >
              <svg className="login__btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {strings.guestLogin}
            </button>
          </div>

          
          

          <footer className="login__footer">
            <p style={{ marginBottom: '1rem' }}>{strings.guestDisclaimer}</p>

            {/* DEBUG BUTTON */}
            <button
              onClick={debugCycleWeather}
              style={{
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)'
              }}
            >
              🎨 {weatherLabel || 'Live'}
            </button>
            
            {/* Low contrast toggle - bottom left (shared key) */}
            <button
              className="kiosk__low-contrast-toggle"
              onClick={() => {
                const next = !lowContrast;
                setLowContrast(next);
                try { localStorage.setItem('kiosk_low_contrast', JSON.stringify(next)); } catch (e) {}
              }}
              aria-pressed={lowContrast}
              title="Toggle low contrast view"
            >
              {lowContrast ? 'Normal contrast' : 'Low contrast'}
            </button>
          </footer>
        </section>
        {/* Translate Menu */}
          <TranslateMenu onTranslate={handleTranslate} />
      </main>
    </WeatherBackground>
  );
}

export default LoginScreen;
