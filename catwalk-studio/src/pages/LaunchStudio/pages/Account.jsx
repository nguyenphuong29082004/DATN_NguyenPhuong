import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useCreditHistory } from '../../../hooks/useCredits';
import { Button } from '../../../components/common/Button/Button';
import './Account.css';

const Account = () => {
    const { user, profile, isGuest, creditBalance, signOut, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [signingOut, setSigningOut] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);

    // B2B state
    const [b2bData, setB2bData] = useState({
        full_name: '',
        company_name: '',
        tax_id: '',
        country: ''
    });

    useEffect(() => {
        if (profile) {
            setB2bData({
                full_name: profile.full_name || '',
                company_name: profile.company_name || '',
                tax_id: profile.tax_id || '',
                country: profile.country || ''
            });
        }
    }, [profile]);

    const { transactions, isLoading: historyLoading } = useCreditHistory(user?.id);

    const handleSaveB2B = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveMessage(null);

        try {
            const { error } = await updateProfile({
                full_name: b2bData.full_name,
                company_name: b2bData.company_name,
                tax_id: b2bData.tax_id,
                country: b2bData.country
            });

            if (error) throw error;
            setSaveMessage({ type: 'success', text: 'Billing information updated' });
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (err) {
            setSaveMessage({ type: 'error', text: err.message || 'Failed to update' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSignOut = async () => {
        setSigningOut(true);
        await signOut();
        navigate('/');
    };

    const handleSignUp = () => {
        navigate('/login', { state: { from: '/studio/account' } });
    };

    const handleBuyCredits = () => {
        navigate('/studio/credits');
    };

    const getTransactionStatus = (tx) => (tx.amount > 0 ? 'Credit added' : 'Credit spent');

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
                                <div className="account-credits__info">
                                    <div className="account-credits__balance">
                                        <span className="account-credits__number">{creditBalance}</span>
                                        <span className="account-credits__label">Credits Available</span>
                                    </div>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        icon="add_circle"
                                        onClick={handleBuyCredits}
                                    >
                                        Buy Credits
                                    </Button>
                                    <p className="account-credits__hint">Recommended starting bundle: 50 USD / 500 credits for onboarding and quick shoots.</p>
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

                    {/* B2B / Billing Section */}
                    {!isGuest && (
                        <section className="account-card">
                            <div className="account-card__header">
                                <span className="material-symbols-outlined">business</span>
                                Billing Information (B2B)
                            </div>
                            <div className="account-card__body">
                                <form className="account-form" onSubmit={handleSaveB2B}>
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input 
                                            type="text" 
                                            value={b2bData.full_name}
                                            onChange={(e) => setB2bData(prev => ({ ...prev, full_name: e.target.value }))}
                                            placeholder="Your professional name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Company Name</label>
                                        <input 
                                            type="text" 
                                            value={b2bData.company_name}
                                            onChange={(e) => setB2bData(prev => ({ ...prev, company_name: e.target.value }))}
                                            placeholder="Brand or Agency Name"
                                        />
                                    </div>
                                    <div className="account-form-grid">
                                        <div className="form-group">
                                            <label>Country</label>
                                            <input 
                                                type="text" 
                                                value={b2bData.country}
                                                onChange={(e) => setB2bData(prev => ({ ...prev, country: e.target.value }))}
                                                placeholder="e.g. United Kingdom"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Tax ID / VAT Number</label>
                                            <input 
                                                type="text" 
                                                value={b2bData.tax_id}
                                                onChange={(e) => setB2bData(prev => ({ ...prev, tax_id: e.target.value }))}
                                                placeholder="Business Tax Reference"
                                            />
                                        </div>
                                    </div>
                                    <div className="account-form__actions">
                                        {saveMessage && (
                                            <span style={{ 
                                                fontSize: '0.75rem', 
                                                color: saveMessage.type === 'success' ? 'var(--primary)' : '#ff6b6b',
                                                marginRight: '16px',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}>
                                                {saveMessage.text}
                                            </span>
                                        )}
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            type="submit"
                                            loading={isSaving}
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </section>
                    )}

                    {/* Transaction History Section */}
                    {!isGuest && (
                        <section className="account-card">
                            <div className="account-card__header">
                                <span className="material-symbols-outlined">receipt_long</span>
                                Transaction History
                            </div>
                            <div className="account-card__body">
                                <div className="transaction-history">
                                    {historyLoading ? (
                                        <div className="empty-history">Loading transactions...</div>
                                    ) : transactions.length > 0 ? (
                                        <div className="transaction-table-wrapper">
                                            <table className="transaction-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Reason</th>
                                                        <th>Amount</th>
                                                        <th>Credits</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {transactions.map(tx => (
                                                        <tr key={tx.id}>
                                                            <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                                                            <td>{tx.reason}</td>
                                                            <td>{tx.amountPaid ? `${tx.amountPaid} ${tx.currency || 'USD'}` : '-'}</td>
                                                            <td className={tx.amount > 0 ? 'amount--positive' : 'amount--negative'}>
                                                                {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                                            </td>
                                                            <td>
                                                                <span className={`status-badge ${tx.amount > 0 ? 'status-badge--credit' : 'status-badge--debit'}`}>
                                                                    {getTransactionStatus(tx)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="empty-history">
                                            No transaction history found.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}


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
