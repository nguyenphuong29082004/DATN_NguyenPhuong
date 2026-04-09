import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { user, profile, creditBalance, isAnonymous, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { label: 'Quick Shoot', path: '/studio/quick-shoot', icon: 'photo_camera' },
        { label: 'Try On', path: '/studio/try-on', icon: 'styler' },
        { label: 'Create Campaign', path: '/studio/create-campaign', icon: 'campaign' },
        { label: 'Designer', path: '/studio/designer', icon: 'palette' },
        { label: 'Models', path: '/studio/models', icon: 'face_3' },
        { label: 'Prompts', path: '/studio/prompts', icon: 'edit_note' },
        // Separator
        { type: 'separator' },
        // Account & Settings
        { label: 'Become a Model', path: '/models/register', icon: 'star' },
        { label: 'Account', path: '/studio/account', icon: 'settings' },
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
                            <span className="sidebar__credits-label">Credits</span>
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
                            <span>Sign Up</span>
                        </button>
                    ) : (
                        <>
                            <div className="sidebar__user-info">
                                <span className="material-symbols-outlined thin-icon">account_circle</span>
                                <span>{profile?.email || 'User'}</span>
                            </div>
                            <button className="sidebar__signout" onClick={signOut} title="Sign Out">
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
