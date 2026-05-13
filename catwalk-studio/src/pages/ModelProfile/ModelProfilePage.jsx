import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useModelByUsername, useUpdateModelBio } from '../../hooks/models/useModels';
import { useCreateBooking } from '../../hooks/bookings/useBookings';
import { useCreateReport } from '../../hooks/reports/useReports';
import { useAuth } from '../../hooks/useAuth';
import { LandingHeader, LandingFooter } from '../../components/landing';
import './ModelProfilePage.css';

function ModelProfilePage() {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Fetch model from DB via Clean Architecture
    const { createBookingAsync, isCreating: bookingSubmitting } = useCreateBooking();
    const { createReportAsync, isCreating: reportSubmitting } = useCreateReport();
    const { model: dbModel, isLoading: loading, error: fetchError } = useModelByUsername(username);
    const { updateModelBioAsync, isUpdating: bioUpdating } = useUpdateModelBio();

    // Map to UI-compatible format
    const model = dbModel ? {
        id: dbModel.id,
        username: dbModel.displayName || dbModel.username || 'Unknown',
        profile_image_url: dbModel.profileImageUrl,
        verified: dbModel.status === 'active',
        status: dbModel.status,
        createdByUserId: dbModel.createdByUserId,
        location: dbModel.locations?.[0]?.city || dbModel.location || '',
        agency: dbModel.locations?.[0]?.agency || '',
        tags: dbModel.styleTags || [],
        model_type: dbModel.modelType || (dbModel.isAi ? (dbModel.canBook ? 'both' : 'ai') : 'real'),
        ai_price: dbModel.aiGenerationCost || dbModel.pricePerImage,
        real_price: dbModel.realBookingCost || dbModel.hourlyRate,
        gallery: dbModel.galleryImageUrls || [],
        description: dbModel.description || '',
        video_url: dbModel.videoUrl || null,
        can_book: dbModel.canBook,
        can_travel: dbModel.canTravel,
        half_day_rate: dbModel.halfDayRate,
        full_day_rate: dbModel.fullDayRate,
        currency: dbModel.currency || 'GBP',
        social_links: dbModel.socialLinks || [],
    } : null;

    // Booking modal state
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingData, setBookingData] = useState({
        date: '',
        bookingType: 'full_day',
        location: '',
        details: '',
    });
    const [bookingSuccess, setBookingSuccess] = useState(false);

    // Report modal state
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportSuccess, setReportSuccess] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [showBioEditor, setShowBioEditor] = useState(false);
    const [bioValue, setBioValue] = useState('');
    const [bioError, setBioError] = useState('');

    const embedUrl = `${window.location.origin}/studio/try-on?model_id=${model?.id}`;
    const embedScript = `<script src="${window.location.origin}/embed.js"></script>\n<catwalk-tryon model-id="${model?.id}"></catwalk-tryon>`;

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    useEffect(() => {
        if (!model?.username || fetchError) return;

        document.title = `${model.username} — AI Fashion Model | Catwalk.ai`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', `Book ${model.username} for AI fashion shoots. ${model.description?.slice(0, 120) || 'Professional model available on Catwalk.ai'}`);
        }
    }, [fetchError, model?.description, model?.username]);


    if (loading) {
        return (
            <div className="model-profile-page">
                <LandingHeader />
                <div className="model-profile__loading">
                    <div className="model-profile__spinner" />
                </div>
            </div>
        );
    }

    const isOwner = user?.id === model?.createdByUserId;
    const isBlocked = model?.status === 'in_review' && !isOwner;

    if (fetchError || !model || isBlocked) {
        return (
            <div className="model-profile-page">
                <LandingHeader />
                <div className="model-profile__error">
                    <h1>Model Not Found</h1>
                    <p>The model profile you're looking for doesn't exist.</p>
                    <div className="model-profile__error-actions">
                        <Link to="/models" className="model-profile__back-btn">
                            Browse All Models
                        </Link>
                    </div>
                </div>
                <LandingFooter />
            </div>
        );
    }

    const pageTitle = `${model.username} — AI Fashion Model | Catwalk.ai`;
    const pageDescription = `Book ${model.username} for AI fashion shoots. ${model.description?.slice(0, 120) || 'Professional model available on Catwalk.ai'}`;

    const hasVideo = model.video_url;
    const hasGallery = model.gallery?.length > 0;
    const modelTypeLabel = model.model_type === 'both' ? 'AI & Real' : model.model_type === 'ai' ? 'AI' : 'Real';
    const canBook = model.model_type === 'real' || model.model_type === 'both';

    const handleStartShoot = () => {
        navigate(`/studio/quick-shoot?model_id=${model.id}`);
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        
        if (!user?.id) {
            navigate('/login', { state: { from: `/models/${username}` } });
            return;
        }

        if (!model?.id) return;

        // Validation
        const todayStr = new Date().toISOString().split('T')[0];
        if (bookingData.date < todayStr) {
            alert('Please select today or a future date for the booking.');
            return;
        }

        const amount = bookingData.bookingType === 'half_day' ? (model.half_day_rate || 500) : (model.full_day_rate || 1000);

        try {
            await createBookingAsync({
                modelId: model.id,
                userId: user.id,
                date: bookingData.date,
                bookingType: bookingData.bookingType,
                location: bookingData.location,
                details: bookingData.details,
                amount: amount,
            });
            setBookingSuccess(true);
            setTimeout(() => {
                setShowBookingModal(false);
                setBookingSuccess(false);
                setBookingData({ date: '', bookingType: 'full_day', location: '', details: '' });
            }, 2000);
        } catch (err) {
            console.error('Booking failed:', err);
            alert('Failed to submit booking: ' + err.message);
        }
    };

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        if (!user?.id || !model?.id || !reportReason.trim()) return;
        try {
            await createReportAsync({
                modelId: model.id,
                reporterId: user.id,
                reason: reportReason.trim(),
            });
            setReportSuccess(true);
            setTimeout(() => {
                setShowReportModal(false);
                setReportSuccess(false);
                setReportReason('');
            }, 2000);
        } catch (err) {
            console.error('Report failed:', err);
            alert('Failed to submit report: ' + err.message);
        }
    };

    const handleBioSave = async (e) => {
        e.preventDefault();
        setBioError('');

        if (!model?.id || !model?.username) return;
        if (!bioValue.trim()) {
            setBioError('Bio is required');
            return;
        }

        try {
            await updateModelBioAsync({
                modelId: model.id,
                username,
                bio: bioValue,
            });
            setShowBioEditor(false);
        } catch (err) {
            setBioError(err.message || 'Failed to update bio');
        }
    };

    return (
        <div className="model-profile-page">
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta property="og:image" content={model.profile_image_url} />
                <meta property="og:type" content="profile" />
                <meta property="og:profile:username" content={model.username} />
                <link rel="canonical" href={`${window.location.origin}/models/${username}`} />
            </Helmet>
            <LandingHeader />
            <main className="model-profile">
                {/* Hero: cover + avatar + name + badges + bio */}
                <section className="model-profile__hero">
                    <div
                        className="model-profile__hero-cover"
                        style={model.profile_image_url ? { backgroundImage: `url(${model.profile_image_url})` } : undefined}
                    />
                    <div className="model-profile__hero-content">
                        <div className="model-profile__avatar-wrap">
                            <div className="model-profile__avatar">
                                {model.profile_image_url ? (
                                    <img src={model.profile_image_url} alt={model.username} />
                                ) : (
                                    <div className="model-profile__avatar-placeholder">
                                        <span className="material-symbols-outlined">person</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="model-profile__info">
                            <h1 className="model-profile__name">{model.username}</h1>
                            <div className="model-profile__badges">
                                {dbModel?.isEliteActive || dbModel?.isElite || dbModel?.elite ? (
                                    <span className="model-profile__badge">
                                        <span className="material-symbols-outlined">star</span>
                                        Elite
                                    </span>
                                ) : null}
                                {model.verified && (
                                    <span className="model-profile__badge model-profile__badge--verified">
                                        <span className="material-symbols-outlined">verified</span>
                                        Verified
                                    </span>
                                )}
                            </div>
                            {model.description && (
                                <p className="model-profile__bio">{model.description}</p>
                            )}
                            {isOwner && (
                                <button className="model-profile__bio-edit-btn" onClick={() => { setBioValue(model?.description || ''); setShowBioEditor(true); }}>
                                    <span className="material-symbols-outlined">edit</span>
                                    Edit bio
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {model.status === 'in_review' && isOwner && (
                    <div className="model-profile__review-banner">
                        <span className="material-symbols-outlined">pending_actions</span>
                        <p>Your profile is currently under review. It is only visible to you until approved.</p>
                    </div>
                )}

                {/* Specs: location, agency, tags, model type, pricing */}
                <section className="model-profile__specs">
                    <div className="model-profile__container">
                        <div className="model-profile__specs-grid">
                            {model.location && (
                                <div className="model-profile__spec">
                                    <span className="model-profile__spec-label">Location</span>
                                    <span className="model-profile__spec-value">{model.location}</span>
                                </div>
                            )}
                            {model.agency && (
                                <div className="model-profile__spec">
                                    <span className="model-profile__spec-label">Agency</span>
                                    <span className="model-profile__spec-value">{model.agency}</span>
                                </div>
                            )}
                            {model.model_type && (
                                <div className="model-profile__spec">
                                    <span className="model-profile__spec-label">Type</span>
                                    <span className="model-profile__spec-pill">{modelTypeLabel}</span>
                                </div>
                            )}
                            {(model.ai_price != null || model.real_price != null) && (
                                <div className="model-profile__spec model-profile__spec--pricing">
                                    <span className="model-profile__spec-label">Rates ({model.currency})</span>
                                    <div className="model-profile__pricing">
                                        {model.ai_price != null && (
                                            <div className="model-profile__price-item">
                                                <span className="model-profile__price-val">£{model.ai_price}</span>
                                                <span className="model-profile__price-type">/ AI Image</span>
                                            </div>
                                        )}
                                        {model.real_price != null && (
                                            <div className="model-profile__price-item">
                                                <span className="model-profile__price-val">£{model.real_price}</span>
                                                <span className="model-profile__price-type">/ Hour</span>
                                            </div>
                                        )}
                                        {model.half_day_rate != null && (
                                            <div className="model-profile__price-item">
                                                <span className="model-profile__price-val">£{model.half_day_rate}</span>
                                                <span className="model-profile__price-type">/ Half Day</span>
                                            </div>
                                        )}
                                        {model.full_day_rate != null && (
                                            <div className="model-profile__price-item">
                                                <span className="model-profile__price-val">£{model.full_day_rate}</span>
                                                <span className="model-profile__price-type">/ Full Day</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Social Links */}
                        {model.social_links && (Object.values(model.social_links).some(v => !!v)) && (
                            <div className="model-profile__socials">
                                {model.social_links.instagram && (
                                    <a href={model.social_links.instagram?.startsWith('http') ? model.social_links.instagram : `https://instagram.com/${model.social_links.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="model-profile__social-link">
                                        <i className="fa-brands fa-instagram"></i> Instagram
                                    </a>
                                )}
                                {model.social_links.tiktok && (
                                    <a href={model.social_links.tiktok?.startsWith('http') ? model.social_links.tiktok : `https://tiktok.com/@${model.social_links.tiktok.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="model-profile__social-link">
                                        <i className="fa-brands fa-tiktok"></i> TikTok
                                    </a>
                                )}
                                {model.social_links.website && (
                                    <a href={model.social_links.website?.startsWith('http') ? model.social_links.website : `https://${model.social_links.website}`} target="_blank" rel="noopener noreferrer" className="model-profile__social-link">
                                        <span className="material-symbols-outlined">language</span> Website
                                    </a>
                                )}
                            </div>
                        )}

                        {model.tags?.length > 0 && (
                            <div className="model-profile__tags">
                                {model.tags.map((tag, idx) => (
                                    <span key={idx} className="model-profile__tag">{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Video */}
                {hasVideo && (
                    <section className="model-profile__video">
                        <div className="model-profile__container">
                            <h2 className="model-profile__section-title">Showcase Video</h2>
                            <div className="model-profile__video-wrapper">
                                <video controls src={model.video_url} />
                            </div>
                        </div>
                    </section>
                )}

                {/* Gallery */}
                {hasGallery && (
                    <section className="model-profile__gallery">
                        <div className="model-profile__container">
                            <h2 className="model-profile__section-title">Portfolio</h2>
                            <div className="model-profile__gallery-grid">
                                {model.gallery.map((url, index) => (
                                    <div key={index} className="model-profile__gallery-item">
                                        <img src={url} alt={`${model.username} portfolio ${index + 1}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Try-on Embed Script */}
                <section className="model-profile__embed">
                    <div className="model-profile__container">
                        <div className="model-profile__embed-box">
                            <div className="model-profile__embed-info">
                                <h2 className="model-profile__section-title text-left">Try-on Embed Script</h2>
                                <p className="model-profile__embed-desc">Integrate this model into your own e-commerce site for virtual try-on sessions. Copy the script below to get started.</p>
                            </div>
                            <div className="model-profile__code-snippet">
                                <code className="model-profile__code">
                                    {embedScript}
                                </code>
                                <button className="model-profile__copy-btn" onClick={() => copyToClipboard(embedScript)}>
                                    <span className="material-symbols-outlined">{copySuccess ? 'check' : 'content_copy'}</span>
                                    {copySuccess ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <div className="model-profile__embed-link">
                                <span>Direct Try-on URL:</span>
                                <a href={embedUrl} target="_blank" rel="noopener noreferrer">{embedUrl}</a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="model-profile__cta">
                    <div className="model-profile__container">
                        <h2 className="model-profile__cta-title">Work with {model.username}</h2>
                        <p className="model-profile__cta-desc">Start an AI fashion shoot or book this model for your project.</p>
                        <div className="model-profile__cta-actions">
                            <button className="model-profile__cta-btn model-profile__cta-btn--primary" onClick={handleStartShoot}>
                                <span className="material-symbols-outlined">photo_camera</span>
                                Start Shoot
                            </button>
                            {canBook && (
                                <button className="model-profile__cta-btn model-profile__cta-btn--secondary" onClick={() => {
                                    if (!user) {
                                        navigate('/login', { state: { from: `/models/${username}` } });
                                    } else {
                                        setShowBookingModal(true);
                                    }
                                }}>
                                    <span className="material-symbols-outlined">calendar_month</span>
                                    Book Model
                                </button>
                            )}
                            <button className="model-profile__cta-btn model-profile__cta-btn--ghost" onClick={() => setShowReportModal(true)}>
                                <span className="material-symbols-outlined">flag</span>
                                Report
                            </button>
                        </div>
                        <Link to="/models" className="model-profile__cta-link">← Back to All Models</Link>
                    </div>
                </section>
            </main>

            {showBioEditor && (
                <div className="model-profile__modal-overlay" onClick={() => setShowBioEditor(false)}>
                    <div className="model-profile__modal" onClick={e => e.stopPropagation()}>
                        <div className="model-profile__modal-header">
                            <h3>Edit Bio</h3>
                            <button onClick={() => setShowBioEditor(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleBioSave}>
                            <div className="model-profile__form-group">
                                <label>Bio</label>
                                <textarea
                                    rows="6"
                                    maxLength={500}
                                    value={bioValue}
                                    onChange={e => setBioValue(e.target.value)}
                                    placeholder="Edit your bio"
                                />
                            </div>
                            {bioError && <p className="model-profile__bio-error">{bioError}</p>}
                            <button className="model-profile__modal-submit" type="submit" disabled={bioUpdating}>
                                {bioUpdating ? 'Saving...' : 'Save Bio'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {showBookingModal && (
                <div className="model-profile__modal-overlay" onClick={() => setShowBookingModal(false)}>
                    <div className="model-profile__modal" onClick={e => e.stopPropagation()}>
                        <div className="model-profile__modal-header">
                            <h3>Book {model.username}</h3>
                            <button onClick={() => setShowBookingModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        {bookingSuccess ? (
                            <div className="model-profile__modal-success">
                                <span className="material-symbols-outlined">check_circle</span>
                                <p>Booking request submitted!</p>
                            </div>
                        ) : (
                            <form onSubmit={handleBookingSubmit}>
                                <div className="model-profile__form-group">
                                    <label>Date</label>
                                    <input type="date" required min={new Date().toISOString().split('T')[0]}
                                        value={bookingData.date}
                                        onChange={e => setBookingData(prev => ({ ...prev, date: e.target.value }))} />
                                </div>
                                <div className="model-profile__form-group">
                                    <span className="model-profile__field-label">Booking type</span>
                                    <div className="model-profile__booking-type-options" role="group" aria-label="Booking type">
                                        <label className="model-profile__booking-type-option">
                                            <input
                                                type="radio"
                                                name="bookingType"
                                                value="half_day"
                                                checked={bookingData.bookingType === 'half_day'}
                                                onChange={() => setBookingData(prev => ({ ...prev, bookingType: 'half_day' }))}
                                            />
                                            <span>Half-Day</span>
                                        </label>
                                        <label className="model-profile__booking-type-option">
                                            <input
                                                type="radio"
                                                name="bookingType"
                                                value="full_day"
                                                checked={bookingData.bookingType === 'full_day'}
                                                onChange={() => setBookingData(prev => ({ ...prev, bookingType: 'full_day' }))}
                                            />
                                            <span>Full-Day</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="model-profile__form-group">
                                    <label>Location</label>
                                    <input type="text" placeholder="Studio address or location" required
                                        value={bookingData.location}
                                        onChange={e => setBookingData(prev => ({ ...prev, location: e.target.value }))} />
                                </div>
                                <div className="model-profile__form-group">
                                    <label>Details</label>
                                    <textarea rows="3" placeholder="Describe the shoot requirements..."
                                        value={bookingData.details}
                                        onChange={e => setBookingData(prev => ({ ...prev, details: e.target.value }))} />
                                </div>
                                <button type="submit" className="model-profile__modal-submit" disabled={bookingSubmitting}>
                                    {bookingSubmitting ? 'Submitting...' : 'Submit Booking Request'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
                <div className="model-profile__modal-overlay" onClick={() => setShowReportModal(false)}>
                    <div className="model-profile__modal model-profile__modal--sm" onClick={e => e.stopPropagation()}>
                        <div className="model-profile__modal-header">
                            <h3>Report {model.username}</h3>
                            <button onClick={() => setShowReportModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        {reportSuccess ? (
                            <div className="model-profile__modal-success">
                                <span className="material-symbols-outlined">check_circle</span>
                                <p>Report submitted. Thank you.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleReportSubmit}>
                                <div className="model-profile__form-group">
                                    <label>Reason</label>
                                    <select value={reportReason} onChange={e => setReportReason(e.target.value)} required>
                                        <option value="">Select a reason...</option>
                                        <option value="inappropriate_content">Inappropriate content</option>
                                        <option value="fake_profile">Fake or misleading profile</option>
                                        <option value="spam">Spam</option>
                                        <option value="harassment">Harassment</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <button type="submit" className="model-profile__modal-submit model-profile__modal-submit--danger" disabled={reportSubmitting || !reportReason}>
                                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            <LandingFooter />
        </div>
    );
}

export default ModelProfilePage;
