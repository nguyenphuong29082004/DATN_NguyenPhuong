import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../../components/common/Button/Button';
import './Account.css';

const Account = () => {
    const { user, profile, isGuest, creditBalance, signOut } = useAuth();
    const navigate = useNavigate();
    const [signingOut, setSigningOut] = useState(false);

    const handleSignOut = async () => {
        setSigningOut(true);
        await signOut();
        navigate('/');
    };

    const handleSignUp = () => {
        navigate('/login', { state: { from: '/studio/account' } });
    };

    return (
        <div className="account-page">
            <div className="account-main">
                {/* Header */}
                <div className="account-header">
                    <h2>Account</h2>
                    <p>Manage your profile and preferences</p>
                </div>

                <div className="account-sections">
                    {/* Profile Section */}
                    <section className="account-card">
                        <div className="account-card__header">
                            <span className="material-symbols-outlined">person</span>
                            Profile
                        </div>
                        <div className="account-card__body">
                            <div className="account-profile">
                                <div className="account-profile__avatar">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" />
                                    ) : (
                                        <span className="material-symbols-outlined">person</span>
                                    )}
                                </div>
                                <div className="account-profile__info">
                                    <h3>{profile?.display_name || (isGuest ? 'Guest User' : 'User')}</h3>
                                    <p className="account-profile__email">
                                        {isGuest ? 'No email linked' : (profile?.email || user?.email)}
                                    </p>
                                    <span className={`account-badge ${isGuest ? 'account-badge--guest' : ''}`}>
                                        {isGuest ? 'Guest' : (profile?.subscription_tier || 'Free')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Credits Section */}
                    <section className="account-card">
                        <div className="account-card__header">
                            <span className="material-symbols-outlined">toll</span>
                            Credits
                        </div>
                        <div className="account-card__body">
                            <div className="account-credits">
                                <div className="account-credits__balance">
                                    <span className="account-credits__number">{creditBalance}</span>
                                    <span className="account-credits__label">Credits Available</span>
                                </div>
                                <div className="account-credits__costs">
                                    <div className="account-credits__cost-item">
                                        <span>Quick Shoot</span>
                                        <span className="account-credits__cost-value">5 credits</span>
                                    </div>
                                    <div className="account-credits__cost-item">
                                        <span>AI Model</span>
                                        <span className="account-credits__cost-value">15 credits</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>


                    {/* Sign Out / Sign Up */}
                    <section className={`account-card ${!isGuest ? 'account-card--danger' : ''}`}>
                        <div className="account-card__header">
                            <span className="material-symbols-outlined">
                                {isGuest ? 'login' : 'logout'}
                            </span>
                            Session
                        </div>
                        <div className="account-card__body">
                            <div className="account-session">
                                {isGuest ? (
                                    <>
                                        <div className="account-session__info">
                                            <h4>Sign Up</h4>
                                            <p>Create an account to save your progress</p>
                                        </div>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            icon="login"
                                            onClick={handleSignUp}
                                        >
                                            Sign Up
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="account-session__info">
                                            <h4>Sign Out</h4>
                                            <p>End your current session</p>
                                        </div>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            icon="logout"
                                            loading={signingOut}
                                            onClick={handleSignOut}
                                        >
                                            Sign Out
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Account;
