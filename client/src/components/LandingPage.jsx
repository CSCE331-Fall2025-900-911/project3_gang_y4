import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffLogin from './StaffLogin';
import '../styles/LandingPage.css';

const LandingPage = ({ onLogin }) => {
    const navigate = useNavigate();
    const [showStaffLogin, setShowStaffLogin] = useState(false);

    const handleKioskMode = () => {
        navigate('/kiosk-login');
    };

    const handleStaffLoginClick = () => {
        setShowStaffLogin(true);
    };

    const handleCloseStaffLogin = () => {
        setShowStaffLogin(false);
    };

    return (
        <div className="landing-page">
            <div className="landing-content">
                <h1 className="landing-title">Welcome to Boba Kiosk</h1>
                <p className="landing-subtitle">Please select your access mode</p>

                <div className="landing-buttons">
                    <button className="landing-button kiosk-btn" onClick={handleKioskMode}>
                        <div className="icon-wrapper">🥤</div>
                        <div className="text-wrapper">
                            <span className="btn-title">Kiosk Mode</span>
                            <span className="btn-desc">Customer Ordering</span>
                        </div>
                    </button>

                    <button className="landing-button staff-btn" onClick={handleStaffLoginClick}>
                        <div className="icon-wrapper">🔒</div>
                        <div className="text-wrapper">
                            <span className="btn-title">Staff Login</span>
                            <span className="btn-desc">Employee & Manager</span>
                        </div>
                    </button>
                </div>
            </div>

            {showStaffLogin && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="close-modal-btn" onClick={handleCloseStaffLogin}>×</button>
                        <StaffLogin onLogin={onLogin} onClose={handleCloseStaffLogin} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
