import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LandingHeader, LandingFooter } from '../../components/landing';
import { usePublicModels } from '../../hooks/models/useModels';
import { useCreateBooking } from '../../hooks/bookings/useBookings';
import { useAuth } from '../../hooks/useAuth';
import './ModelsPage.css';

const MODEL_CATEGORIES = [
  'All Models',
  'Editorial',
  'Runway',
  'Streetwear',
  'Avant-Garde',
  'Minimalist',
  'Commercial'
];

export function ModelsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { category: urlCategory } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [manualCategory, setManualCategory] = useState('All Models');
  const [showEliteOnly, setShowEliteOnly] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    date: '',
    bookingType: 'full_day',
    location: '',
    details: ''
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [sortBy, setSortBy] = useState('Elite First');
  const [sortOpen, setSortOpen] = useState(false);
  const [filterModelType, setFilterModelType] = useState({ ai: true, real: true, both: true });
  const [selectedTags, setSelectedTags] = useState([]);

  const commonTags = [
    'Editorial', 'Commercial', 'Streetwear', 'Runway', 'Minimalist', 
    'Avant-Garde', 'Swimwear', 'Fitness', 'Lingerie', 'Plus Size'
  ];

  const sortOptions = ['Elite First', 'Price: Low to High', 'Price: High to Low', 'Newest First'];

  const activeCategory = useMemo(() => {
    if (!urlCategory) return manualCategory;
    const match = MODEL_CATEGORIES.find((category) => category.toLowerCase() === urlCategory.toLowerCase());
    return match || manualCategory;
  }, [manualCategory, urlCategory]);

  // Fetch models from DB via Clean Architecture
  const { createBookingAsync, isCreating: bookingSubmitting } = useCreateBooking();
  const { models: dbModels, isLoading: loading } = usePublicModels(
    showEliteOnly ? { eliteOnly: true } : {}
  );

  // Map DB model objects to UI-compatible format
  const models = useMemo(() => dbModels.map(m => ({
    model_id: m.id,
    displayName: m.displayName || m.username || 'Unknown',
    username: m.username || m.displayName || 'Unknown',
    profile_image_url: m.profileImageUrl,
    elite: m.isEliteActive || m.isElite || m.elite,
    verified: m.status === 'active',
    location: m.locations?.[0]?.city || m.location || '',
    agency: m.locations?.[0]?.agency || '',
    tags: m.styleTags || [],
    model_type: m.modelType || (m.isAi ? (m.canBook ? 'both' : 'ai') : 'real'),
    ai_price: m.aiGenerationCost || m.pricePerImage,
    real_price: m.realBookingCost || m.hourlyRate,
  })), [dbModels]);

  // Filter models based on search, category, and model type
  const filteredModels = useMemo(() => {
    let result = models.filter(model => {
      const matchesSearch = !searchQuery ||
        (model.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (model.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (model.agency || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (model.tags && model.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesType =
        (filterModelType.ai && model.model_type === 'ai') ||
        (filterModelType.real && model.model_type === 'real') ||
        (filterModelType.both && model.model_type === 'both');

      const matchesTagsList = selectedTags.length === 0 ||
        (model.tags && selectedTags.every(tag => 
          model.tags.some(t => t.toLowerCase() === tag.toLowerCase())
        ));

      const matchesCategory = activeCategory === 'All Models' || 
        (model.tags && model.tags.some(t => t.toLowerCase() === activeCategory.toLowerCase()));

      return matchesSearch && matchesCategory && matchesType && matchesTagsList;
    });

    // Apply sort
    switch (sortBy) {
      case 'Elite First':
        result.sort((a, b) => (b.elite ? 1 : 0) - (a.elite ? 1 : 0));
        break;
      case 'Price: Low to High':
        result.sort((a, b) => (a.ai_price || a.real_price || 999) - (b.ai_price || b.real_price || 999));
        break;
      case 'Price: High to Low':
        result.sort((a, b) => (b.ai_price || b.real_price || 0) - (a.ai_price || a.real_price || 0));
        break;
      case 'Newest First':
        // Already sorted by created_at desc from DB
        break;
      default:
        break;
    }

    return result;
  }, [models, searchQuery, activeCategory, filterModelType, selectedTags, sortBy]);

  const handleStartShoot = (modelId) => {
    navigate(`/studio/quick-shoot?model_id=${modelId}`);
  };

  const handleBookModel = (model) => {
    if (!user) {
        navigate('/login', { state: { from: '/models' } });
        return;
    }
    setSelectedModel(model);
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) {
        navigate('/login', { state: { from: '/models' } });
        return;
    }
    if (!selectedModel?.model_id) return;

    // Validation
    const todayStr = new Date().toISOString().split('T')[0];
    if (bookingData.date < todayStr) {
        alert('Please select today or a future date for the booking.');
        return;
    }

    try {
      await createBookingAsync({
        modelId: selectedModel.model_id,
        userId: user.id,
        date: bookingData.date,
        bookingType: bookingData.bookingType,
        location: bookingData.location,
        details: bookingData.details,
      });
      setBookingSuccess(true);
      setTimeout(() => {
        setShowBookingModal(false);
        setBookingSuccess(false);
        setBookingData({ date: '', bookingType: 'full_day', location: '', details: '' });
        setSelectedModel(null);
      }, 2000);
    } catch (err) {
      console.error('Booking failed:', err);
      alert('Failed to submit booking: ' + err.message);
    }
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setBookingData({ date: '', bookingType: 'full_day', location: '', details: '' });
    setSelectedModel(null);
    setBookingSuccess(false);
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setManualCategory('All Models');
    setShowEliteOnly(false);
    setFilterModelType({ ai: true, real: true, both: true });
    setSelectedTags([]);
  };


  const pageCategory = urlCategory ? urlCategory.charAt(0).toUpperCase() + urlCategory.slice(1) : null;
  const pageTitle = pageCategory
    ? `${pageCategory} Models — AI Fashion | Catwalk.ai`
    : 'AI Fashion Models — Browse & Book | Catwalk.ai';
  const pageDescription = pageCategory
    ? `Browse ${pageCategory.toLowerCase()} AI fashion models on Catwalk.ai. Book elite talent for your next shoot.`
    : 'Discover and book AI fashion models for your photo shoots. Browse elite talent, compare rates, and start shooting on Catwalk.ai.';
  return (
    <div className="models-marketing-page marketplace-page">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        {urlCategory && <link rel="canonical" href={`${window.location.origin}/models`} />}
      </Helmet>
      <LandingHeader />

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
          <p className="marketplace-become-wrap">
            <Link to="/models/register" className="marketplace-become-model-link">
              Become a model
              <span className="material-symbols-outlined thin-icon" aria-hidden="true">
                arrow_forward
              </span>
            </Link>
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
            {MODEL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-item ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setManualCategory(cat)}
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
                      <input type="checkbox" checked={filterModelType.ai}
                        onChange={e => setFilterModelType(prev => ({ ...prev, ai: e.target.checked }))} /> AI MODELS
                    </label>
                    <label className="filter-option">
                      <input type="checkbox" checked={filterModelType.real}
                        onChange={e => setFilterModelType(prev => ({ ...prev, real: e.target.checked }))} /> REAL MODELS
                    </label>
                    <label className="filter-option">
                      <input type="checkbox" checked={filterModelType.both}
                        onChange={e => setFilterModelType(prev => ({ ...prev, both: e.target.checked }))} /> BOTH
                    </label>
                  </div>
                </div>

                <div className="accordion-filter">
                  <div className="accordion-header">
                    <span className="accordion-title active">Style Selection</span>
                    <span className="material-symbols-outlined thin-icon">expand_less</span>
                  </div>
                  <div className="filter-options">
                    {commonTags.map(tag => (
                      <label key={tag} className="filter-option">
                        <input 
                          type="checkbox" 
                          checked={selectedTags.includes(tag)}
                          onChange={() => toggleTag(tag)}
                        /> {tag.toUpperCase()}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <button className="clear-filters-btn" onClick={clearAllFilters}>Clear All</button>
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
                    <article
                      key={model.model_id}
                      className="marketplace-model-card"
                      onClick={() => navigate(`/models/${model.username}`)}
                    >
                      <div className="model-card-image-wrap">
                        {model.elite && (
                          <div className="elite-badge">
                            <span className="material-symbols-outlined thin-icon">star</span>
                            ELITE
                          </div>
                        )}
                        <img
                          src={model.profile_image_url}
                          alt={model.displayName}
                          loading={filteredModels.indexOf(model) < 6 ? "eager" : "lazy"}
                          fetchpriority={filteredModels.indexOf(model) === 0 ? "high" : "auto"}
                        />
                        <div className="card-overlay">
                          <div className="overlay-actions">
                            <button
                              type="button"
                              className="btn-shoot"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartShoot(model.model_id);
                              }}
                            >
                              Start Shoot
                            </button>
                            {model.model_type === 'real' || model.model_type === 'both' ? (
                              <button
                                type="button"
                                className="btn-book"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBookModel(model);
                                }}
                              >
                                Book Model
                              </button>
                            ) : null}
                            <Link
                              to={`/models/${model.username}`}
                              className="btn-profile"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Profile
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="model-card-info">
                        <div className="info-header">
                          <h3 className="model-name">{model.displayName}</h3>
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
      </div>

      <LandingFooter />

      {/* Booking Modal */}
      {showBookingModal && selectedModel && (
        <div className="booking-modal-overlay" onClick={handleCloseModal}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Book {selectedModel.displayName}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <span className="material-symbols-outlined thin-icon">close</span>
              </button>
            </div>
            {bookingSuccess ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6bff8c' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>check_circle</span>
                <p style={{ marginTop: '12px', fontSize: '0.9rem' }}>Booking request submitted!</p>
              </div>
            ) : (
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
                  <button type="submit" className="btn-submit" disabled={bookingSubmitting}>
                    {bookingSubmitting ? 'Submitting...' : 'Submit Booking Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ModelsPage;
