import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffLogin from './StaffLogin';
import '../styles/LandingPage.css';
import TranslateMenu from './TranslateMenu';
import { useTranslation } from '../context/TranslationContext';

const LandingPage = ({ onLogin }) => {
    const navigate = useNavigate();
    const [showStaffLogin, setShowStaffLogin] = useState(false);
    const {getStringsForPage, setAppLanguage} = useTranslation();
    const strings = getStringsForPage('landing');
    

    const handleKioskMode = () => {
        navigate('/kiosk-login');
    };

    const handleStaffLoginClick = () => {
        setShowStaffLogin(true);
    };

    const handleCloseStaffLogin = () => {
        setShowStaffLogin(false);
    };

    const handleTranslate = async (targetLang) => {
        await setAppLanguage(targetLang, ['landing']);
    };

    return (
        <main className="landing">
            {/* Animated Background */}
            <div className="landing__bg">
                <div className="landing__bg-orb landing__bg-orb--1" />
                <div className="landing__bg-orb landing__bg-orb--2" />
                <div className="landing__bg-orb landing__bg-orb--3" />
            </div>

            {/* Hero Section */}
            <section className="landing__hero">
                <header className="landing__header">
                    <div className="landing__logo">
                        <span className="landing__logo-icon">🧋</span>
                        <h1 className="landing__logo-text">{strings.logoText}</h1>
                    </div>
                    <p className="landing__tagline">{strings.tagline}</p>
                </header>

                <h2 className="landing__title">
                    {strings.welcomeTitle}<br />
                    <span className="landing__title-accent">{strings.welcomeTitle2}</span>
                </h2>

                <p className="landing__subtitle">
                    {strings.orderPrompt}
                </p>
            </section>

            {/* Action Cards */}
            <section className="landing__actions">
                <article
                    className="action-card action-card--primary"
                    onClick={handleKioskMode}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleKioskMode()}
                >
                    <div className="action-card__icon-wrap">
                        <span className="action-card__icon">🥤</span>
                    </div>
                    <div className="action-card__content">
                        <h3 className="action-card__title">{strings.startOrderTitle}</h3>
                        <p className="action-card__desc">{strings.startOrderDesc}</p>
                    </div>
                    <div className="action-card__arrow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </article>

                <article
                    className="action-card action-card--secondary"
                    onClick={handleStaffLoginClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleStaffLoginClick()}
                >
                    <div className="action-card__icon-wrap">
                        <span className="action-card__icon">🔐</span>
                    </div>
                    <div className="action-card__content">
                        <h3 className="action-card__title">{strings.staffLoginButton}</h3>
                        <p className="action-card__desc">{strings.staffLoginDesc}</p>
                    </div>
                    <div className="action-card__arrow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </article>
            </section>

            {/* Translate Menu */}
            <TranslateMenu onTranslate={handleTranslate} />

            {/* Staff Login Modal */}
            {showStaffLogin && (
                <div className="modal-overlay" onClick={handleCloseStaffLogin}>
                    <dialog
                        className="modal"
                        open
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="modal__close"
                            onClick={handleCloseStaffLogin}
                            aria-label="Close modal"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <StaffLogin onLogin={onLogin} onClose={handleCloseStaffLogin} />
                    </dialog>
                </div>
            )}
        </main>
    );
};

export default LandingPage;
