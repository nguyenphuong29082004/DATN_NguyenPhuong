import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePublicModels } from '../../../hooks/models/useModels';
import './Marketplace.css';

const Marketplace = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All Models');
    const [showEliteOnly, setShowEliteOnly] = useState(false);
    const [selectedModel, setSelectedModel] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingData, setBookingData] = useState({
        date: '',
        bookingType: 'full_day',
        location: '',
        details: ''
    });
    const [sortBy, setSortBy] = useState('Elite First');
    const [sortOpen, setSortOpen] = useState(false);

    const sortOptions = ['Elite First', 'Price: Low to High', 'Price: High to Low', 'Newest First'];

    const categories = [
        'All Models',
        'Editorial',
        'Runway',
        'Streetwear',
        'Avant-Garde',
        'Minimalist',
        'Commercial'
    ];

    // Fetch models from DB via Clean Architecture hooks
    const { models: dbModels, isLoading: loading, error: _loadError } = usePublicModels(
        showEliteOnly ? { eliteOnly: true } : {}
    );

    // Map DB model objects to UI-compatible format
    const models = useMemo(() => dbModels.map(m => ({
        model_id: m.id,
        username: m.displayName || m.username || 'Unknown',
        profile_image_url: m.profileImageUrl,
        elite: m.isEliteActive || m.elite,
        verified: m.status === 'active',
        location: m.locations?.[0]?.city || '',
        agency: m.locations?.[0]?.agency || '',
        tags: m.styleTags || [],
        model_type: m.isAi ? (m.canBook ? 'both' : 'ai') : 'real',
        ai_price: m.pricePerImage,
        real_price: m.hourlyRate,
    })), [dbModels]);

    // Filter models based on search and category
    const filteredModels = useMemo(() => models.filter(model => {
        const matchesSearch = !searchQuery || 
            (model.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (model.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (model.agency || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (model.tags && model.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

        const matchesCategory = activeCategory === 'All Models' ||
            (model.tags && model.tags.some(t => t.toLowerCase() === activeCategory.toLowerCase()));

        return matchesSearch && matchesCategory;
    }), [models, searchQuery, activeCategory]);

    const handleStartShoot = (modelId) => {
        navigate(`/studio/quick-shoot?model_id=${modelId}`);
    };

    const handleBookModel = (model) => {
        setSelectedModel(model);
        setShowBookingModal(true);
    };

    const handleBookingSubmit = (e) => {
        e.preventDefault();
        // TODO: Submit booking to API
        console.log('Booking submitted:', {
            model_id: selectedModel.model_id,
            ...bookingData
        });
        // Close modal and reset
        setShowBookingModal(false);
        setBookingData({ date: '', bookingType: 'full_day', location: '', details: '' });
        setSelectedModel(null);
        // Show success message
        alert('Booking request submitted successfully!');
    };

    const handleCloseModal = () => {
        setShowBookingModal(false);
        setBookingData({ date: '', bookingType: 'full_day', location: '', details: '' });
        setSelectedModel(null);
    };

    return (
        <div className="marketplace-page">
            <div className="marketplace-content">
                {/* Header */}
                <header className="marketplace-header">
                    <div className="subtitle-group justify-center">
                        <div className="subtitle-line"></div>
                        <span className="subtitle-text">MARKETPLACE & BOOKING</span>
                        <div className="subtitle-line"></div>
                    </div>
                    <h1 className="marketplace-title editorial-kern">Marketplace & <span className="italic">Booking</span></h1>
                    <p className="marketplace-subtitle">
                        Discover and book AI models or real models for your fashion shoots. Browse curated talent and start your creative journey.
                    </p>
                </header>

                {/* Search Bar */}
                <div className="marketplace-search-section">
                    <div className="search-input-wrapper">
                        <span className="material-symbols-outlined search-icon thin-icon">search</span>
                        <input
                            type="text"
                            placeholder="Search models, agencies, locations..."
                            className="marketplace-search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Category Bar */}
                <div className="marketplace-category-bar">
                    <div className="category-list">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                className={`category-item ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="marketplace-main-layout">
                    {/* Sidebar Filters */}
                    <aside className="marketplace-sidebar">
                        <div>
                            <h3 className="sidebar-section-title">Refine Discovery</h3>
                            <div className="filter-group">
                                <div className="elite-toggle-card">
                                    <div className="toggle-info">
                                        <span className="toggle-label">Elite Talent</span>
                                        <span className="toggle-subtext">Top-tier curated models</span>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={showEliteOnly}
                                            onChange={(e) => setShowEliteOnly(e.target.checked)}
                                        />
                                        <span className="slider"></span>
                                    </label>
                                </div>

                                <div className="accordion-filter">
                                    <div className="accordion-header">
                                        <span className="accordion-title active">Model Type</span>
                                        <span className="material-symbols-outlined thin-icon">expand_less</span>
                                    </div>
                                    <div className="filter-options">
                                        <label className="filter-option">
                                            <input type="checkbox" defaultChecked /> AI MODELS
                                        </label>
                                        <label className="filter-option">
                                            <input type="checkbox" defaultChecked /> REAL MODELS
                                        </label>
                                        <label className="filter-option">
                                            <input type="checkbox" defaultChecked /> BOTH
                                        </label>
                                    </div>
                                </div>

                                <div className="accordion-filter">
                                    <div className="accordion-header">
                                        <span className="accordion-title active">Style Selection</span>
                                        <span className="material-symbols-outlined thin-icon">expand_less</span>
                                    </div>
                                    <div className="filter-options">
                                        <label className="filter-option">
                                            <input type="checkbox" defaultChecked /> MINIMALIST
                                        </label>
                                        <label className="filter-option">
                                            <input type="checkbox" /> AVANT-GARDE
                                        </label>
                                        <label className="filter-option">
                                            <input type="checkbox" defaultChecked /> EDITORIAL
                                        </label>
                                        <label className="filter-option">
                                            <input type="checkbox" /> RUNWAY
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button className="clear-filters-btn">Clear All</button>
                    </aside>

                    {/* Models Grid */}
                    <section className="marketplace-grid-area">
                        <div className="grid-header">
                            <div className="grid-header-info">
                                <h2>Model <span>Discovery</span></h2>
                                <p className="results-count">
                                    {filteredModels.length} {filteredModels.length === 1 ? 'MODEL' : 'MODELS'} AVAILABLE
                                </p>
                            </div>
                            <div className="grid-sort">
                                <span>Sort:</span>
                                <div className={`sort-dropdown ${sortOpen ? 'is-open' : ''}`}>
                                    <button
                                        type="button"
                                        className="sort-select-trigger"
                                        onClick={() => setSortOpen(!sortOpen)}
                                        aria-haspopup="listbox"
                                        aria-expanded={sortOpen}
                                    >
                                        {sortBy}
                                        <span className="material-symbols-outlined sort-chevron thin-icon">expand_more</span>
                                    </button>
                                    {sortOpen && (
                                        <>
                                            <div className="sort-dropdown-backdrop" onClick={() => setSortOpen(false)} aria-hidden="true" />
                                            <ul className="sort-dropdown-list" role="listbox">
                                                {sortOptions.map((opt) => (
                                                    <li
                                                        key={opt}
                                                        role="option"
                                                        aria-selected={sortBy === opt}
                                                        className={`sort-dropdown-option ${sortBy === opt ? 'active' : ''}`}
                                                        onClick={() => {
                                                            setSortBy(opt);
                                                            setSortOpen(false);
                                                        }}
                                                    >
                                                        {opt}
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="marketplace-loading">
                                <div className="marketplace-loading__spinner"></div>
                                <p>Loading models...</p>
                            </div>
                        ) : filteredModels.length === 0 ? (
                            <div className="marketplace-empty">
                                <span className="material-symbols-outlined thin-icon">person_off</span>
                                <h3>No models found</h3>
                                <p>Try adjusting your filters or search query.</p>
                            </div>
                        ) : (
                            <>
                                <div className="marketplace-grid">
                                    {filteredModels.map((model) => (
                                        <article key={model.model_id} className="marketplace-model-card">
                                            <div className="model-card-image-wrap">
                                                {model.elite && (
                                                    <div className="elite-badge">
                                                        <span className="material-symbols-outlined thin-icon">star</span>
                                                        ELITE
                                                    </div>
                                                )}
                                                <img
                                                    src={model.profile_image_url}
                                                    alt={model.username}
                                                />
                                                <div className="card-overlay">
                                                    <div className="overlay-actions">
                                                        <button
                                                            className="btn-shoot"
                                                            onClick={() => handleStartShoot(model.model_id)}
                                                        >
                                                            Start Shoot
                                                        </button>
                                                        {model.model_type === 'real' || model.model_type === 'both' ? (
                                                            <button
                                                                className="btn-book"
                                                                onClick={() => handleBookModel(model)}
                                                            >
                                                                Book Model
                                                            </button>
                                                        ) : null}
                                                        <Link
                                                            to={`/models/${model.username}`}
                                                            className="btn-profile"
                                                        >
                                                            View Profile
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="model-card-info">
                                                <div className="info-header">
                                                    <h3 className="model-name">{model.username}</h3>
                                                    {model.verified && (
                                                        <span className="material-symbols-outlined verified-icon thin-icon">
                                                            verified
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="model-meta">{model.location} • {model.agency}</p>
                                                <div className="model-tags">
                                                    {model.tags && model.tags.map((tag, idx) => (
                                                        <span key={idx} className="tag">{tag}</span>
                                                    ))}
                                                </div>
                                                <div className="model-pricing">
                                                    {model.ai_price && (
                                                        <div className="price-item">
                                                            <span className="price-label">AI Shoot:</span>
                                                            <span className="price-value">${model.ai_price}</span>
                                                        </div>
                                                    )}
                                                    {model.real_price && (
                                                        <div className="price-item">
                                                            <span className="price-label">Real Booking:</span>
                                                            <span className="price-value">${model.real_price}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </div >

            {/* Booking Modal */}
            {
                showBookingModal && selectedModel && (
                    <div className="booking-modal-overlay" onClick={handleCloseModal}>
                        <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="modal-title">Book {selectedModel.username}</h2>
                                <button className="modal-close" onClick={handleCloseModal}>
                                    <span className="material-symbols-outlined thin-icon">close</span>
                                </button>
                            </div>
                            <form className="booking-form" onSubmit={handleBookingSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={bookingData.date}
                                        onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div className="form-group">
                                    <span className="form-label">Booking type</span>
                                    <div className="booking-type-options" role="group" aria-label="Booking type">
                                        <label className="booking-type-option">
                                            <input
                                                type="radio"
                                                name="bookingType"
                                                value="half_day"
                                                checked={bookingData.bookingType === 'half_day'}
                                                onChange={() => setBookingData({ ...bookingData, bookingType: 'half_day' })}
                                            />
                                            <span>Half-Day</span>
                                        </label>
                                        <label className="booking-type-option">
                                            <input
                                                type="radio"
                                                name="bookingType"
                                                value="full_day"
                                                checked={bookingData.bookingType === 'full_day'}
                                                onChange={() => setBookingData({ ...bookingData, bookingType: 'full_day' })}
                                            />
                                            <span>Full-Day</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Location</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter location"
                                        value={bookingData.location}
                                        onChange={(e) => setBookingData({ ...bookingData, location: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Additional Details</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Add any special requirements or notes..."
                                        value={bookingData.details}
                                        onChange={(e) => setBookingData({ ...bookingData, details: e.target.value })}
                                        rows="4"
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-submit">
                                        Submit Booking Request
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Marketplace;
