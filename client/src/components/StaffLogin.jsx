import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import TranslateMenu from './TranslateMenu';
import { useTranslation } from '../context/TranslationContext';

const StaffLogin = ({ onLogin, onClose }) => {
    const navigate = useNavigate();
    const [showCredentialForm, setShowCredentialForm] = useState(false);
    const [loginType, setLoginType] = useState(null);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [staffLoading, setStaffLoading] = useState(false);
    const [staffError, setStaffError] = useState(null);
    const {getStringsForPage, setAppLanguage, language} = useTranslation();
    const strings = getStringsForPage('staffLogin');
    
    // Update strings whenever language changes

    // DEBUG: Log strings to see what's available
    useEffect(() => {
        console.log('StaffLogin strings:', strings);
        console.log('usernameLabel:', strings.usernameLabel);
        console.log('passwordLabel:', strings.passwordLabel);
    }, [strings]);

    const handleTranslate = async (targetLang) => {
        await setAppLanguage(targetLang, ['staffLogin']);
    }

    const handleStaffTypeSelection = (type) => {
        setLoginType(type);
        setShowCredentialForm(true);
        setStaffError(null);
        handleTranslate(language);
    };

    const handleBackToStaffSelection = () => {
        setShowCredentialForm(false);
        setLoginType(null);
        setCredentials({ username: '', password: '' });
        setStaffError(null);
    };

    const handleStaffLogin = async (e) => {
        e.preventDefault();
        try {
            setStaffLoading(true);
            setStaffError(null);

            const endpoint = loginType === 'employee' ? API_ENDPOINTS.AUTH_EMPLOYEE : API_ENDPOINTS.AUTH_MANAGER;

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

            const raw = await response.text();
            let data = null;
            if (raw) {
                try {
                    data = JSON.parse(raw);
                } catch (e) {
                    throw new Error('Invalid JSON received from server');
                }
            }

            if (!response.ok) {
                throw new Error(data?.error || data?.message || raw || `Server error ${response.status}`);
            }

            onLogin({
                id: data.user.employeeid,
                type: loginType,
                name: `${data.user.first_name} ${data.user.last_name}`.trim() || data.user.username,
                username: data.user.username,
                employeeid: data.user.employeeid,
                first_name: data.user.first_name,
                last_name: data.user.last_name,
                level: data.user.level,
            });

            if (loginType === 'employee') {
                navigate('/employee');
            } else {
                navigate('/manager');
            }

            if (onClose) onClose();

        } catch (error) {
            console.error('Staff login error:', error);
            setStaffError(error.message || 'Failed to authenticate');
        } finally {
            setStaffLoading(false);
        }
    };

    if (showCredentialForm) {
        return (
            <div className="staff-login-container">
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#2d3436' }}>
                    {loginType === 'employee' ? strings.employeeButton : strings.managerButton}
                </h2>
                <form onSubmit={handleStaffLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {staffError && (
                        <div className="staff-login-error" style={{ color: '#e74c3c', fontSize: '0.9rem', textAlign: 'center', padding: '0.5rem', background: 'rgba(231, 76, 60, 0.1)', borderRadius: '4px' }}>
                            {staffError}
                        </div>
                    )}
                    <input
                        type="text"
                        placeholder={strings.usernameLabel || 'Username'}
                        value={credentials.username}
                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                        required
                        disabled={staffLoading}
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #dfe6e9', fontSize: '1rem' }}
                    />
                    <input
                        type="password"
                        placeholder={strings.passwordLabel || 'Password'}
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        required
                        disabled={staffLoading}
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #dfe6e9', fontSize: '1rem' }}
                    />
                    <button
                        type="submit"
                        style={{ padding: '12px', borderRadius: '8px', border: 'none', background: '#0984e3', color: 'white', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' }}
                        disabled={staffLoading}
                    >
                        {staffLoading ? (strings.loggingIn || 'Logging in...') : (strings.login || 'Login')}
                    </button>
                    <button
                        type="button"
                        onClick={handleBackToStaffSelection}
                        style={{ padding: '8px', background: 'none', border: 'none', color: '#636e72', cursor: 'pointer' }}
                    >
                        ← {strings.back || 'Back'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="staff-login-container">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ color: '#2d3436', marginBottom: '0.5rem' }}>{strings.staffPortal}</h2>
                <p style={{ color: '#636e72' }}>{strings.portalDesc}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                    onClick={() => handleStaffTypeSelection('employee')}
                    style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #dfe6e9',
                        background: 'white',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        color: '#2d3436',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.borderColor = '#0984e3'}
                    onMouseOut={(e) => e.target.style.borderColor = '#dfe6e9'}
                >
                    <span>👤</span> {strings.employeeButton}
                </button>
                <button
                    onClick={() => handleStaffTypeSelection('manager')}
                    style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #dfe6e9',
                        background: 'white',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        color: '#2d3436',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.borderColor = '#0984e3'}
                    onMouseOut={(e) => e.target.style.borderColor = '#dfe6e9'}
                >
                    <span>🔑</span> {strings.managerButton}
                </button>
            </div>
        </div>
    );
};

export default StaffLogin;