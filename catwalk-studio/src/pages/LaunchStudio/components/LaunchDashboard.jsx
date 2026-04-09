import React from 'react';
import { Link } from 'react-router-dom';
import '../LaunchStudioPage.css';

const LaunchDashboard = () => {
    const launchOptions = [
        {
            title: 'Become a Model',
            description: 'Digitize yourself into a photorealistic AI Model. Upload your media and create a digital twin for personal or commercial use.',
            path: 'become-model',
            icon: 'face_3',
            action: 'Onboard Now'
        },
        {
            title: 'Marketplace & Booking',
            description: 'Discover and book elite AI and Real models. Browse the talent pool or list your own digital avatar for brands to hire.',
            path: 'marketplace',
            icon: 'storefront',
            action: 'Browse Market'
        }
    ];

    return (
        <div className="launch-studio-content">
            <header className="launch-studio-header">
                <h1 className="launch-studio-title">Studio Launchpad</h1>
                <p className="launch-studio-subtitle">
                    The central hub for creating, digitizing, and connecting in the future of fashion. Select a tool to begin.
                </p>
            </header>

            <div className="launch-studio-grid">
                {launchOptions.map((option, index) => (
                    <Link
                        to={option.path}
                        key={index}
                        className="studio-card"
                    >
                        <div className="studio-card__icon-wrapper">
                            <span className="material-symbols-outlined studio-card__icon thin-icon">
                                {option.icon}
                            </span>
                        </div>
                        <h2 className="studio-card__title">{option.title}</h2>
                        <p className="studio-card__description">{option.description}</p>
                        <div className="studio-card__arrow">
                            {option.action}
                            <span className="material-symbols-outlined thin-icon">arrow_forward</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default LaunchDashboard;
