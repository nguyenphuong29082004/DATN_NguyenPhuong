import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Button } from '../../../components/common/Button/Button';
import './Account.css';

const Account = () => {
    const { user, profile, isGuest, creditBalance, signOut } = useAuth();
    const { t } = useLanguage();
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
                    <h2>{t('account.title')}</h2>
                    <p>{t('account.subtitle')}</p>
                </div>

                <div className="account-sections">
                    {/* Profile Section */}
                    <section className="account-card">
                        <div className="account-card__header">
                            <span className="material-symbols-outlined">person</span>
                            {t('account.profile')}
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
                                    <h3>{profile?.display_name || (isGuest ? t('auth.guestUser') : t('common.user'))}</h3>
                                    <p className="account-profile__email">
                                        {isGuest ? t('auth.noEmailLinked') : (profile?.email || user?.email)}
                                    </p>
                                    <span className={`account-badge ${isGuest ? 'account-badge--guest' : ''}`}>
                                        {isGuest ? t('auth.guest') : (profile?.subscription_tier || t('account.free'))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Credits Section */}
                    <section className="account-card">
                        <div className="account-card__header">
                            <span className="material-symbols-outlined">toll</span>
                            {t('account.credits')}
                        </div>
                        <div className="account-card__body">
                            <div className="account-credits">
                                <div className="account-credits__balance">
                                    <span className="account-credits__number">{creditBalance}</span>
                                    <span className="account-credits__label">{t('account.creditsAvailable')}</span>
                                </div>
                                <div className="account-credits__costs">
                                    <div className="account-credits__cost-item">
                                        <span>{t('account.quickShootCost')}</span>
                                        <span className="account-credits__cost-value">5 {t('account.creditsCost')}</span>
                                    </div>
                                    <div className="account-credits__cost-item">
                                        <span>{t('account.aiModelCost')}</span>
                                        <span className="account-credits__cost-value">15 {t('account.creditsCost')}</span>
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
                            {t('auth.session')}
                        </div>
                        <div className="account-card__body">
                            <div className="account-session">
                                {isGuest ? (
                                    <>
                                        <div className="account-session__info">
                                            <h4>{t('auth.signUp')}</h4>
                                            <p>{t('auth.createAccountToSave')}</p>
                                        </div>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            icon="login"
                                            onClick={handleSignUp}
                                        >
                                            {t('auth.signUp')}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="account-session__info">
                                            <h4>{t('auth.signOut')}</h4>
                                            <p>{t('auth.endYourSession')}</p>
                                        </div>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            icon="logout"
                                            loading={signingOut}
                                            onClick={handleSignOut}
                                        >
                                            {t('auth.signOut')}
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
