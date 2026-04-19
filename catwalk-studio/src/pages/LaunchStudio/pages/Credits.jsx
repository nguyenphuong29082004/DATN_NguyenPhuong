import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useCreditPackages, useStartCreditPurchase } from '../../../hooks/useCredits';
import { Button } from '../../../components/common/Button/Button';
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaGooglePay, FaApplePay } from 'react-icons/fa';
import { SiBitcoin, SiEthereum, SiTether, SiLitecoin, SiDogecoin } from 'react-icons/si';
import './Credits.css';

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));

const Credits = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, isGuest, creditBalance, refreshProfile } = useAuth();
    const { packages, isLoading: isLoadingPackages, error: packagesError } = useCreditPackages();
    const { startPurchaseAsync, isStartingPurchase, error } = useStartCreditPurchase();

    const [selectedPackageId, setSelectedPackageId] = React.useState(null);
    const [status, setStatus] = React.useState(() => searchParams.get('status'));
    const [activeProvider, setActiveProvider] = React.useState(null);

    const paymentProvider = activeProvider === 'cryptomus' ? 'Cryptomus' : 'Stripe';
    const isAuthenticatedBuyer = !!user?.id && !isGuest;

    React.useEffect(() => {
        const paymentStatus = searchParams.get('status');
        if (!paymentStatus) {
            return;
        }

        setStatus(paymentStatus);

        if (paymentStatus === 'success' || paymentStatus === 'processing') {
            refreshProfile();
        }
    }, [refreshProfile, searchParams]);

    React.useEffect(() => {
        if (!packages.length) {
            return;
        }

        const queryPackageId = searchParams.get('package');
        const packageFromQuery = queryPackageId ? packages.find((pkg) => pkg.package_id === queryPackageId) : null;

        if (!selectedPackageId) {
            setSelectedPackageId(packageFromQuery?.package_id || packages[0].package_id);
        }
    }, [packages, searchParams, selectedPackageId]);

    const selectedPackage = packages.find((pkg) => pkg.package_id === selectedPackageId) || null;
    const canCheckout = isAuthenticatedBuyer && !!selectedPackage && !isStartingPurchase;

    const handleSelectPackage = (packageId) => {
        setSelectedPackageId(packageId);
        setStatus(null);
    };

    const handleCheckout = async (provider) => {
        if (!isAuthenticatedBuyer) {
            navigate('/login', { state: { from: '/studio/credits' } });
            return;
        }

        if (!selectedPackage) {
            return;
        }

        setActiveProvider(provider);
        setStatus('checking_out');

        try {
            const payload = {
                provider,
                packageId: selectedPackage.package_id,
            };

            const result = await startPurchaseAsync(payload);
            window.location.assign(result.url);
        } catch (checkoutError) {
            console.error('Failed to start checkout:', checkoutError);
            setStatus('error');
            setActiveProvider(null);
        }
    };

    return (
        <div className="credits-page">
            <div className="credits-container">
                <header className="credits-header">
                    <span className="credits-eyebrow">Studio Credits</span>
                    <h1 className="editorial-kern">Top up your balance</h1>
                    <p className="credits-subheader">Buy AI credits with Stripe or crypto, then use them for image and generation workflows.</p>

                    {status === 'success' && (
                        <div className="status-banner status-banner--success">
                            <span className="material-symbols-outlined">check_circle</span>
                            <span>Payment received. Your credit balance is updating now.</span>
                        </div>
                    )}

                    {status === 'processing' && (
                        <div className="status-banner status-banner--info">
                            <span className="material-symbols-outlined">hourglass_top</span>
                            <span>Your payment is processing. We will update your credits as soon as it clears.</span>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="status-banner status-banner--error">
                            <span className="material-symbols-outlined">error</span>
                            <span>{error?.message || 'Transaction failed. Please try again.'}</span>
                        </div>
                    )}

                    {!isAuthenticatedBuyer && (
                        <div className="status-banner status-banner--warning">
                            <span className="material-symbols-outlined">lock</span>
                            <span>Create an account before purchasing credits.</span>
                        </div>
                    )}
                </header>

                <div className="credits-layout">
                    <section className="credits-card credits-card--balance">
                        <div className="credits-section-header">
                            <span className="credits-section-eyebrow">Current balance</span>
                            <h2>Your available credits</h2>
                        </div>
                        <div className="current-balance-card">
                            <span className="balance-label">Available now</span>
                            <div className="balance-value">
                                <span className="balance-amount">{creditBalance}</span>
                            </div>
                            <span className="balance-suffix">credits ready to use</span>
                        </div>
                    </section>

                    <section className="credits-card credits-card--purchase">
                        <div className="credits-section-header credits-section-header--centered">
                            <span className="credits-section-eyebrow">Choose package</span>
                            <h2>How many AI credits do you want to buy?</h2>
                            <p>{selectedPackage ? `Buy ${formatNumber(selectedPackage.credits_amount)} AI credits for $${Number(selectedPackage.usd_amount)}.` : 'Choose a preset AI credit bundle for your next generations.'}</p>
                        </div>


                        {packagesError && (
                            <div className="status-banner status-banner--error credits-inline-banner">
                                <span className="material-symbols-outlined">error</span>
                                <span>{packagesError.message || 'Failed to load credit packages.'}</span>
                            </div>
                        )}

                        <div className="amount-grid amount-grid--sms" role="radiogroup" aria-label="Credit package">
                            {packages.map((pkg) => (
                                <button
                                    key={pkg.package_id}
                                    type="button"
                                    className={`amount-tile amount-tile--sms ${selectedPackageId === pkg.package_id ? 'amount-tile--selected' : ''}`}
                                    onClick={() => handleSelectPackage(pkg.package_id)}
                                >
                                    <span className="amount-tile__price amount-tile__price--sms">${Number(pkg.usd_amount)}</span>
                                    <span className="amount-tile__subtext">{formatNumber(pkg.credits_amount)} AI credits</span>
                                </button>
                            ))}
                        </div>

                        {isLoadingPackages && (
                            <div className="credits-processing-note">Loading credit packages...</div>
                        )}

                        <div className="payment-methods-section">
                            <div className="credits-section-header credits-section-header--compact credits-section-header--centered">
                                <span className="credits-section-eyebrow">Payment method</span>
                                <h2>Choose how you would like to pay</h2>
                            </div>
                            <div className="payment-methods-grid">
                                <button
                                    type="button"
                                    className={`payment-method-card ${activeProvider === 'stripe' ? 'payment-method-card--active payment-method-card--stripe' : ''}`}
                                    onClick={() => handleCheckout('stripe')}
                                    disabled={!canCheckout}
                                >
                                    <div className="payment-method-card__header">
                                        <span className="payment-method-title">Pay with Card or Wallet</span>
                                    </div>
                                    <div className="payment-method-icons payment-method-icons--centered payment-method-icons--sms-icons">
                                        <FaCcVisa title="Visa" className="payment-icon payment-icon--visa" />
                                        <FaCcMastercard title="Mastercard" className="payment-icon payment-icon--mastercard" />
                                        <FaCcAmex title="American Express" className="payment-icon payment-icon--amex" />
                                        <FaApplePay title="Apple Pay" className="payment-icon payment-icon--applepay" />
                                        <FaGooglePay title="Google Pay" className="payment-icon payment-icon--googlepay" />
                                    </div>
                                    <span className="payment-method-note payment-method-note--centered">Secure payment via Stripe</span>
                                </button>

                                <button
                                    type="button"
                                    className={`payment-method-card ${activeProvider === 'cryptomus' ? 'payment-method-card--active payment-method-card--crypto' : ''}`}
                                    onClick={() => handleCheckout('cryptomus')}
                                    disabled={!canCheckout}
                                >
                                    <div className="payment-method-card__header">
                                        <span className="payment-method-title">Pay with Crypto</span>
                                    </div>
                                    <div className="payment-method-icons payment-method-icons--centered payment-method-icons--sms-icons">
                                        <SiBitcoin title="Bitcoin" className="payment-icon payment-icon--btc" />
                                        <SiEthereum title="Ethereum" className="payment-icon payment-icon--eth" />
                                        <SiTether title="USDT" className="payment-icon payment-icon--usdt" />
                                        <SiDogecoin title="Dogecoin" className="payment-icon payment-icon--doge" />
                                        <SiLitecoin title="Litecoin" className="payment-icon payment-icon--ltc" />
                                        <span>+99</span>
                                    </div>
                                    <span className="payment-method-note payment-method-note--centered">103 cryptocurrencies supported</span>
                                </button>
                            </div>
                        </div>

                        {!isAuthenticatedBuyer && (
                            <div className="credits-cta-row">
                                <Button variant="primary" onClick={() => navigate('/login', { state: { from: '/studio/credits' } })}>
                                    Create account to continue
                                </Button>
                            </div>
                        )}

                        {isStartingPurchase && (
                            <div className="credits-processing-note">
                                Redirecting to {paymentProvider} checkout...
                            </div>
                        )}
                    </section>
                </div>

                <footer className="credits-footer">
                    <p>Prices are in USD. Credits do not expire. Payments are confirmed before credits are added.</p>
                </footer>
            </div>
        </div>
    );
};

export default Credits;
