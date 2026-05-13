import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../../../infrastructure/supabase/supabase.client';
import { useRegisterModel } from '../../../hooks/models/useModels';
import ImageCropModal from './ImageCropModal';
import './ModelOnboarding.css';

// Content preference categories per SRS Section 5.2 Step 4
const CONTENT_CATEGORIES = [
    { key: 'fashion_editorial', label: 'Fashion / Editorial', icon: 'photo_camera' },
    { key: 'commercial', label: 'Commercial / Advertising', icon: 'campaign' },
    { key: 'ecommerce', label: 'E-commerce / Product', icon: 'shopping_bag' },
    { key: 'lifestyle', label: 'Lifestyle', icon: 'self_improvement' },
    { key: 'swimwear_fitness', label: 'Swimwear / Fitness', icon: 'pool' },
    { key: 'mature_adult', label: 'Mature / Adult (18+)', icon: 'lock' },
];

// Style tags per SRS Section 5.1
const STYLE_TAGS = [
    'Editorial', 'Commercial', 'Streetwear', 'High Fashion',
    'Plus Size', 'Petite', 'Mature', 'Alternative',
];

const POPULAR_LOCATIONS = [
    // North America
    'New York, USA', 'Los Angeles, USA', 'Chicago, USA', 'Miami, USA', 'San Francisco, USA',
    'Las Vegas, USA', 'Atlanta, USA', 'Toronto, Canada', 'Vancouver, Canada', 'Montreal, Canada',
    'Mexico City, Mexico',

    // South America
    'São Paulo, Brazil', 'Rio de Janeiro, Brazil', 'Buenos Aires, Argentina', 'Bogotá, Colombia',
    'Lima, Peru', 'Santiago, Chile',

    // Europe
    'London, UK', 'Paris, France', 'Milan, Italy', 'Rome, Italy', 'Berlin, Germany',
    'Munich, Germany', 'Madrid, Spain', 'Barcelona, Spain', 'Amsterdam, Netherlands',
    'Copenhagen, Denmark', 'Stockholm, Sweden', 'Oslo, Norway', 'Helsinki, Finland',
    'Vienna, Austria', 'Zurich, Switzerland', 'Geneva, Switzerland', 'Prague, Czech Republic',
    'Budapest, Hungary', 'Warsaw, Poland', 'Athens, Greece', 'Istanbul, Turkey',

    // Asia
    'Tokyo, Japan', 'Osaka, Japan', 'Seoul, South Korea', 'Beijing, China', 'Shanghai, China',
    'Hong Kong', 'Taipei, Taiwan', 'Bangkok, Thailand', 'Singapore', 'Kuala Lumpur, Malaysia',
    'Jakarta, Indonesia', 'Manila, Philippines', 'Ho Chi Minh City, Vietnam', 'Hanoi, Vietnam',
    'Mumbai, India', 'New Delhi, India', 'Bangalore, India',

    // Middle East
    'Dubai, UAE', 'Abu Dhabi, UAE', 'Doha, Qatar', 'Riyadh, Saudi Arabia', 'Tel Aviv, Israel',

    // Oceania
    'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia', 'Perth, Australia',
    'Auckland, New Zealand', 'Wellington, New Zealand',

    // Africa
    'Cape Town, South Africa', 'Johannesburg, South Africa', 'Cairo, Egypt', 'Nairobi, Kenya',
    'Lagos, Nigeria', 'Casablanca, Morocco'
];

const TOTAL_STEPS = 5;

