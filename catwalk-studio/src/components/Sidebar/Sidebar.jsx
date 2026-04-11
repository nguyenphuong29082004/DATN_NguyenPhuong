import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import './Sidebar.css';

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user, profile, creditBalance, isAnonymous, signOut } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { label: t('sidebar.quickShoot'), path: '/studio/quick-shoot', icon: 'photo_camera' },
        { label: t('sidebar.tryOn'), path: '/studio/try-on', icon: 'styler' },
        { label: t('sidebar.createCampaign'), path: '/studio/create-campaign', icon: 'campaign' },
        { label: t('sidebar.designer'), path: '/studio/designer', icon: 'palette' },
        { label: t('sidebar.models'), path: '/studio/models', icon: 'face_3' },
        { label: t('sidebar.prompts'), path: '/studio/prompts', icon: 'edit_note' },
        // Separator
        { type: 'separator' },
        // Account & Settings
        { label: t('sidebar.becomeModel'), path: '/models/register', icon: 'star' },
        { label: t('sidebar.account'), path: '/studio/account', icon: 'settings' },
    ];

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar__header">
                {!isCollapsed && (
                    <Link to="/" className="sidebar__logo">
                        Studio
                    </Link>
                )}
                <button
                    className="sidebar__toggle"
                    onClick={toggleSidebar}
                    aria-label={isCollapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
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
                            <span className="sidebar__credits-label">{t('sidebar.credits')}</span>
                            <span className="sidebar__credits-value">{creditBalance}</span>
                        </div>
                    )}
                </div>
            )}

            <nav className="sidebar__nav">
                {navItems.map((item, index) => {
                    if (item.type === 'separator') {
                        return <div key={`sep-${index}`} className="sidebar__separator" />;
                    }
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `sidebar__item ${isActive ? 'active' : ''}`
                            }
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
                            <span>{t('auth.signUp')}</span>
                        </button>
                    ) : (
                        <>
                            <div className="sidebar__user-info">
                                <span className="material-symbols-outlined thin-icon">account_circle</span>
                                <span>{profile?.email || t('common.user')}</span>
                            </div>
                            <button className="sidebar__signout" onClick={signOut} title={t('auth.signOut')}>
                                <span className="material-symbols-outlined thin-icon">logout</span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
