import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../common/LanguageToggle/LanguageToggle';
import './Sidebar.css';

const Sidebar = ({ isMobileOpen, onClose }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user, profile, creditBalance, isAnonymous, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    // Close mobile menu when navigating
    useEffect(() => {
        if (isMobileOpen && onClose) {
            onClose();
        }
    }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    const navItems = [
        // Primary creation action
        { label: t('nav.sidebar.quickShoot'), path: '/studio/quick-shoot', icon: 'photo_camera' },
        { label: t('nav.sidebar.tryOn'), path: '/studio/try-on', icon: 'styler' },
        { label: t('nav.sidebar.designer'), path: '/studio/designer', icon: 'palette' },
        { label: t('nav.sidebar.library'), path: '/studio/library', icon: 'auto_awesome_motion' },
        // Campaigns section
        { type: 'separator' },
        { type: 'section', label: t('nav.sidebar.campaignsHeader') },
        { label: t('nav.sidebar.campaigns'), path: '/studio/campaigns', icon: 'campaign' },
         // Tools
        { type: 'separator' },
        { label: t('nav.sidebar.models'), path: '/studio/models', icon: 'face_3' },
        { label: t('nav.sidebar.prompts'), path: '/studio/prompts', icon: 'edit_note' },
        // Separator
        { type: 'separator' },
        // Account & Settings
        { label: t('nav.sidebar.becomeModel'), path: '/models/register', icon: 'star' },
        { label: t('nav.sidebar.account'), path: '/studio/account', icon: 'settings' },
    ];

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <>
            {/* Overlay for mobile */}
            {isMobileOpen && (
                <div className="sidebar-overlay" onClick={onClose} />
            )}
            
            <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar__header">
                    {!isCollapsed && (
                        <Link to="/" className="sidebar__logo">
                            Studio
                        </Link>
                    )}
                    
                    {/* Close button for mobile */}
                    <button className="sidebar__close-mobile" onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                    </button>

                    <button
                        className="sidebar__toggle"
                        onClick={toggleSidebar}
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                    <span className="material-symbols-outlined thin-icon" style={{ fontSize: '20px' }}>
                        {isCollapsed ? 'chevron_right' : 'chevron_left'}
                    </span>
                </button>
            </div>

            {/* Credit Balance Display */}
            {user && (
                <div className={`sidebar__credits ${isCollapsed ? 'collapsed' : ''}`}>
                    <div className="sidebar__credits-icon">
                        <span className="material-symbols-outlined thin-icon">toll</span>
                    </div>
                    {!isCollapsed && (
                        <div className="sidebar__credits-info">
                            <span className="sidebar__credits-label">{t('nav.sidebar.credits')}</span>
                            <div className="sidebar__credits-row">
                                <span className="sidebar__credits-value">{creditBalance}</span>
                                <Link to="/studio/credits" className="sidebar__credits-topup">
                                    <span className="material-symbols-outlined">add_circle</span>
                                    <span>{t('nav.sidebar.topUp')}</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!isCollapsed && (
                <div className="sidebar__language">
                    <LanguageToggle />
                </div>
            )}

            <nav className="sidebar__nav">
                {navItems.map((item, index) => {
                    if (item.type === 'separator') {
                        return <div key={`sep-${index}`} className="sidebar__separator" />;
                    }
                    if (item.type === 'section') {
                        return !isCollapsed ? (
                            <div key={`section-${index}`} className="sidebar__section-label">
                                {item.label}
                            </div>
                        ) : null;
                    }
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => {
                                // Logic to distinguish between base path and path with query params
                                const isCreateAction = location.search.includes('new=1');
                                const itemIsCreateAction = item.path.includes('new=1');
                                
                                let isActuallyActive = isActive;
                                
                                // Specific check for Campaigns section overlap
                                if (isCreateAction) {
                                    isActuallyActive = itemIsCreateAction;
                                } else if (itemIsCreateAction) {
                                    isActuallyActive = false;
                                }

                                return `sidebar__item ${isActuallyActive ? 'active' : ''} ${item.special ? 'sidebar__item--special' : ''}`;
                            }}
                        >
                            <span className="material-symbols-outlined sidebar__icon thin-icon">
                                {item.icon}
                            </span>
                            <span className="sidebar__label">{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* User Status */}
            {user && !isCollapsed && (
                <div className="sidebar__user">
                    {isAnonymous ? (
                        <button
                            className="sidebar__signup-full"
                            onClick={() => navigate('/login', { state: { from: location.pathname } })}
                        >
                            <span className="material-symbols-outlined thin-icon">login</span>
                            <span>{t('nav.signUp')}</span>
                        </button>
                    ) : (
                        <>
                            <div className="sidebar__user-info">
                                <span className="material-symbols-outlined thin-icon">account_circle</span>
                                <span>{profile?.email || 'User'}</span>
                            </div>
                            <button className="sidebar__signout" onClick={signOut} title={t('nav.logout')}>
                                <span className="material-symbols-outlined thin-icon">logout</span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </aside>
    </>
);
};

export default Sidebar;