const BecomeModel = () => {
    const { registerModelAsync } = useRegisterModel();
    const navigate = useNavigate();
    const sessionId = useRef(crypto.randomUUID());
    const [step, setStep] = useState(1);
    const [createdModel, setCreatedModel] = useState(null);

    // Step 1: Account Type selection (multi-select)
    const [selection, setSelection] = useState({
        real: true,
        ai: true
    });
    
    // accountType is derived for backward compatibility with the useCase
    const accountType = selection.real && selection.ai ? 'both' : (selection.ai ? 'ai_only' : 'real_only');
    const setAccountType = (value) => {
        if (value === 'ai_only') {
            setSelection({ real: false, ai: true });
            return;
        }

        if (value === 'real_only') {
            setSelection({ real: true, ai: false });
            return;
        }

        setSelection({ real: true, ai: true });
    };

    // Step 2: Profile Creation
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        location: '',
        height: '',
        styleTags: [],
    });
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);

    // Step 3: Media Upload
    const [photos, setPhotos] = useState({
        profile: null, // legacy field, kept temporarily for submit compatibility
        gallery: [],   // source photos (array of URLs)
        videos: []
    });

    // Step 4: Content Preferences
    const [contentPreferences, setContentPreferences] = useState([]);

    // Step 5: Income & Pricing
    const [targetEarnings, setTargetEarnings] = useState(2000);
    const [pricing, setPricing] = useState({
        hourlyRate: 50,
        halfDayRate: 180,
        fullDayRate: 350,
    });

    // Step 6: Social Connection
    const [socialLinks, setSocialLinks] = useState({
        instagram: '',
        tiktok: '',
    });

    // Step 7: Elite Program
    const [eliteBoost, setEliteBoost] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [uploadError, setUploadError] = useState(null); // Lưu thông báo lỗi upload để hiển thị mượt hơn

    // Step 8 (final submit config)
    const [finalConfig, setFinalConfig] = useState({
        displayName: '',
        types: [],
        confirmed: false,
    });

    // Track upload state for media
    const [uploading, setUploading] = useState({
        profile: false,
        galleryIndexes: new Set(), // track nhiều index gallery đang upload cùng lúc
        videos: null,  // sẽ lưu trữ index của video đang upload
    });
    const [bioDraft, setBioDraft] = useState('');
    const [bioDraftError, setBioDraftError] = useState(null);
    const [isGeneratingBio, setIsGeneratingBio] = useState(false);

    // Crop modal state
    const [cropImageSrc, setCropImageSrc] = useState(null);

    // Persist form data to localStorage
    const STORAGE_KEY = 'catwalk_become_model_draft';

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.step && parsed.step >= 1 && parsed.step <= TOTAL_STEPS) setStep(parsed.step);
                if (parsed.accountType) {
                    setSelection({
                        real: parsed.accountType === 'both' || parsed.accountType === 'real_only',
                        ai: parsed.accountType === 'both' || parsed.accountType === 'ai_only'
                    });
                }
                if (parsed.formData) setFormData(prev => ({ ...prev, ...parsed.formData }));
                if (parsed.bioDraft) setBioDraft(parsed.bioDraft);
                if (parsed.photos) setPhotos(prev => ({ ...prev, ...parsed.photos }));
                if (parsed.contentPreferences) setContentPreferences(parsed.contentPreferences);
                if (parsed.targetEarnings) setTargetEarnings(parsed.targetEarnings);
                if (parsed.pricing) setPricing(prev => ({ ...prev, ...parsed.pricing }));
                if (parsed.socialLinks) setSocialLinks(prev => ({ ...prev, ...parsed.socialLinks }));
                if (parsed.eliteBoost !== undefined) setEliteBoost(parsed.eliteBoost);
                if (parsed.finalConfig) setFinalConfig(prev => ({ ...prev, ...parsed.finalConfig, confirmed: false }));
            } catch (e) {
                console.warn('Failed to restore become model draft:', e);
            }
        }
    }, []);

    useEffect(() => {
        const draft = {
            step, accountType, formData, bioDraft, photos, contentPreferences,
            targetEarnings, pricing, socialLinks, eliteBoost,
            finalConfig: { ...finalConfig, confirmed: false },
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }, [step, accountType, formData, bioDraft, photos, contentPreferences, targetEarnings, pricing, socialLinks, eliteBoost, finalConfig]);

    const handleNext = () => setStep(step + 1);
    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            // If backing out from the first step, clear the draft
            localStorage.removeItem(STORAGE_KEY);
            window.history.back();
        }
    };

    const handleFileUpload = async (type, file, index) => {
        if (!file) return;

        setUploadError(null);
        if (type === 'profile') {
            setUploading(prev => ({ ...prev, profile: true }));
        } else if (type === 'gallery') {
            setUploading(prev => ({
                ...prev,
                galleryIndexes: new Set([...prev.galleryIndexes, index])
            }));
        } else if (type === 'videos') {
            setUploading(prev => ({ ...prev, videos: index }));
        }

        try {
            const folder = type === 'videos' ? 'draft-model-videos' : 'draft-model-photos';
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', `${folder}/${sessionId.current}`);

            const supabase = getSupabaseClient();
            const { data, error } = await supabase.functions.invoke('upload-to-r2', { body: formData });

            if (error || !data?.url) throw new Error(error?.message || 'Upload failed');
            const { url } = data;

            if (type === 'profile') {
                setPhotos(prev => ({ ...prev, profile: url }));
            } else if (type === 'gallery') {
                setPhotos(prev => {
                    const newGallery = [...prev.gallery];
                    newGallery[index] = url;
                    return { ...prev, gallery: newGallery };
                });
            } else if (type === 'videos') {
                setPhotos(prev => {
                    const newVideos = prev.videos ? [...prev.videos] : [];
                    newVideos[index] = url;
                    return { ...prev, videos: newVideos };
                });
            }
        } catch (err) {
            console.error(`Failed to upload ${type}:`, err);
            setUploadError(`Upload failed: ${err.message}. Please try again.`);
        } finally {
            if (type === 'profile') {
                setUploading(prev => ({ ...prev, profile: false }));
            } else if (type === 'gallery') {
                setUploading(prev => {
                    const next = new Set([...prev.galleryIndexes]);
                    next.delete(index);
                    return { ...prev, galleryIndexes: next };
                });
            } else if (type === 'videos') {
                setUploading(prev => ({ ...prev, videos: null }));
            }
        }
    };

    const toggleContentPreference = (key) => {
        setContentPreferences(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const handleGenerateBio = async () => {
        setIsGeneratingBio(true);
        setBioDraftError(null);

        try {
            const draftName = formData.name.trim();
            if (!draftName) {
                throw new Error('Display name is required before generating a bio');
            }

            if (!formData.location.trim()) {
                throw new Error('City is required before generating a bio');
            }

            if (contentPreferences.length === 0) {
                throw new Error('Select at least one content preference before generating a bio');
            }

            const supabase = getSupabaseClient();
            const { data, error } = await supabase.functions.invoke('generate-model-bio', {
                body: {
                    modelData: {
                        displayName: draftName,
                        accountType,
                        location: formData.location,
                        styleTags: formData.styleTags,
                        contentPreferences,
                        hourlyRate: pricing.hourlyRate,
                        halfDayRate: pricing.halfDayRate,
                        fullDayRate: pricing.fullDayRate,
                    },
                },
            });

            if (error || !data?.success || !data?.bio) {
                throw new Error(error?.message || data?.error || 'Failed to generate bio');
            }

            setBioDraft(data.bio);
        } catch (error) {
            setBioDraftError(error.message || 'Failed to generate bio');
        } finally {
            setIsGeneratingBio(false);
        }
    };

    // Count total uploaded photos
    const galleryPhotoCount = photos.gallery.filter(Boolean).length;
    const uploadedVideos = photos.videos.filter(Boolean);
    const totalPhotos = galleryPhotoCount;
    const minPhotosRequired = accountType === 'ai_only' ? 1 : 5;
    const remainingPhotosRequired = Math.max(minPhotosRequired - totalPhotos, 0);
    const filteredLocations = POPULAR_LOCATIONS.filter(location =>
        location.toLowerCase().includes(formData.location.toLowerCase())
    ).slice(0, 8);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const result = await registerModelAsync({
                displayName: formData.name.trim(),
                accountType,
                targetEarnings,
                bioDraft,
                location: formData.location,
                styleTags: formData.styleTags,
                socialLinks,
                photos: {
                    gallery: photos.gallery.filter(Boolean),
                    videos: photos.videos ? photos.videos.filter(Boolean) : [],
                },
                contentPreferences,
                eliteBoost,
                types: finalConfig.types,
                hourlyRate: pricing.hourlyRate,
                halfDayRate: pricing.halfDayRate,
                fullDayRate: pricing.fullDayRate,
            });

            if (!result) {
                throw new Error('Registration failed to return model data');
            }

            localStorage.removeItem(STORAGE_KEY);
            setCreatedModel(result);
            setStep(TOTAL_STEPS + 1);
        } catch (err) {
            console.error('Failed to create model profile:', err);
            setSubmitError(err.message || 'Failed to create profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const progressPercentage = Math.min((step / TOTAL_STEPS) * 100, 100);

    // Validation per step
    const canContinue = () => {
        switch (step) {
            case 1: return selection.real || selection.ai;
            case 2: return true;
            case 3: return galleryPhotoCount >= minPhotosRequired;
            case 4: return formData.name.trim().length > 0 && formData.location.trim().length > 0 && contentPreferences.length > 0;
            case 5: return true;
            default: return true;
        }
    };

    const renderStep = () => {
        switch (step) {
            // ========================================
            // STEP 1: Account Type Selection (3 options)
            // ========================================
            case 1:
                return (
                    <>
                        <div className="step-header">
                            <div className="separator-line"></div>
                            <h2 className="step-headline">Choose your <span className="italic-text text-primary">path</span></h2>
                            <p className="step-description">
                                Select how you want to participate in the Catwalk.AI fashion ecosystem.
                            </p>
                        </div>

                        <div className="selection-grid three-col">
                            {/* AI Only */}
                            <label className="group relative cursor-pointer block h-full">
                                <input
                                    className="selection-input"
                                    name="account_type"
                                    type="radio"
                                    value="ai_only"
                                    checked={accountType === 'ai_only'}
                                    onChange={() => setAccountType('ai_only')}
                                />
                                <div className="selection-card">
                                    <div className="card-image-wrapper">
                                        <div
                                            className="card-image"
                                            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAWdHShxsscIECb9EEN48Jj4he9L1scGjm5yDhTAm8Y1iLxcREbbC1oq4c8oyn7yvuHUtJNxYja-uloVzNr1Gj6AlQ3fSupYQ32wp9laZFeP9C52oBSqtPOZzEqs-JlhFYxug6-tB5owruDAlKvI09X1PCnt6g3LUCXn_vN7wrf1yyWVzNvyPmd2HBHqaD33Os9h573htfalQcxcnydsU5rqtHBkwTsNW57ON8_d4QcMd4CII4lomO1VKwbz4zRLz2sddSxwKanExA')" }}
                                        ></div>
                                        <div className="card-overlay"></div>
                                        <div className="card-number">01 — Digital</div>
                                    </div>
                                    <div className="card-content">
                                        <h3 className="card-title">The Digital Twin</h3>
                                        <p className="card-desc">
                                            License your likeness for AI content generation. Brands use your digital twin for photo & video shoots.
                                        </p>
                                        <div className="card-footer">
                                            <span className="card-tag">AI Licensed</span>
                                            <div className="card-checkbox"></div>
                                        </div>
                                    </div>
                                </div>
                            </label>

                            {/* Real Only */}
                            <label className="group relative cursor-pointer block h-full">
                                <input
                                    className="selection-input"
                                    name="account_type"
                                    type="radio"
                                    value="real_only"
                                    checked={accountType === 'real_only'}
                                    onChange={() => setAccountType('real_only')}
                                />
                                <div className="selection-card">
                                    <div className="card-image-wrapper">
                                        <div
                                            className="card-image"
                                            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCzeo8O8UCglZzueDjAePQc5c5vfdsXKglVNqTZDKxmpAwQn4EHEe7k3hlNKZkW7FgESxOEnxjh6zcaMzaagMPGhMF42zHt3srXeUjWx6aLB2uHpxcWkLWioTH_FbZRjzE3swid2mIqsywU9gB5w6kDoQFmht3J2I0k5pXzg6qJr4quICUJSbeqwWFTx-0MIYLYNO0EHyLq63rtKzfN1HGTt85_VD16yeTcXkJn_eyA9TiEm7CYrfIyYHlj41dKNdmACjRRvlzq1JU')" }}
                                        ></div>
                                        <div className="card-overlay"></div>
                                        <div className="card-number">02 — Classic</div>
                                    </div>
                                    <div className="card-content">
                                        <h3 className="card-title">The Physical Muse</h3>
                                        <p className="card-desc">
                                            Traditional model bookings. Get discovered by agencies for runway, editorial, and brand representation.
                                        </p>
                                        <div className="card-footer">
                                            <span className="card-tag">Physical</span>
                                            <div className="card-checkbox"></div>
                                        </div>
                                    </div>
                                </div>
                            </label>

                            {/* Both */}
                            <label className="group relative cursor-pointer block h-full">
                                <input
                                    className="selection-input"
                                    name="account_type"
                                    type="radio"
                                    value="both"
                                    checked={accountType === 'both'}
                                    onChange={() => setAccountType('both')}
                                />
                                <div className="selection-card recommended">
                                    <div className="card-image-wrapper">
                                        <div
                                            className="card-image"
                                            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBrq_jpMw-8GLv6SDwDw2gXdqqq23th_h1UU6X2nqteebuxBMFGZPxSTfp681yRdZVzFBl2e1iCMb4Zpb8Qrm9DPwcWC12EydO5zCRw3OJHnWi2mQHEZClaT4INU86NGa6bKJ0ngAXOBg3ltp0du7OEvDc7yzcF7sWCgloUlIrg92Pa9dZoLPpEJrsnSKBxzceIZHAkdiFI_FNoKUONeb4mwQ-Zy_exS74qTdrNCsbrYVMpbiH-o0bLRxtoHLaljFpJckazQCW7ytw')" }}
                                        ></div>
                                        <div className="card-overlay"></div>
                                        <div className="card-number">03 — Hybrid</div>
                                        <div className="recommended-badge">RECOMMENDED</div>
                                    </div>
                                    <div className="card-content">
                                        <h3 className="card-title">The Hybrid Muse</h3>
                                        <p className="card-desc">
                                            Get the best of both worlds. AI content generation plus real bookings for maximum earning potential.
                                        </p>
                                        <div className="card-footer">
                                            <span className="card-tag">AI + Physical</span>
                                            <div className="card-checkbox"></div>
                                        </div>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </>
                );

                        // ========================================
            // STEP 2: Target Earnings
            // ========================================
            case 2:
                return (
                    <div className="step-content-wrapper">
                        <div className="step-header" style={{ width: '100%', maxWidth: '700px' }}>
                            <h2 className="step-headline" style={{ textAlign: 'center' }}>Set Your <span className="italic-text text-primary">Target</span></h2>
                            <p className="step-description" style={{ textAlign: 'center' }}>
                                Choose a monthly earnings goal to calibrate your brand exposure.
                            </p>
                        </div>

                        <div className="target-card">
                            <div className="target-header">ESTIMATED MONTHLY</div>
                            <div className="target-display">
                                <span className="currency">£</span>
                                <span className="amount">{targetEarnings.toLocaleString()}</span>
                            </div>

                            <div className="target-badge">
                                <span className="material-symbols-outlined badge-icon">verified</span>
                                <span>~{Math.ceil(targetEarnings / 400)} Brand Collaborations</span>
                            </div>

                            <div className="slider-container">
                                <input
                                    type="range"
                                    min="0"
                                    max="15000"
                                    step="100"
                                    value={targetEarnings}
                                    onChange={(e) => setTargetEarnings(Number(e.target.value))}
                                    className="earn-slider"
                                    style={{
                                        background: `linear-gradient(to right, #F1E0B6 0%, #F1E0B6 ${(targetEarnings / 15000) * 100}%, rgba(255, 255, 255, 0.1) ${(targetEarnings / 15000) * 100}%, rgba(255, 255, 255, 0.1) 100%)`
                                    }}
                                />
                                <div className="slider-labels">
                                    <span>£0</span>
                                    <span>£5,000</span>
                                    <span>£15,000+</span>
                                </div>
                            </div>

                            <p className="target-hint">
                                Recommended starting range: £1,500 - £3,000
                            </p>
                        </div>
                    </div>
                );

            // ========================================
            // STEP 3: Media Upload
            // ========================================
            case 3:
                return (
                    <div className="step-content-wrapper" style={{ width: '100%', maxWidth: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px' }}>
                        <div className="step-header" style={{ width: '100%', maxWidth: '800px' }}>
                            <div className="separator-line"></div>
                            <h2 className="step-headline" style={{ textAlign: 'center' }}>Upload your <span className="italic-text text-primary">source media</span></h2>
                            <p className="step-description" style={{ textAlign: 'center' }}>
                                {accountType === 'ai_only'
                                    ? 'Add at least 1 source photo to create your AI profile privately.'
                                    : `Add at least ${minPhotosRequired} source photos to continue.`
                                }
                            </p>

                            {/* Hiển thị lỗi Upload nếu có */}
                            {uploadError && (
                                <div style={{
                                    margin: '16px auto 0',
                                    padding: '12px 16px',
                                    backgroundColor: 'rgba(255, 71, 87, 0.1)',
                                    border: '1px solid rgba(255, 71, 87, 0.3)',
                                    borderRadius: '8px',
                                    color: '#ff4757',
                                    fontSize: '0.85rem',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                                    {uploadError}
                                </div>
                            )}

                            <div className="quality-guidelines" style={{ background: 'rgba(241, 224, 182, 0.05)', border: '1px solid rgba(241, 224, 182, 0.2)', padding: '18px 20px', borderRadius: '8px', textAlign: 'left', width: '100%', margin: '32px auto 0' }}>
                                <h4 style={{ fontSize: '0.65rem', color: 'var(--primary, #F1E0B6)', marginBottom: '12px', letterSpacing: '0.12em' }}>FOR BEST APPROVAL RESULTS</h4>
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    {[
                                        'Good lighting (natural preferred)',
                                        'Clear face visibility (no sunglasses/heavy makeup)',
                                        'Mix of full body, half body, and close-ups',
                                        'Neutral backgrounds recommended'
                                    ].map((item) => (
                                        <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255,255,255,0.72)', fontSize: '0.8rem', lineHeight: 1.45 }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary, #F1E0B6)', marginTop: '1px' }}>check_circle</span>
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(241, 224, 182, 0.12)', display: 'grid', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255,255,255,0.72)', fontSize: '0.78rem', lineHeight: 1.45 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary, #F1E0B6)', marginTop: '1px' }}>shield_lock</span>
                                        <span>Uploaded photos and videos stay private during onboarding and are used for review and AI image generation only.</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'rgba(255,255,255,0.55)', fontSize: '0.74rem', lineHeight: 1.45 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>visibility_off</span>
                                        <span>Your uploaded source media is not published publicly at this stage.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-section" style={{ width: '100%', maxWidth: '800px', marginTop: '32px' }}>
                            <div className="section-header-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                <h3 style={{ fontSize: '0.65rem', color: 'var(--primary)', letterSpacing: '0.15em', fontWeight: 600 }}>SOURCE PHOTOS ({galleryPhotoCount} / 6)</h3>
                                <p className="bio-hint" style={{ marginTop: 0 }}>Upload the photos that will be used later to generate your profile imagery.</p>
                            </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px', marginTop: '16px' }}>
                                    {[0, 1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} style={{ aspectRatio: '3/4', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                                            {photos.gallery[i] ? (
                                                <>
                                                    <img src={photos.gallery[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <button
                                                        onClick={() => setPhotos(prev => {
                                                            const g = [...prev.gallery];
                                                            g[i] = null;
                                                            return { ...prev, gallery: g };
                                                        })}
                                                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer' }}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                                                    </button>
                                                </>
                                            ) : (
                                                <label style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '8px', color: 'rgba(255,255,255,0.4)' }}>
                                                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload('gallery', e.target.files[0], i)} style={{ display: 'none' }} />
                                                    <span className="material-symbols-outlined" style={{ opacity: 0.45, fontSize: '24px' }}>add</span>
                                                    <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Add photo</span>
                                                </label>
                                            )}
                                            {uploading.galleryIndexes.has(i) && (
                                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div className="spinner-small"></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '999px', border: `1px solid ${remainingPhotosRequired > 0 ? 'rgba(241, 224, 182, 0.24)' : 'rgba(91, 214, 141, 0.25)'}`, background: remainingPhotosRequired > 0 ? 'rgba(241, 224, 182, 0.08)' : 'rgba(91, 214, 141, 0.08)', color: remainingPhotosRequired > 0 ? 'var(--primary, #F1E0B6)' : '#5BD68D', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{remainingPhotosRequired > 0 ? 'schedule' : 'check_circle'}</span>
                                    <span>
                                        {remainingPhotosRequired > 0
                                            ? `${remainingPhotosRequired} more photo${remainingPhotosRequired > 1 ? 's' : ''} required to continue`
                                            : 'Ready to continue'}
                                    </span>
                                </div>
                        </div>

                        <div className="form-section" style={{ width: '100%', maxWidth: '800px', marginTop: '40px' }}>
                            <div className="section-header-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                <h3 style={{ fontSize: '0.65rem', color: 'var(--primary)', letterSpacing: '0.15em', fontWeight: 600 }}>PRIVATE VIDEO (OPTIONAL)</h3>
                                <p className="bio-hint" style={{ marginTop: 0 }}>Add one intro or movement clip for internal review. This will not be published at this stage.</p>
                            </div>
                            <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                                <div style={{ aspectRatio: '16/10', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                                    {uploadedVideos[0] ? (
                                        <>
                                            <video src={uploadedVideos[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls muted playsInline />
                                            <button
                                                onClick={() => setPhotos(prev => ({ ...prev, videos: [] }))}
                                                style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.55)', border: 'none', color: 'white', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                                            </button>
                                        </>
                                    ) : (
                                        <label style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '8px', color: 'rgba(255,255,255,0.4)', padding: '20px', textAlign: 'center' }}>
                                            <input type="file" accept="video/*" onChange={(e) => handleFileUpload('videos', e.target.files[0], 0)} style={{ display: 'none' }} />
                                            <span className="material-symbols-outlined" style={{ opacity: 0.5, fontSize: '28px' }}>video_library</span>
                                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Upload video</span>
                                            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>MP4, MOV or WebM</span>
                                        </label>
                                    )}
                                    {uploading.videos === 0 && (
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div className="spinner-small"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="form-section" style={{ width: '100%', maxWidth: '800px', marginTop: '40px' }}>
                            <div className="section-header-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                <h3 style={{ fontSize: '0.65rem', color: 'var(--primary)', letterSpacing: '0.15em', fontWeight: 600 }}>ELITE BOOST (OPTIONAL)</h3>
                                <p className="bio-hint" style={{ marginTop: 0 }}>Increase visibility after review with priority placement and a premium badge.</p>
                            </div>
                            <div
                                className={`elite-toggle-wrapper ${eliteBoost ? 'active' : ''}`}
                                onClick={() => setEliteBoost(!eliteBoost)}
                                style={{ marginTop: '16px', maxWidth: '520px' }}
                            >
                                <div className="toggle-switch">
                                    <div className="toggle-knob"></div>
                                </div>
                                <div className="toggle-label-group">
                                    <span className="toggle-main-label">ACTIVATE ELITE BOOST</span>
                                    <span className="toggle-sub-label">Priority visibility after approval</span>
                                </div>
                            </div>
                            <p className="bio-hint" style={{ marginTop: '12px', opacity: eliteBoost ? 0.8 : 0.45 }}>
                                Annual fee applies only after your profile has been reviewed and approved.
                            </p>
                        </div>
                    </div>
                );

            // ========================================
            // STEP 4: Profile & Preferences
            // ========================================
            case 4:
                return (
                    <div className="step-content-wrapper">
                        <div className="step-header" style={{ width: '100%', maxWidth: '800px' }}>
                            <div className="separator-line"></div>
                            <h2 className="step-headline" style={{ textAlign: 'center' }}>Shape your <span className="italic-text text-primary">profile</span></h2>
                            <p className="step-description" style={{ textAlign: 'center' }}>
                                Add the details reviewers and future profile previews will use once your application is approved.
                            </p>
                        </div>

                        <div className="form-section">
                            <label className="input-label">DISPLAY NAME *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="polish-input"
                                placeholder="Your professional name"
                            />
                        </div>

                        <div className="form-section">
                            <label className="input-label">BIOGRAPHY <span style={{ opacity: 0.5, fontWeight: 400 }}>(OPTIONAL)</span></label>
                            <div className="bio-input-wrapper" style={{ position: 'relative' }}>
                                <textarea
                                    className="bio-textarea"
                                    value={bioDraft}
                                    onChange={(e) => setBioDraft(e.target.value)}
                                    placeholder="Write your bio here, or generate an AI draft from your profile details."
                                    style={{ 
                                        minHeight: '180px', 
                                        paddingBottom: '56px', 
                                        whiteSpace: 'pre-wrap',
                                        width: '100%',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#fff',
                                        resize: 'vertical',
                                        outline: 'none',
                                        fontFamily: 'inherit'
                                    }}
                                />
                                <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                    <div className="char-counter" style={{ fontSize: '0.6rem', opacity: 0.5 }}>
                                        {bioDraft ? `${bioDraft.length} / 500` : 'Ready to generate'}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleGenerateBio}
                                        disabled={isGeneratingBio}
                                        style={{
                                            background: 'rgba(241, 224, 182, 0.1)',
                                            border: '1px solid rgba(241, 224, 182, 0.2)',
                                            color: 'var(--primary)',
                                            fontSize: '0.65rem',
                                            padding: '4px 10px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{isGeneratingBio ? 'sync' : 'auto_awesome'}</span>
                                        {isGeneratingBio ? 'GENERATING...' : bioDraft ? 'REGENERATE' : 'GENERATE AI BIO'}
                                    </button>
                                </div>
                            </div>
                            <p className="bio-hint" style={{ marginTop: '10px' }}>
                                This draft will be generated from your onboarding details and can be edited after you submit for review.
                            </p>
                            {bioDraftError && (
                                <p className="bio-hint" style={{ marginTop: '8px', color: '#ff6b6b' }}>
                                    {bioDraftError}
                                </p>
                            )}
                        </div>

                        <div className="form-section" style={{ position: 'relative' }}>
                            <label className="input-label">CITY *</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData(prev => ({ ...prev, location: value }));
                                    setShowLocationDropdown(value.trim().length > 0);
                                }}
                                onFocus={() => setShowLocationDropdown(formData.location.trim().length > 0)}
                                onBlur={() => setTimeout(() => setShowLocationDropdown(false), 150)}
                                className="polish-input"
                                placeholder="Search for your city"
                            />
                            {showLocationDropdown && filteredLocations.length > 0 && (
                                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 10, background: '#141414', border: '1px solid rgba(241, 224, 182, 0.14)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.45)' }}>
                                    {filteredLocations.map((location) => (
                                        <button
                                            key={location}
                                            type="button"
                                            onMouseDown={() => {
                                                setFormData(prev => ({ ...prev, location }));
                                                setShowLocationDropdown(false);
                                            }}
                                            style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.82)', padding: '12px 16px', fontSize: '0.8rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                        >
                                            {location}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <p className="bio-hint" style={{ marginTop: '10px' }}>Select your base city so brands and agencies know where you are available.</p>
                        </div>

                        <div className="form-section" style={{ marginTop: '32px' }}>
                            <label className="input-label">CONTENT PREFERENCES *</label>
                            <p className="bio-hint" style={{ marginTop: 0 }}>Select the types of content you are willing to model for.</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '16px' }}>
                                {CONTENT_CATEGORIES.map(cat => (
                                    <div 
                                        key={cat.key}
                                        onClick={() => toggleContentPreference(cat.key)}
                                        style={{ 
                                            padding: '12px 16px', 
                                            borderRadius: '8px', 
                                            border: `1px solid ${contentPreferences.includes(cat.key) ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                                            background: contentPreferences.includes(cat.key) ? 'rgba(241, 224, 182, 0.08)' : 'rgba(255,255,255,0.02)',
                                            color: contentPreferences.includes(cat.key) ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{cat.icon}</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: contentPreferences.includes(cat.key) ? 600 : 400 }}>{cat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-section" style={{ marginTop: '32px' }}>
                            <label className="input-label">STYLE TAGS (OPTIONAL)</label>
                            <p className="bio-hint" style={{ marginTop: 0 }}>Select tags that describe your modeling style.</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                {STYLE_TAGS.map(tag => (
                                    <div 
                                        key={tag}
                                        onClick={() => setFormData(prev => ({
                                            ...prev, 
                                            styleTags: prev.styleTags.includes(tag) 
                                                ? prev.styleTags.filter(t => t !== tag) 
                                                : [...prev.styleTags, tag]
                                        }))}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            border: `1px solid ${formData.styleTags.includes(tag) ? 'var(--primary)' : 'rgba(255,255,255,0.2)'}`,
                                            background: formData.styleTags.includes(tag) ? 'rgba(241, 224, 182, 0.1)' : 'transparent',
                                            color: formData.styleTags.includes(tag) ? 'var(--primary)' : 'rgba(255,255,255,0.6)',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {tag}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Show booking rates only for real/both */}
                        {accountType !== 'ai_only' && (
                            <div className="form-section" style={{ marginTop: '20px', width: '100%', maxWidth: '560px' }}>
                                <label className="input-label" style={{ textAlign: 'center', display: 'block' }}>BOOKING RATES (GBP)</label>
                                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '16px', textAlign: 'center' }}>
                                    Set your rates for real bookings with brands and agencies.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Hourly</span>
                                        <input
                                            type="number"
                                            value={pricing.hourlyRate}
                                            onChange={(e) => setPricing(prev => ({ ...prev, hourlyRate: parseInt(e.target.value) || 0 }))}
                                            className="polish-input"
                                            style={{ marginTop: '6px' }}
                                        />
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Half Day</span>
                                        <input
                                            type="number"
                                            value={pricing.halfDayRate}
                                            onChange={(e) => setPricing(prev => ({ ...prev, halfDayRate: parseInt(e.target.value) || 0 }))}
                                            className="polish-input"
                                            style={{ marginTop: '6px' }}
                                        />
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Full Day</span>
                                        <input
                                            type="number"
                                            value={pricing.fullDayRate}
                                            onChange={(e) => setPricing(prev => ({ ...prev, fullDayRate: parseInt(e.target.value) || 0 }))}
                                            className="polish-input"
                                            style={{ marginTop: '6px' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ width: '100%', margin: '40px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}></div>

                        <div className="step-header" style={{ width: '100%', maxWidth: '800px', marginBottom: '20px', alignItems: 'flex-start', textAlign: 'left' }}>
                            <h2 className="step-headline" style={{ textAlign: 'left', fontSize: '1.6rem' }}>Optional — Connect your <span className="italic-text text-primary">socials</span></h2>
                            <p className="step-description" style={{ textAlign: 'left', maxWidth: '100%' }}>
                                Helps reviewers understand your presence and gives agencies more context once your profile is approved.
                            </p>
                        </div>

                        <div className="social-grid" style={{ width: '100%', maxWidth: '800px' }}>
                            <div className={`social-card ${socialLinks.instagram ? 'connected' : ''}`}>
                                <div className="social-info">
                                    <div className="social-icon" style={{ background: 'transparent', overflow: 'hidden', borderRadius: '8px' }}>
                                        <svg viewBox="0 0 2500 2500" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><defs><radialGradient id="ig0" cx="332.14" cy="2511.81" r="3263.54" gradientUnits="userSpaceOnUse"><stop offset=".09" stopColor="#fa8f21" /><stop offset=".78" stopColor="#d82d7e" /></radialGradient><radialGradient id="ig1" cx="1516.14" cy="2623.81" r="2572.12" gradientUnits="userSpaceOnUse"><stop offset=".64" stopColor="#8c3aaa" stopOpacity="0" /><stop offset="1" stopColor="#8c3aaa" /></radialGradient></defs><path d="M833.4,1250c0-230.11,186.49-416.7,416.6-416.7s416.7,186.59,416.7,416.7-186.59,416.7-416.7,416.7S833.4,1480.11,833.4,1250m-225.26,0c0,354.5,287.36,641.86,641.86,641.86S1891.86,1604.5,1891.86,1250,1604.5,608.14,1250,608.14,608.14,895.5,608.14,1250M1767.27,582.69a150,150,0,1,0,150.06-149.94h-0.06a150.07,150.07,0,0,0-150,149.94M745,2267.47c-121.87-5.55-188.11-25.85-232.13-43-58.36-22.72-100-49.78-143.78-93.5s-70.88-85.32-93.5-143.68c-17.16-44-37.46-110.26-43-232.13-6.06-131.76-7.27-171.34-7.27-505.15s1.31-373.28,7.27-505.15c5.55-121.87,26-188,43-232.13,22.72-58.36,49.78-100,93.5-143.78s85.32-70.88,143.78-93.5c44-17.16,110.26-37.46,232.13-43,131.76-6.06,171.34-7.27,505-7.27s373.28,1.31,505.15,7.27c121.87,5.55,188,26,232.13,43,58.36,22.62,100,49.78,143.78,93.5s70.78,85.42,93.5,143.78c17.16,44,37.46,110.26,43,232.13,6.06,131.87,7.27,171.34,7.27,505.15s-1.21,373.28-7.27,505.15c-5.55,121.87-25.95,188.11-43,232.13-22.72,58.36-49.78,100-93.5,143.68s-85.42,70.78-143.78,93.5c-44,17.16-110.26,37.46-232.13,43-131.76,6.06-171.34,7.27-505.15,7.27s-373.28-1.21-505-7.27M734.65,7.57c-133.07,6.06-224,27.16-303.41,58.06C349,97.54,279.38,140.35,209.81,209.81S97.54,349,65.63,431.24c-30.9,79.46-52,170.34-58.06,303.41C1.41,867.93,0,910.54,0,1250s1.41,382.07,7.57,515.35c6.06,133.08,27.16,223.95,58.06,303.41,31.91,82.19,74.62,152,144.18,221.43S349,2402.37,431.24,2434.37c79.56,30.9,170.34,52,303.41,58.06C868,2498.49,910.54,2500,1250,2500s382.07-1.41,515.35-7.57c133.08-6.06,223.95-27.16,303.41-58.06,82.19-32,151.86-74.72,221.43-144.18s112.18-139.24,144.18-221.43c30.9-79.46,52.1-170.34,58.06-303.41,6.06-133.38,7.47-175.89,7.47-515.35s-1.41-382.07-7.47-515.35c-6.06-133.08-27.16-224-58.06-303.41-32-82.19-74.72-151.86-144.18-221.43S2150.95,97.54,2068.86,65.63c-79.56-30.9-170.44-52.1-303.41-58.06C1632.17,1.51,1589.56,0,1250.1,0S868,1.41,734.65,7.57" fill="url(#ig0)" /><path d="M833.4,1250c0-230.11,186.49-416.7,416.6-416.7s416.7,186.59,416.7,416.7-186.59,416.7-416.7,416.7S833.4,1480.11,833.4,1250m-225.26,0c0,354.5,287.36,641.86,641.86,641.86S1891.86,1604.5,1891.86,1250,1604.5,608.14,1250,608.14,608.14,895.5,608.14,1250M1767.27,582.69a150,150,0,1,0,150.06-149.94h-0.06a150.07,150.07,0,0,0-150,149.94M745,2267.47c-121.87-5.55-188.11-25.85-232.13-43-58.36-22.72-100-49.78-143.78-93.5s-70.88-85.32-93.5-143.68c-17.16-44-37.46-110.26-43-232.13-6.06-131.76-7.27-171.34-7.27-505.15s1.31-373.28,7.27-505.15c5.55-121.87,26-188,43-232.13,22.72-58.36,49.78-100,93.5-143.78s85.32-70.88,143.78-93.5c44-17.16,110.26-37.46,232.13-43,131.76-6.06,171.34-7.27,505-7.27s373.28,1.31,505.15,7.27c121.87,5.55,188,26,232.13,43,58.36,22.62,100,49.78,143.78,93.5s70.78,85.42,93.5,143.78c17.16,44,37.46,110.26,43,232.13,6.06,131.87,7.27,171.34,7.27,505.15s-1.21,373.28-7.27,505.15c-5.55,121.87-25.95,188.11-43,232.13-22.72,58.36-49.78,100-93.5,143.68s-85.42,70.78-143.78,93.5c-44,17.16-110.26,37.46-232.13,43-131.76,6.06-171.34,7.27-505.15,7.27s-373.28-1.21-505-7.27M734.65,7.57c-133.07,6.06-224,27.16-303.41,58.06C349,97.54,279.38,140.35,209.81,209.81S97.54,349,65.63,431.24c-30.9,79.46-52,170.34-58.06,303.41C1.41,867.93,0,910.54,0,1250s1.41,382.07,7.57,515.35c6.06,133.08,27.16,223.95,58.06,303.41,31.91,82.19,74.62,152,144.18,221.43S349,2402.37,431.24,2434.37c79.56,30.9,170.34,52,303.41,58.06C868,2498.49,910.54,2500,1250,2500s382.07-1.41,515.35-7.57c133.08-6.06,223.95-27.16,303.41-58.06,82.19-32,151.86-74.72,221.43-144.18s112.18-139.24,144.18-221.43c30.9-79.46,52.1-170.34,58.06-303.41,6.06-133.38,7.47-175.89,7.47-515.35s-1.41-382.07-7.47-515.35c-6.06-133.08-27.16-224-58.06-303.41-32-82.19-74.72-151.86-144.18-221.43S2150.95,97.54,2068.86,65.63c-79.56-30.9-170.44-52.1-303.41-58.06C1632.17,1.51,1589.56,0,1250.1,0S868,1.41,734.65,7.57" fill="url(#ig1)" /></svg>
                                    </div>
                                    <div className="social-details" style={{ flex: 1, minWidth: 0 }}>
                                        <span className="social-name">Instagram</span>
                                        <input
                                            type="text"
                                            placeholder="@username or profile URL"
                                            value={socialLinks.instagram}
                                            onChange={(e) => setSocialLinks(prev => ({ ...prev, instagram: e.target.value }))}
                                            className="social-input"
                                            style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.75rem', padding: '4px 0', width: '100%', minWidth: 0, outline: 'none', boxShadow: 'none' }}
                                        />
                                    </div>
                                </div>
                                {socialLinks.instagram && <span className="status-dot connected">LINKED</span>}
                            </div>

                            <div className={`social-card ${socialLinks.tiktok ? 'connected' : ''}`}>
                                <div className="social-info">
                                    <div className="social-icon" style={{ background: 'transparent', overflow: 'hidden', borderRadius: '8px' }}>
                                        <svg viewBox="0 0 250 250" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><g clipRule="evenodd" fillRule="evenodd"><path d="M25 0h200c13.808 0 25 11.192 25 25v200c0 13.808-11.192 25-25 25H25c-13.808 0-25-11.192-25-25V25C0 11.192 11.192 0 25 0z" fill="#010101" /><path d="M156.98 230c7.607 0 13.774-6.117 13.774-13.662s-6.167-13.663-13.774-13.663h-2.075c7.607 0 13.774 6.118 13.774 13.663S162.512 230 154.905 230z" fill="#ee1d51" /><path d="M154.717 202.675h-2.075c-7.607 0-13.775 6.118-13.775 13.663S145.035 230 152.642 230h2.075c-7.608 0-13.775-6.117-13.775-13.662s6.167-13.663 13.775-13.663z" fill="#66c8cf" /><ellipse cx="154.811" cy="216.338" fill="#010101" rx="6.699" ry="6.643" /><path d="M50 196.5v6.925h8.112v26.388h8.115v-26.201h6.603l2.264-7.112zm66.415 0v6.925h8.112v26.388h8.115v-26.201h6.603l2.264-7.112zm-39.81 3.93c0-2.17 1.771-3.93 3.959-3.93 2.19 0 3.963 1.76 3.963 3.93s-1.772 3.93-3.963 3.93c-2.188-.001-3.959-1.76-3.959-3.93zm0 6.738h7.922v22.645h-7.922zM87.924 196.5v33.313h7.925v-8.608l2.453-2.248L106.037 230h8.49l-11.133-16.095 10-9.733h-9.622l-7.923 7.86V196.5zm85.47 0v33.313h7.926v-8.608l2.452-2.248L191.509 230H200l-11.133-16.095 10-9.733h-9.622l-7.925 7.86V196.5z" fill="#ffffff" /><path d="M161.167 81.186c10.944 7.819 24.352 12.42 38.832 12.42V65.755a39.26 39.26 0 0 1-8.155-.853v21.923c-14.479 0-27.885-4.601-38.832-12.42v56.835c0 28.432-23.06 51.479-51.505 51.479-10.613 0-20.478-3.207-28.673-8.707C82.187 183.57 95.23 189.5 109.66 189.5c28.447 0 51.508-23.047 51.508-51.48V81.186zm10.06-28.098c-5.593-6.107-9.265-14-10.06-22.726V26.78h-7.728c1.945 11.09 8.58 20.565 17.788 26.308zm-80.402 99.107a23.445 23.445 0 0 1-4.806-14.256c0-13.004 10.548-23.547 23.561-23.547a23.6 23.6 0 0 1 7.147 1.103V87.022a51.97 51.97 0 0 0-8.152-.469v22.162a23.619 23.619 0 0 0-7.15-1.103c-13.013 0-23.56 10.543-23.56 23.548 0 9.195 5.272 17.157 12.96 21.035z" fill="#ee1d52" /><path d="M153.012 74.405c10.947 7.819 24.353 12.42 38.832 12.42V64.902c-8.082-1.72-15.237-5.942-20.617-11.814-9.208-5.743-15.843-15.218-17.788-26.308H133.14v111.239c-.046 12.968-10.576 23.468-23.561 23.468-7.652 0-14.45-3.645-18.755-9.292-7.688-3.878-12.96-11.84-12.96-21.035 0-13.005 10.547-23.548 23.56-23.548 2.493 0 4.896.388 7.15 1.103V86.553c-27.945.577-50.42 23.399-50.42 51.467 0 14.011 5.597 26.713 14.68 35.993 8.195 5.5 18.06 8.707 28.673 8.707 28.445 0 51.505-23.048 51.505-51.479z" fill="#ffffff" /><path d="M191.844 64.902v-5.928a38.84 38.84 0 0 1-20.617-5.887 38.948 38.948 0 0 0 20.617 11.815zM153.439 26.78a39.524 39.524 0 0 1-.427-3.198V20h-28.028v111.24c-.045 12.967-10.574 23.467-23.56 23.467-3.813 0-7.412-.904-10.6-2.512 4.305 5.647 11.103 9.292 18.755 9.292 12.984 0 23.515-10.5 23.561-23.468V26.78zm-44.864 59.773v-6.311a51.97 51.97 0 0 0-7.067-.479C73.06 79.763 50 102.811 50 131.24c0 17.824 9.063 33.532 22.835 42.772-9.083-9.28-14.68-21.982-14.68-35.993 0-28.067 22.474-50.889 50.42-51.466z" fill="#69c9d0" /><path d="M154.904 230c7.607 0 13.775-6.117 13.775-13.662s-6.168-13.663-13.775-13.663h-.188c-7.607 0-13.774 6.118-13.774 13.663S147.109 230 154.716 230zm-6.792-13.662c0-3.67 3-6.643 6.7-6.643 3.697 0 6.697 2.973 6.697 6.643s-3 6.645-6.697 6.645c-3.7-.001-6.7-2.975-6.7-6.645z" fill="#ffffff" /></g></svg>
                                    </div>
                                    <div className="social-details" style={{ flex: 1, minWidth: 0 }}>
                                        <span className="social-name">TikTok</span>
                                        <input
                                            type="text"
                                            placeholder="@username or profile URL"
                                            value={socialLinks.tiktok}
                                            onChange={(e) => setSocialLinks(prev => ({ ...prev, tiktok: e.target.value }))}
                                            className="social-input"
                                            style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.75rem', padding: '4px 0', width: '100%', minWidth: 0, outline: 'none', boxShadow: 'none' }}
                                        />
                                    </div>
                                </div>
                                {socialLinks.tiktok && <span className="status-dot connected">LINKED</span>}
                            </div>
                        </div>

                        <p className="bio-hint" style={{ width: '100%', maxWidth: '800px', marginTop: '16px', opacity: 0.5 }}>
                            Social links are optional but recommended. Verified social presence increases your discoverability.
                        </p>
                    </div>
                );

            // ========================================
            // STEP 5: Elite & Launch
            // ========================================
            case 5:
                return (
                    <div className="step-content-wrapper full-height-step" style={{ flex: 1, width: '100%', paddingTop: '32px', paddingBottom: '32px' }}>
                        <div className="step-header" style={{ width: '100%', maxWidth: '900px', alignItems: 'flex-start', textAlign: 'left', marginBottom: '28px' }}>
                            <h2 className="step-headline" style={{ textAlign: 'left' }}>Review your <span className="italic-text text-primary">private draft</span></h2>
                            <p className="step-description" style={{ textAlign: 'left', maxWidth: '100%' }}>
                                Your uploaded source media stays private. Step 5 is a final review and submission step; image generation happens after approval.
                            </p>
                        </div>

                        <div style={{ width: '100%', maxWidth: '900px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>
                                <div style={{ aspectRatio: '16/9', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {photos.gallery[0] ? (
                                        <img src={photos.gallery[0]} alt="Source photo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.72rem', textAlign: 'center', lineHeight: 1.5, padding: '24px' }}>Your first uploaded source photo appears here as the draft preview</div>
                                    )}
                                </div>
                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>{formData.name || 'Your display name'}</h3>
                                            <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{formData.location || 'City will appear here'}</p>
                                        </div>
                                        {eliteBoost && <span style={{ border: '1px solid rgba(241, 224, 182, 0.26)', color: 'var(--primary)', borderRadius: '999px', padding: '6px 10px', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Elite boost</span>}
                                    </div>
                                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontSize: '0.86rem' }}>{bioDraft || (isGeneratingBio ? 'Generating your AI bio draft...' : 'Generate your AI bio draft in step 4 before submitting for review.')}</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
                                        {contentPreferences.map(pref => (
                                            <span key={pref} style={{ padding: '7px 12px', borderRadius: '999px', border: '1px solid rgba(241, 224, 182, 0.18)', color: 'rgba(255,255,255,0.75)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{pref}</span>
                                        ))}
                                    </div>
                                    {accountType !== 'ai_only' && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', marginTop: '24px' }}>
                                            {[
                                                ['Hourly', pricing.hourlyRate],
                                                ['Half Day', pricing.halfDayRate],
                                                ['Full Day', pricing.fullDayRate],
                                            ].map(([label, value]) => (
                                                <div key={label} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)' }}>
                                                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                                                    <div style={{ marginTop: '6px', fontSize: '1rem', color: '#fff' }}>£{value || 0}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '20px' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--primary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>Draft summary</div>
                                    <div style={{ display: 'grid', gap: '10px', color: 'rgba(255,255,255,0.72)', fontSize: '0.8rem' }}>
                                        <div>{totalPhotos} source photo{totalPhotos !== 1 ? 's' : ''} uploaded</div>
                                        <div>{uploadedVideos.length ? `${uploadedVideos.length} private video uploaded` : 'No private video uploaded yet'}</div>
                                        <div>{socialLinks.instagram || socialLinks.tiktok ? 'Social links added' : 'No social links added yet'}</div>
                                        <div>{accountType === 'ai_only' ? 'AI twin profile' : accountType === 'real_only' ? 'Real model profile' : 'Hybrid profile'}</div>
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(241, 224, 182, 0.05)', border: '1px solid rgba(241, 224, 182, 0.16)', borderRadius: '20px', padding: '20px' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--primary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>Next stage</div>
                                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontSize: '0.82rem' }}>
                                        Once you submit, your profile goes live immediately and can be discovered by brands and agencies right away.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
                            <div className={`confirm-box ${finalConfig.confirmed ? 'checked' : ''}`} onClick={() => setFinalConfig({ ...finalConfig, confirmed: !finalConfig.confirmed })} style={{ maxWidth: '720px', width: '100%' }}>
                                <div className="checkbox-custom">
                                    {finalConfig.confirmed && <span className="material-symbols-outlined">check</span>}
                                </div>
                                <div className="confirm-text">
                                    <h4>Confirm & Go Live</h4>
                                    <p>I agree to the <span className="underline">Terms of Service</span> and confirm that my profile is ready to be published on Catwalk.AI.</p>
                                </div>
                            </div>

                            <button
                                className="launch-btn"
                                disabled={
                                    !finalConfig.confirmed ||
                                    isSubmitting ||
                                    !formData.name ||
                                    !formData.location ||
                                    galleryPhotoCount === 0
                                }
                                onClick={handleSubmit}
                                style={{ maxWidth: '720px', width: '100%' }}
                            >
                                {isSubmitting ? 'PUBLISHING...' : 'GO LIVE NOW'} <span className="material-symbols-outlined rocket-icon">arrow_outward</span>
                            </button>
                            {submitError && (
                                <p className="launch-eta" style={{ color: '#ff6b6b' }}>{submitError}</p>
                            )}
                            <p className="launch-eta" style={{ textAlign: 'center' }}>
                                {galleryPhotoCount === 0 ? 'Source Photos Required • ' : ''}
                                {!formData.name ? 'Display Name Required • ' : ''}
                                {!formData.location ? 'City Required • ' : ''}
                                Your profile will be visible to brands immediately
                            </p>
                        </div>
                    </div>
                );

            // ========================================
            // STEP 6: Success
            // ========================================
            case TOTAL_STEPS + 1:
                return (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        height: '100%',
                        padding: '24px 20px',
                        width: '100%',
                        overflow: 'hidden',
                        boxSizing: 'border-box'
                    }}>
                        <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
                            {/* Thin, elegant icon */}
                            <div style={{
                                width: '56px', height: '56px',
                                margin: '0 auto 20px',
                                borderRadius: '50%',
                                border: '1px solid rgba(241, 224, 182, 0.25)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--primary)'
                            }}>
                                <span className="material-symbols-outlined" style={{
                                    fontSize: '28px',
                                    fontVariationSettings: "'FILL' 0, 'wght' 100, 'GRAD' 0, 'opsz' 24"
                                }}>verified</span>
                            </div>

                            {/* Premium Editorial Heading */}
                            <h2 style={{
                                fontFamily: 'var(--font-serif)',
                                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                                color: 'var(--primary)',
                                fontWeight: 300,
                                letterSpacing: '-0.02em',
                                lineHeight: 1.1,
                                marginBottom: '16px',
                                textTransform: 'none'
                            }}>
                                You're Live 🎉
                            </h2>

                            {/* Subtitle */}
                            <p style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1rem',
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontWeight: 300,
                                lineHeight: 1.6,
                                maxWidth: '460px',
                                margin: '0 auto 36px'
                            }}>
                                You are now live on Catwalk.AI! Brands and agencies can discover your profile right away.
                            </p>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', width: '100%' }}>
                                <button
                                    onClick={() => navigate(createdModel?.username ? `/models/${createdModel.username}` : '/studio')}
                                    style={{
                                        backgroundColor: 'var(--primary)',
                                        color: 'var(--background-dark)',
                                        border: 'none',
                                        padding: '14px 40px',
                                        fontFamily: 'var(--font-display)',
                                        fontSize: '0.8rem',
                                        letterSpacing: '0.15em',
                                        textTransform: 'uppercase',
                                        cursor: 'pointer',
                                        transition: 'var(--transition-normal)',
                                        width: '100%',
                                        maxWidth: '320px'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary)'; }}
                                >
                                    {createdModel?.username ? 'View Your Profile' : 'Return to Dashboard'}
                                </button>

                                {accountType !== 'real_only' && (
                                    <button
                                        onClick={() => navigate('/studio/models-generator')}
                                        style={{
                                            backgroundColor: 'transparent',
                                            color: 'var(--primary)',
                                            border: '1px solid rgba(241, 224, 182, 0.3)',
                                            padding: '14px 40px',
                                            fontFamily: 'var(--font-display)',
                                            fontSize: '0.8rem',
                                            letterSpacing: '0.15em',
                                            textTransform: 'uppercase',
                                            cursor: 'pointer',
                                            transition: 'var(--transition-normal)',
                                            width: '100%',
                                            maxWidth: '320px'
                                        }}
                                        onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(241, 224, 182, 0.3)'; }}
                                    >
                                        Start AI Training
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="onboarding-container">
            {/* Main Content */}
            <main
                className="onboarding-main"
                style={step === 3 || step === 4 ? { justifyContent: 'flex-start', paddingTop: '56px' } : undefined}
            >
                {renderStep()}
            </main>

            {/* Footer — hidden on success screen */}
            {step <= TOTAL_STEPS && (
                <footer className="onboarding-footer">
                    <div className="footer-content">
                        <button className="back-btn" onClick={handleBack}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>west</span>
                            Back
                        </button>

                        <div className="footer-actions">
                            {step <= TOTAL_STEPS && step < TOTAL_STEPS && (
                                <>
                                    <div className="progress-info">
                                        <span className="progress-label">Step {step} / {TOTAL_STEPS}</span>
                                        <div className="progress-bar-track">
                                            <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
                                        </div>
                                    </div>
                                    <button className="continue-btn" onClick={handleNext} disabled={!canContinue()}>
                                        <span className="btn-text">Continue</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </footer>
            )}

            {/* Crop Modal for Profile Photo */}
            {cropImageSrc && (
                <ImageCropModal
                    imageSrc={cropImageSrc}
                    aspectRatio={3 / 4}
                    onConfirm={async (croppedFile) => {
                        setCropImageSrc(null);
                        await handleFileUpload('profile', croppedFile);
                    }}
                    onCancel={() => {
                        URL.revokeObjectURL(cropImageSrc);
                        setCropImageSrc(null);
                    }}
                />
            )}
        </div>
    );
};

export default BecomeModel;
