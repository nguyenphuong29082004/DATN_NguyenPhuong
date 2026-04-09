import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useGenerationHistory, useGenerateAIModel, useDeleteGeneration } from '../../../hooks/generations/useGenerations';
import { GENERATION_COSTS } from '../../../services/generation';
import Button from '../../../components/common/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import './ModelsGenerator.css';

/**
 * ModelsGenerator — AI Model Generator Page (Queue-Based UX)
 *
 * Key UX behaviors:
 * 1. Generation is queued (non-blocking) — user can create many at once
 * 2. Results panel shows all generations with live status updates
 * 3. Supports viewing multiple results, detail lightbox, and compare mode
 * 4. Credits are deducted immediately, form stays available
 */

const ModelsGenerator = () => {
    const { user, profile, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const creditBalance = profile?.credits_balance ?? 0;
    const generationCost = GENERATION_COSTS.ai_model;

    // UI state
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null); // lightbox
    const [compareMode, setCompareMode] = useState(false);
    const [compareSelection, setCompareSelection] = useState([]);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [modelToDelete, setModelToDelete] = useState(null);
    const [pollingEnabled, setPollingEnabled] = useState(false);

    // Model parameters
    const [params, setParams] = useState({
        gender: 'female',
        ageRange: '25-35',
        ethnicity: 'caucasian',
        height: 'tall',
        bodyType: 'slim',
        faceShape: 'oval',
        hairColor: 'brown',
        hairLength: 'long',
        hairStyle: 'straight',
        eyeColor: 'brown',
        skinTone: 'fair',
        style: 'editorial',
        name: ''
    });

    const options = {
        gender: ['female', 'male', 'non-binary'],
        ageRange: ['18-24', '25-35', '36-45', '46+'],
        ethnicity: ['caucasian', 'african', 'asian', 'hispanic', 'middle-eastern', 'south-asian', 'mixed'],
        height: ['petite', 'average', 'tall'],
        bodyType: ['slim', 'athletic', 'curvy', 'plus-size'],
        faceShape: ['oval', 'round', 'square', 'heart', 'diamond', 'triangle', 'oblong'],
        hairColor: ['black', 'brown', 'blonde', 'red', 'gray', 'white', 'colorful'],
        hairLength: ['short', 'medium', 'long', 'bald'],
        hairStyle: ['straight', 'wavy', 'curly', 'braided', 'ponytail', 'updo'],
        eyeColor: ['brown', 'blue', 'green', 'hazel', 'gray', 'amber'],
        skinTone: ['fair', 'light', 'medium', 'olive', 'tan', 'dark'],
        style: ['editorial', 'commercial', 'streetwear', 'high-fashion', 'alternative', 'minimalist', 'avant-garde']
    };

    // ========================================================
    // Data Fetching (React Query)
    // ========================================================

    const {
        generations: myModels,
        isLoading: isLoadingModels,
    } = useGenerationHistory(user?.id, {
        type: 'ai_model',
        refetchInterval: pollingEnabled ? 3000 : false,
    });

    const { generateAsync, isGenerating: isSubmitting } = useGenerateAIModel();
    const { deleteGenerationAsync, isDeleting } = useDeleteGeneration();

    // Enable/disable polling based on processing models
    useEffect(() => {
        const hasProcessing = myModels?.some(g => g.status === 'processing');
        setPollingEnabled(hasProcessing);
    }, [myModels]);

    // ========================================================
    // Helpers
    // ========================================================

    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(null), 4000);
    };

    const handleParamChange = (key, value) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };

    const processingCount = myModels.filter(m => m.status === 'processing').length;
    const completedCount = myModels.filter(m => m.status === 'completed').length;

    // ========================================================
    // Generation Logic (Non-blocking queue)
    // ========================================================

    const handleGenerate = async () => {
        if (!user?.id) {
            setError('Please sign in to generate models');
            return;
        }

        if (creditBalance < generationCost) {
            setError(`Insufficient credits. Need ${generationCost}, have ${creditBalance}`);
            return;
        }

        setError(null);

        try {
            await generateAsync({ userId: user.id, params });

            showSuccess('✨ Generation queued! You can create another while this one processes.');
            setPollingEnabled(true);
            refreshProfile?.();
        } catch (err) {
            console.error('Generation error:', err);
            setError('Generation failed: ' + err.message);
        }
    };

    // ========================================================
    // Model CRUD
    // ========================================================
    const handleDeleteClick = (genId) => {
        setModelToDelete(genId);
    };

    const confirmDeleteModel = async () => {
        if (!user?.id || !modelToDelete) return;
        const genId = modelToDelete;

        try {
            await deleteGenerationAsync({ generationId: genId, userId: user.id });

            showSuccess('Model deleted');
            setCompareSelection(prev => prev.filter(id => id !== genId));

            if (selectedModel?.id === genId) {
                setSelectedModel(null);
            }
        } catch (err) {
            setError('Failed to delete model: ' + err.message);
        } finally {
            setModelToDelete(null);
        }
    };

    // ========================================================
    // Compare Mode
    // ========================================================
    const toggleCompareMode = () => {
        setCompareMode(prev => !prev);
        if (compareMode) {
            setCompareSelection([]);
        }
    };

    const toggleCompareItem = (genId) => {
        setCompareSelection(prev => {
            if (prev.includes(genId)) {
                return prev.filter(id => id !== genId);
            }
            if (prev.length >= 4) return prev; // max 4 for compare
            return [...prev, genId];
        });
    };

    const handleViewCompare = () => {
        setShowCompareModal(true);
    };

    const compareModels = myModels.filter(m => compareSelection.includes(m.id));

    // ========================================================
    // Time Helpers
    // ========================================================
    const getTimeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    // ========================================================
    // Render
    // ========================================================

    return (
        <div className="models-generator-page">
            {/* Toast Messages */}
            <div className="toast-container">
                {error && (
                    <div className="toast toast-error" onClick={() => setError(null)}>
                        <span className="material-symbols-outlined">error</span>
                        <span className="toast-text">{error}</span>
                        <span className="material-symbols-outlined toast-close">close</span>
                    </div>
                )}
                {successMessage && (
                    <div className="toast toast-success" onClick={() => setSuccessMessage(null)}>
                        <span className="material-symbols-outlined">check_circle</span>
                        <span className="toast-text">{successMessage}</span>
                        <span className="material-symbols-outlined toast-close">close</span>
                    </div>
                )}
            </div>

            <div className="models-generator-main">
                <div className="models-generator-content">
                    {/* Left: Parameters Panel */}
                    <div className="parameters-panel">
                        <div className="panel-header">
                            <h3>
                                <span className="material-symbols-outlined">tune</span>
                                Configure Model
                            </h3>
                            {processingCount > 0 && (
                                <div className="queue-badge">
                                    <div className="queue-badge-dot"></div>
                                    {processingCount} in queue
                                </div>
                            )}
                        </div>

                        <div className="params-scroll">
                            <div className="param-group">
                                <label>Model Name</label>
                                <input
                                    type="text"
                                    className="param-input"
                                    value={params.name}
                                    onChange={(e) => handleParamChange('name', e.target.value)}
                                    placeholder="e.g. Summer Campaign Model"
                                />
                            </div>

                            <div className="params-section">
                                <h4><span className="material-symbols-outlined">person</span> Identity</h4>

                                <div className="param-group">
                                    <label>Gender</label>
                                    <div className="param-radios">
                                        {options.gender.map(opt => (
                                            <div
                                                key={opt}
                                                className={`param-radio ${params.gender === opt ? 'active' : ''}`}
                                                onClick={() => handleParamChange('gender', opt)}
                                            >
                                                <span className="param-radio__dot"></span>
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="param-group">
                                    <label>Age Range</label>
                                    <div className="param-chips">
                                        {options.ageRange.map(opt => (
                                            <div
                                                key={opt}
                                                className={`param-chip ${params.ageRange === opt ? 'active' : ''}`}
                                                onClick={() => handleParamChange('ageRange', opt)}
                                            >
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="param-row">
                                    <div className="param-group">
                                        <label>Ethnicity</label>
                                        <select value={params.ethnicity} onChange={(e) => handleParamChange('ethnicity', e.target.value)}>
                                            {options.ethnicity.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
                                        </select>
                                    </div>
                                    <div className="param-group">
                                        <label>Style</label>
                                        <select value={params.style} onChange={(e) => handleParamChange('style', e.target.value)}>
                                            {options.style.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="params-section">
                                <h4><span className="material-symbols-outlined">accessibility_new</span> Physical</h4>
                                <div className="param-row">
                                    <div className="param-group">
                                        <label>Height</label>
                                        <select value={params.height} onChange={(e) => handleParamChange('height', e.target.value)}>
                                            {options.height.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div className="param-group">
                                        <label>Body Type</label>
                                        <select value={params.bodyType} onChange={(e) => handleParamChange('bodyType', e.target.value)}>
                                            {options.bodyType.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="param-group">
                                    <label>Skin Tone</label>
                                    <select value={params.skinTone} onChange={(e) => handleParamChange('skinTone', e.target.value)}>
                                        {options.skinTone.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="params-section">
                                <h4><span className="material-symbols-outlined">face</span> Features</h4>
                                <div className="param-row">
                                    <div className="param-group">
                                        <label>Face</label>
                                        <select value={params.faceShape} onChange={(e) => handleParamChange('faceShape', e.target.value)}>
                                            {options.faceShape.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
                                        </select>
                                    </div>
                                    <div className="param-group">
                                        <label>Eye Color</label>
                                        <select value={params.eyeColor} onChange={(e) => handleParamChange('eyeColor', e.target.value)}>
                                            {options.eyeColor.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="param-row">
                                    <div className="param-group">
                                        <label>Hair Color</label>
                                        <select value={params.hairColor} onChange={(e) => handleParamChange('hairColor', e.target.value)}>
                                            {options.hairColor.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div className="param-group">
                                        <label>Length</label>
                                        <select value={params.hairLength} onChange={(e) => handleParamChange('hairLength', e.target.value)}>
                                            {options.hairLength.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="param-group">
                                    <label>Hair Style</label>
                                    <select value={params.hairStyle} onChange={(e) => handleParamChange('hairStyle', e.target.value)}>
                                        {options.hairStyle.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Generate Button */}
                        <div className="generate-footer">
                            <div className="credit-info">
                                <span className="material-symbols-outlined">generating_tokens</span>
                                <span>{generationCost} credits</span>
                                <span className="credit-divider">·</span>
                                <span className="credit-balance">{creditBalance} available</span>
                                {creditBalance < generationCost && <span className="credit-insufficient">Insufficient</span>}
                            </div>

                            <button
                                className="btn-generate"
                                onClick={handleGenerate}
                                disabled={isSubmitting || creditBalance < generationCost}
                            >
                                {isSubmitting ? (
                                    <><div className="spinner"></div> Queuing...</>
                                ) : (
                                    <><span className="material-symbols-outlined">auto_awesome</span> Generate</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right: Results Panel */}
                    <div className="results-panel">
                        {/* Results Header */}
                        <div className="results-header">
                            <div className="results-header-left">
                                <h3>
                                    <span className="material-symbols-outlined">photo_library</span>
                                    Results
                                </h3>
                                {myModels.length > 0 && (
                                    <div className="results-stats">
                                        <span className="stat">{completedCount} completed</span>
                                        {processingCount > 0 && (
                                            <span className="stat stat-processing">
                                                <span className="processing-dot"></span>
                                                {processingCount} processing
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="results-header-actions">
                                {compareMode && compareSelection.length >= 2 && (
                                    <button
                                        className="btn-mode active btn-compare-action"
                                        onClick={handleViewCompare}
                                    >
                                        <span className="material-symbols-outlined">view_carousel</span>
                                        View Comparison ({compareSelection.length})
                                    </button>
                                )}
                                {completedCount >= 2 && (
                                    <button
                                        className={`btn-mode ${compareMode ? 'active' : ''}`}
                                        onClick={toggleCompareMode}
                                    >
                                        <span className="material-symbols-outlined">{compareMode ? 'close' : 'compare'}</span>
                                        {compareMode ? 'Cancel' : 'Compare'}
                                    </button>
                                )}
                                <div className="view-toggle">
                                    <button
                                        className={`btn-view ${viewMode === 'grid' ? 'active' : ''}`}
                                        onClick={() => setViewMode('grid')}
                                        title="Grid view"
                                    >
                                        <span className="material-symbols-outlined">grid_view</span>
                                    </button>
                                    <button
                                        className={`btn-view ${viewMode === 'list' ? 'active' : ''}`}
                                        onClick={() => setViewMode('list')}
                                        title="List view"
                                    >
                                        <span className="material-symbols-outlined">view_list</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Compare View was moved to Overlay Modal */}

                        {/* Results Grid / List */}
                        <div className={`results-content ${viewMode}`}>
                            {isLoadingModels ? (
                                <div className="results-loading">
                                    <div className="loading-spinner"></div>
                                    <p>Loading your library...</p>
                                </div>
                            ) : myModels.length === 0 ? (
                                <div className="results-empty">
                                    <span className="material-symbols-outlined empty-icon">auto_awesome</span>
                                    <h4>No models yet</h4>
                                    <p>Configure your parameters and hit Generate to create your first AI model.</p>
                                    <p className="empty-hint">Each generation costs {generationCost} credits and is queued — you can create multiple at once.</p>
                                </div>
                            ) : (
                                <div className={`results-${viewMode}`}>
                                    {myModels.map(gen => (
                                        <div
                                            key={gen.id}
                                            className={`result-card ${gen.status} ${compareMode && compareSelection.includes(gen.id) ? 'compare-selected' : ''}`}
                                            onClick={() => {
                                                if (compareMode && gen.status === 'completed') {
                                                    toggleCompareItem(gen.id);
                                                } else if (gen.status === 'completed') {
                                                    setSelectedModel(gen);
                                                }
                                            }}
                                        >
                                            {/* Status Badge */}
                                            {(gen.status === 'failed' || gen.status === 'timeout') && (
                                                <div className={`result-status-badge status-${gen.status}`}>
                                                    <span className="material-symbols-outlined">error</span> {gen.status === 'timeout' ? 'Timeout' : 'Failed'}
                                                </div>
                                            )}

                                            {/* Compare checkbox */}
                                            {compareMode && gen.status === 'completed' && (
                                                <div className={`compare-checkbox ${compareSelection.includes(gen.id) ? 'checked' : ''}`}>
                                                    <span className="material-symbols-outlined">
                                                        {compareSelection.includes(gen.id) ? 'check_box' : 'check_box_outline_blank'}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Image / Processing State */}
                                            <div className="result-card-image">
                                                {gen.status === 'completed' && gen.imageUrl ? (
                                                    <img src={gen.imageUrl} alt={gen.settings?.name || gen.prompt || 'AI Model'} loading="lazy" />
                                                ) : gen.status === 'processing' ? (
                                                    <div className="result-processing">
                                                        <div className="processing-ripple">
                                                            <div></div><div></div><div></div>
                                                        </div>
                                                        <span>Processing...</span>
                                                    </div>
                                                ) : (
                                                    <div className="result-error">
                                                        <span className="material-symbols-outlined">warning</span>
                                                        <span>{gen.status === 'timeout' ? 'Timed out' : 'Failed'}</span>
                                                        {gen.errorMessage && <span className="error-detail">{gen.errorMessage}</span>}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card Footer */}
                                            <div className="result-card-footer">
                                                <div className="result-card-info">
                                                    <span className="result-name">{gen.settings?.name || gen.prompt || 'Untitled'}</span>
                                                    <div className="result-meta-row">
                                                        <span className="result-time">{getTimeAgo(gen.createdAt)}</span>
                                                        {viewMode === 'list' && gen.settings && (
                                                            <>
                                                                <span className="result-meta-dot">·</span>
                                                                <div className="result-tags">
                                                                    <span className="result-tag">{gen.settings.gender}</span>
                                                                    <span className="result-tag">{gen.settings.style}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="result-card-actions">
                                                    {gen.status === 'completed' && (
                                                        <>
                                                            <button
                                                                className="btn-card-action"
                                                                onClick={(e) => { e.stopPropagation(); navigate(`/studio/quick-shoot?ai_character_id=${gen.aiModelId}`); }}
                                                                title="Use in Quick Shoot"
                                                            >
                                                                <span className="material-symbols-outlined">photo_camera</span>
                                                            </button>
                                                            <button
                                                                className="btn-card-action"
                                                                onClick={(e) => { e.stopPropagation(); setSelectedModel(gen); }}
                                                                title="View full size"
                                                            >
                                                                <span className="material-symbols-outlined">open_in_full</span>
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        className="btn-card-action btn-card-delete"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(gen.id); }}
                                                        title="Delete"
                                                        disabled={gen.status === 'processing'}
                                                    >
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox / Detail View */}
            {selectedModel && (
                <div className="lightbox-overlay" onClick={() => setSelectedModel(null)}>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={() => setSelectedModel(null)}>
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <div className="lightbox-image">
                            {selectedModel.imageUrl ? (
                                <img src={selectedModel.imageUrl} alt={selectedModel.settings?.name || selectedModel.prompt || 'Model'} />
                            ) : (
                                <div className="lightbox-placeholder">
                                    <span className="material-symbols-outlined">image</span>
                                </div>
                            )}
                        </div>

                        <div className="lightbox-sidebar">
                            <h3>{selectedModel.settings?.name || selectedModel.prompt || 'Untitled Model'}</h3>
                            <div className="lightbox-meta">
                                <div className="meta-row">
                                    <span className="meta-label">Status</span>
                                    <span className={`meta-value status-${selectedModel.status}`}>{selectedModel.status}</span>
                                </div>
                                <div className="meta-row">
                                    <span className="meta-label">Created</span>
                                    <span className="meta-value">{new Date(selectedModel.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="meta-row">
                                    <span className="meta-label">Credits Used</span>
                                    <span className="meta-value">{selectedModel.creditsUsed || generationCost}</span>
                                </div>
                            </div>

                            {selectedModel.settings && (
                                <div className="lightbox-params">
                                    <h4>Parameters</h4>
                                    <div className="params-tags">
                                        {Object.entries(selectedModel.settings)
                                            .filter(([key]) => key !== 'name')
                                            .map(([key, value]) => (
                                                <span key={key} className="param-tag">
                                                    <span className="param-tag-key">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                    <span className="param-tag-value">{value}</span>
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            )}

                            <div className="lightbox-actions">
                                {selectedModel.imageUrl && (
                                    <a
                                        href={selectedModel.imageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-lightbox-action"
                                    >
                                        <span className="material-symbols-outlined">download</span>
                                        Download
                                    </a>
                                )}
                                <button
                                    className="btn-lightbox-action"
                                    onClick={() => navigate(`/studio/quick-shoot?ai_character_id=${selectedModel.aiModelId}`)}
                                >
                                    <span className="material-symbols-outlined">photo_camera</span>
                                    Use in Quick Shoot
                                </button>
                                <button
                                    className="btn-lightbox-action btn-lightbox-delete"
                                    onClick={() => handleDeleteClick(selectedModel.id)}
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Compare Fullscreen Lightbox */}
            {showCompareModal && compareModels.length >= 2 && (
                <div className="lightbox-overlay" onClick={() => setShowCompareModal(false)}>
                    <div className="lightbox-content compare-lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <div className="compare-lightbox-header">
                            <h3>Comparing {compareModels.length} Models</h3>
                            <button className="lightbox-close compare-lightbox-close" onClick={() => setShowCompareModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="compare-grid" style={{ gridTemplateColumns: `repeat(${Math.min(compareModels.length, 4)}, 1fr)` }}>
                            {compareModels.map(gen => (
                                <div key={gen.id} className="compare-item">
                                    <div className="compare-image-wrap">
                                        {gen.imageUrl ? (
                                            <img src={gen.imageUrl} alt={gen.settings?.name || gen.prompt || 'Model'} />
                                        ) : (
                                            <div className="compare-placeholder">
                                                <span className="material-symbols-outlined">image</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="compare-label">{gen.settings?.name || gen.prompt || 'Untitled'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                open={!!modelToDelete}
                onClose={() => !isDeleting && setModelToDelete(null)}
                title="Delete Generation"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setModelToDelete(null)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="primary" className="btn--danger" onClick={confirmDeleteModel} loading={isDeleting}>Delete</Button>
                    </>
                }
            >
                <p>Are you sure you want to delete this specific generation? This action cannot be undone.</p>
            </Modal>
        </div>
    );
};

export default ModelsGenerator;
