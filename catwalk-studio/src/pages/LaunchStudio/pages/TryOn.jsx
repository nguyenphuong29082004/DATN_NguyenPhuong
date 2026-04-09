import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useShootableModels, useUserAICharacters } from '../../../hooks/models/useShootModels';
import { useInvokeTryOn } from '../../../hooks/generations/useTryOn';
import { useGenerationStatus, useAddToGallery } from '../../../hooks/generations/useQuickShoot';
import { useUserPrompts, usePublicPrompts, useCreatePrompt } from '../../../hooks/prompts/usePrompts';
import { useShootWardrobe } from '../../../hooks/wardrobe/useShootWardrobe';
import { container } from '../../../di/container';
import { Button } from '../../../components/common/Button/Button';
import { Modal } from '../../../components/common/Modal/Modal';
import { ProgressBar } from '../../../components/common/ProgressBar';
import { buildTryOnPayload, getTryOnProgressMessage, TRY_ON_BASE_COSTS } from '../../../infrastructure/try-on/tryOnRequest';
import { TRY_ON_PROMPT_CATEGORIES, filterPromptsByCategories } from './promptCategoryFilters';
import './TryOn.css';

const PROMPT_MAX_LENGTH = 2000;

const FORMAT_OPTIONS = [
    { value: 'png', label: 'PNG' },
    { value: 'jpg', label: 'JPG' },
    { value: 'webp', label: 'WebP' },
];

const QUALITY_OPTIONS = [
    { value: 'standard', label: 'Standard', credits: 5 },
    { value: 'hd', label: 'HD', credits: 10 },
];

const SIZE_PRESETS = [
    { label: '1:1', width: 1024, height: 1024 },
    { label: '4:5', width: 896, height: 1120 },
    { label: '9:16', width: 768, height: 1344 },
    { label: '16:9', width: 1344, height: 768 },
];

const TRY_ON_PROGRESS_STEPS = {
    preparing_model: { cap: 45, fallback: 18 },
    applying_clothing: { cap: 88, fallback: 52 },
    finalizing: { cap: 96, fallback: 90 },
};

const TryOn = () => {
    const { user, profile, isGuest, refreshProfile } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Data from hooks
    const { models, isLoading: isLoadingModels } = useShootableModels(user?.id);
    const { characters: userAiCharacters } = useUserAICharacters(user?.id);
    const { items: wardrobeItems, isLoading: isLoadingWardrobe, hasMore: wardrobeHasMore, loadMore: loadMoreWardrobe, fetchItems: fetchWardrobeItems } = useShootWardrobe(user?.id);
    const { invokeAsync } = useInvokeTryOn();
    const { addToGalleryAsync } = useAddToGallery();

    const [generationType] = useState('photo'); // 'photo' | 'video'

    // Model dropdown
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [modelSearch, setModelSearch] = useState('');
    const modelDropdownRef = useRef(null);

    // Selected items
    const [selectedModel, setSelectedModel] = useState(null);
    const [selectedWardrobeItem, setSelectedWardrobeItem] = useState(null);
    const [showWardrobePicker, setShowWardrobePicker] = useState(false);
    const wardrobeListRef = useRef(null);
    const [wardrobeSearch, setWardrobeSearch] = useState('');

    // Prompt
    const [showPromptPicker, setShowPromptPicker] = useState(false);
    const [promptSearch, setPromptSearch] = useState('');
    const [showSavePromptModal, setShowSavePromptModal] = useState(false);
    const [promptName, setPromptName] = useState('');
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [galleryTitle, setGalleryTitle] = useState('');
    const [galleryDescription, setGalleryDescription] = useState('');
    const [promptData, setPromptData] = useState({
        prompt: '',
        negativePrompt: '',
        width: SIZE_PRESETS[1].width, // Default to 4:5
        height: SIZE_PRESETS[1].height, // Default to 4:5
        format: 'png',
        quality: 'standard',
        seed: ''
    });

    const { prompts: userPromptsList } = useUserPrompts(user?.id);
    const { prompts: publicPromptsList } = usePublicPrompts();
    const { createPrompt, isCreating: isSavingPrompt } = useCreatePrompt();

    const savedPrompts = useMemo(() => {
        const map = new Map();
        [...(userPromptsList || []), ...(publicPromptsList || [])].forEach(p => map.set(p.id, p));
        return filterPromptsByCategories(Array.from(map.values()), TRY_ON_PROMPT_CATEGORIES);
    }, [userPromptsList, publicPromptsList]);

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [generationId, setGenerationId] = useState(null);
    const [activeGenerationId, setActiveGenerationId] = useState(null);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [progressValue, setProgressValue] = useState(0);
    const [progressStage, setProgressStage] = useState('preparing_model');

    // Custom garment upload state
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const { generation: polledGeneration } = useGenerationStatus(activeGenerationId);

    const creditBalance = profile?.credits_balance ?? 0;
    const qualityOption = QUALITY_OPTIONS.find(opt => opt.value === promptData.quality);
    const creditsNeeded = TRY_ON_BASE_COSTS[promptData.quality] || qualityOption?.credits || TRY_ON_BASE_COSTS.standard;
    const isMarketplaceModel = selectedModel && !selectedModel.isUserAiCharacter;
    const effectiveProgressStage = isMarketplaceModel ? progressStage : (progressValue >= 90 ? 'finalizing' : 'applying_clothing');
    const progressMessage = getTryOnProgressMessage({ stage: effectiveProgressStage === 'finalizing' ? 'applying_clothing' : effectiveProgressStage });
    const progressHeadline = effectiveProgressStage === 'finalizing' ? 'Finalizing result...' : progressMessage;

    // Close model dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
                setShowModelDropdown(false);
                setModelSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle URL params after data loads
    useEffect(() => {
        const applyUrlParams = async () => {
            const modelId = searchParams.get('model_id');
            const aiCharacterId = searchParams.get('ai_character_id');

            if (aiCharacterId && userAiCharacters.length > 0) {
                const character = userAiCharacters.find(c => c.id === aiCharacterId);
                if (character) setSelectedModel(character);
            } else if (modelId && models.length > 0) {
                const model = models.find(m => m.id === modelId);
                if (model) setSelectedModel(model);
            }
        };
        applyUrlParams();
    }, [searchParams, models, userAiCharacters]);

    // Handle wardrobe_item_id from URL
    useEffect(() => {
        const wardrobeItemId = searchParams.get('wardrobe_item_id');
        if (!wardrobeItemId) return;

        const repo = container.getWardrobeRepository();
        repo.findById(wardrobeItemId).then(item => {
            if (item) {
                setSelectedWardrobeItem({
                    id: item.id,
                    title: item.title,
                    category: item.category,
                    brand: item.brand,
                    thumbnailUrl: item.thumbnailUrl,
                    colour: item.colour,
                });
            }
        }).catch(console.error);
    }, [searchParams]);

    useEffect(() => {
        if (!isGenerating) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            setProgressValue(current => {
                const stageConfig = TRY_ON_PROGRESS_STEPS[effectiveProgressStage] || TRY_ON_PROGRESS_STEPS.applying_clothing;
                if (current >= stageConfig.cap) return current;
                if (current < 20) return current + 4;
                if (current < 60) return current + 3;
                if (current < 85) return current + 2;
                return current + 1;
            });
        }, 850);

        return () => window.clearInterval(intervalId);
    }, [effectiveProgressStage, isGenerating]);

    useEffect(() => {
        if (!isGenerating) return;

        if (isMarketplaceModel) {
            if (polledGeneration?.status === 'processing') {
                setProgressStage('applying_clothing');
                setProgressValue(current => Math.max(current, TRY_ON_PROGRESS_STEPS.applying_clothing.fallback));
            }
            return;
        }

        setProgressStage(progressValue >= 90 ? 'finalizing' : 'applying_clothing');
        setProgressValue(current => Math.max(current, TRY_ON_PROGRESS_STEPS.applying_clothing.fallback));
    }, [isGenerating, isMarketplaceModel, polledGeneration?.status, progressValue]);

    // Watch polling result
    useEffect(() => {
        if (!polledGeneration) return;
        const handleResult = async () => {
            if (polledGeneration.status === 'completed' && polledGeneration.imageUrl) {
                setProgressStage('finalizing');
                setProgressValue(100);
                setGeneratedImage(polledGeneration.imageUrl);
                setGenerationId(polledGeneration.id);
                setIsGenerating(false);
                refreshProfile?.();
                setActiveGenerationId(null);
            } else if (['failed', 'timeout', 'canceled'].includes(polledGeneration.status)) {
                setIsGenerating(false);
                setError(polledGeneration.errorMessage || 'Try-on generation failed');
                refreshProfile?.();
                setActiveGenerationId(null);
            }
        };
        handleResult();
    }, [polledGeneration, refreshProfile]);

    const handleGenerate = async () => {
        if (!user?.id) {
            setError('Please sign in to use try-on');
            return;
        }
        if (!selectedModel) {
            setError('Please select a model');
            return;
        }
        if (!selectedWardrobeItem) {
            setError('Please select a clothing item');
            return;
        }
        if (creditBalance < creditsNeeded) {
            setError(`Insufficient credits. Need ${creditsNeeded}, have ${creditBalance}`);
            return;
        }

        setIsGenerating(true);
        setProgressStage(selectedModel?.isUserAiCharacter ? 'applying_clothing' : 'preparing_model');
        setProgressValue(selectedModel?.isUserAiCharacter ? TRY_ON_PROGRESS_STEPS.applying_clothing.fallback : TRY_ON_PROGRESS_STEPS.preparing_model.fallback);
        setError(null);
        setSuccessMessage(null);

        try {
            if (generationType === 'video') {
                setError("Video try-on generation is not fully implemented yet in the API.");
                setIsGenerating(false);
                return;
            }

            const data = await invokeAsync(buildTryOnPayload({
                selectedModel,
                selectedWardrobeItem,
                promptData,
            }));

            setActiveGenerationId(data.generation.id);
        } catch (err) {
            setError(err.message);
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        if (!generatedImage) return;
        try {
            const response = await fetch(generatedImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `catwalk-tryon-${Date.now()}.webp`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            setSuccessMessage('Image downloaded!');
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            setError('Download failed: ' + err.message);
        }
    };

    const handleReset = () => {
        setGeneratedImage(null);
        setGenerationId(null);
        setSuccessMessage(null);
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/studio/try-on${generationId ? `?gen_id=${generationId}` : ''}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setSuccessMessage('Link copied to clipboard!');
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setSuccessMessage('Link copied!');
            setTimeout(() => setSuccessMessage(null), 2000);
        }
    };

    const handleAddToGallery = () => {
        if (!generationId) return;
        setGalleryTitle(`Try-on: ${selectedModel?.name || 'Model'} wearing ${selectedWardrobeItem?.title || 'outfit'}`);
        setGalleryDescription(promptData.prompt || '');
        setShowGalleryModal(true);
    };

    const confirmAddToGallery = async () => {
        if (!generationId) return;
        const title = galleryTitle.trim();
        if (!title) {
            setError('Please enter a title for your gallery item.');
            return;
        }

        setShowGalleryModal(false);
        try {
            const result = await addToGalleryAsync({
                generationId,
                title,
                description: galleryDescription.trim() || null,
                tags: ['try-on'],
                typeLabel: 'try-on',
                username: user?.email || null,
            });
            if (result.outputUrl) {
                setGeneratedImage(result.outputUrl);
            }
            if (result.alreadyExists) {
                setSuccessMessage('Image already in gallery!');
            } else {
                setSuccessMessage('Image added to gallery!');
            }
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            setError(`Failed to add to gallery: ${err.message}`);
        }
    };

    const handleToggleWardrobePicker = () => {
        const next = !showWardrobePicker;
        setShowWardrobePicker(next);
        if (next && wardrobeItems.length === 0) {
            fetchWardrobeItems(0, true);
        }
    };

    const handleWardrobeScroll = useCallback(() => {
        const el = wardrobeListRef.current;
        if (!el || isLoadingWardrobe || !wardrobeHasMore) return;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
            loadMoreWardrobe();
        }
    }, [isLoadingWardrobe, wardrobeHasMore, loadMoreWardrobe]);

    const handleSelectWardrobeItem = (wItem) => {
        setSelectedWardrobeItem({
            id: wItem.item_id,
            title: wItem.title,
            category: wItem.category,
            brand: wItem.brand,
            thumbnailUrl: wItem.thumbnail_url,
            colour: wItem.colour,
        });
        setShowWardrobePicker(false);
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !user?.id) return;

        setIsUploading(true);
        setError(null);

        try {
            const storageService = container.getStorageService();
            const ext = file.name.split('.').pop();
            const path = `tryon-uploads/${user.id}/${Date.now()}.${ext}`;
            const { url } = await storageService.upload(file, path);

            setSelectedWardrobeItem({
                id: 'custom_upload', // Sent to API to indicate it's not a DB wardrobe item
                title: 'Custom Upload',
                category: 'Uploaded Photo',
                thumbnailUrl: url,
            });
        } catch (err) {
            console.error('Failed to upload custom garment:', err);
            setError(`Upload failed: ${err.message}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleSavePrompt = async () => {
        if (!promptName.trim() || !promptData.prompt.trim() || !user?.id) return;
        try {
            await createPrompt({
                userId: user.id,
                name: promptName.trim(),
                category: 'try_on',
                promptText: promptData.prompt.trim(),
                negativePrompt: promptData.negativePrompt.trim() || null,
                parametersJson: {
                    width: promptData.width,
                    height: promptData.height
                }
            });
            setSuccessMessage('Prompt saved successfully!');
            setShowSavePromptModal(false);
            setPromptName('');
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            setError('Failed to save prompt: ' + err.message);
        }
    };

    const filteredModels = useMemo(() => {
        const search = modelSearch.toLowerCase();
        return models.filter(m => !search || m.name?.toLowerCase().includes(search) || m.style?.toLowerCase().includes(search));
    }, [models, modelSearch]);

    const filteredCharacters = useMemo(() => {
        const search = modelSearch.toLowerCase();
        return userAiCharacters.filter(c => !search || c.name?.toLowerCase().includes(search) || c.style?.toLowerCase().includes(search));
    }, [userAiCharacters, modelSearch]);

    const filteredWardrobe = useMemo(() => {
        const search = wardrobeSearch.toLowerCase();
        return wardrobeItems.filter(w => !search || (w.title || '').toLowerCase().includes(search) || (w.brand || '').toLowerCase().includes(search) || (w.category || '').toLowerCase().includes(search));
    }, [wardrobeItems, wardrobeSearch]);

    return (
        <div className="try-on-page">
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

            <div className="try-on-main">
                <div className="try-on-layout">
                    {/* Left Panel - Configuration */}
                    <aside className="try-on-config">
                        <div className="panel-header">
                            <h3>
                                <span className="material-symbols-outlined">
                                    checkroom
                                </span>
                                Virtual Try-On
                            </h3>
                            <div className="generation-mode-toggle">
                                <button className="active">Photo</button>
                                <button disabled title="Video try-on coming soon">Video</button>
                            </div>
                        </div>

                        <div className="config-scroll">
                            {/* Model Selector */}
                            <div className="form-group">
                                <label>Model <span className="required">*</span></label>
                                <div className="model-dropdown" ref={modelDropdownRef}>
                                    <button
                                        type="button"
                                        className={`model-dropdown__trigger ${showModelDropdown ? 'open' : ''}`}
                                        onClick={() => !isLoadingModels && setShowModelDropdown(!showModelDropdown)}
                                    >
                                        {selectedModel ? (
                                            <span className="model-dropdown__selected">
                                                {selectedModel.imageUrl ? (
                                                    <img src={selectedModel.imageUrl} alt="" className="model-dropdown__thumb" />
                                                ) : (
                                                    <span className="model-dropdown__thumb model-dropdown__thumb--placeholder material-symbols-outlined">face</span>
                                                )}
                                                <span className="model-dropdown__name">{selectedModel.name}</span>
                                                {selectedModel.isUserAiCharacter && <span className="model-dropdown__badge-ai">AI</span>}
                                                {selectedModel.badge === 'Elite' && <span className="model-dropdown__elite">★ Elite</span>}
                                            </span>
                                        ) : (
                                            <span className="model-dropdown__placeholder">
                                                {isLoadingModels ? (
                                                    <span className="loading-inline"><span className="spinner spinner-xs"></span> Loading models...</span>
                                                ) : (
                                                    'Select a model'
                                                )}
                                            </span>
                                        )}
                                        <span className="material-symbols-outlined model-dropdown__chevron">expand_more</span>
                                    </button>
                                    {showModelDropdown && (
                                        <div className="model-dropdown__list">
                                            <div className="model-dropdown__search">
                                                <span className="material-symbols-outlined">search</span>
                                                <input
                                                    type="text"
                                                    placeholder="Search models..."
                                                    value={modelSearch}
                                                    onChange={(e) => setModelSearch(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="model-dropdown__options">
                                                {/* User's AI Characters */}
                                                {filteredCharacters.length > 0 && (
                                                    <>
                                                        <div className="model-dropdown__section-label">My AI Models</div>
                                                        {filteredCharacters
                                                            .map(character => (
                                                            <div
                                                                key={`ai-${character.id}`}
                                                                className={`model-dropdown__option ${selectedModel?.id === character.id ? 'active' : ''}`}
                                                                onClick={() => {
                                                                    setSelectedModel(character);
                                                                    setShowModelDropdown(false);
                                                                    setModelSearch('');
                                                                }}
                                                            >
                                                                {character.imageUrl ? (
                                                                <img src={character.imageUrl} alt="" className="model-dropdown__thumb" />
                                                                ) : (
                                                                    <span className="model-dropdown__thumb model-dropdown__thumb--placeholder material-symbols-outlined">face</span>
                                                                )}
                                                                <div className="model-dropdown__option-info">
                                                                    <span className="model-dropdown__name">{character.name}</span>
                                                                </div>
                                                                <span className="model-dropdown__badge-ai">AI</span>
                                                            </div>
                                                        ))}
                                                    </>
                                                )}

                                                {/* Marketplace Models */}
                                                {filteredModels.length > 0 && filteredCharacters.length > 0 && (
                                                    <div className="model-dropdown__section-label">Marketplace</div>
                                                )}
                                                {filteredModels
                                                    .map(model => (
                                                    <div
                                                        key={model.id}
                                                        className={`model-dropdown__option ${selectedModel?.id === model.id ? 'active' : ''}`}
                                                        onClick={() => {
                                                            setSelectedModel(model);
                                                            setShowModelDropdown(false);
                                                            setModelSearch('');
                                                        }}
                                                    >
                                                        <img src={model.imageUrl} alt="" className="model-dropdown__thumb" />
                                                        <div className="model-dropdown__option-info">
                                                            <span className="model-dropdown__name">{model.name}</span>
                                                        </div>
                                                        {model.badge === 'Elite' && <span className="model-dropdown__elite">★</span>}
                                                    </div>
                                                ))}
                                                {filteredModels.length === 0 && filteredCharacters.length === 0 && (
                                                    <div className="model-dropdown__empty">
                                                        <span className="material-symbols-outlined">person_off</span>
                                                        <p>{modelSearch ? `No models match "${modelSearch}"` : 'No models available yet'}</p>
                                                        {!modelSearch && !isGuest && (
                                                            <button className="btn-picker" onClick={() => navigate('/models/new')} style={{ marginTop: '8px' }}>
                                                                Create your AI Model →
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Clothing Selector */}
                            <div className="form-group">
                                <div className="label-with-action">
                                    <label>Clothing <span className="required">*</span></label>
                                    <button className="btn-picker" onClick={handleToggleWardrobePicker}>
                                        <span className="material-symbols-outlined">checkroom</span>
                                        {showWardrobePicker ? 'Close' : 'Browse Wardrobe'}
                                    </button>
                                </div>

                                <div className="clothing-actions-group">
                                    {selectedWardrobeItem ? (
                                        <div className="wardrobe-selected">
                                            {selectedWardrobeItem.thumbnailUrl && (
                                                <img src={selectedWardrobeItem.thumbnailUrl} alt="" className="wardrobe-selected__thumb" />
                                            )}
                                            <div className="wardrobe-selected__info">
                                                <span className="wardrobe-selected__name">{selectedWardrobeItem.title}</span>
                                                {selectedWardrobeItem.brand && <span className="wardrobe-selected__brand">{selectedWardrobeItem.brand}</span>}
                                            </div>
                                            <button className="wardrobe-selected__remove" onClick={() => setSelectedWardrobeItem(null)}>
                                                <span className="material-symbols-outlined">close</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button className="btn-upload-garment" onClick={() => fileInputRef.current?.click()} disabled={isUploading || !user}>
                                                {isUploading ? (
                                                    <div className="spinner-small"></div>
                                                ) : (
                                                    <><span className="material-symbols-outlined">upload</span> Upload Photo</>
                                                )}
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                                accept="image/*"
                                                hidden
                                            />
                                            {!user && <div className="requires-login-text">Login to upload</div>}
                                        </>
                                    )}

                                    {showWardrobePicker && (
                                        <div className="wardrobe-picker-dropdown" ref={wardrobeListRef} onScroll={handleWardrobeScroll}>
                                            <div className="picker-search">
                                                <span className="material-symbols-outlined">search</span>
                                                <input
                                                    type="text"
                                                    placeholder="Search wardrobe..."
                                                    value={wardrobeSearch}
                                                    onChange={(e) => setWardrobeSearch(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="wardrobe-options">
                                                {filteredWardrobe
                                                    .map(wItem => (
                                                    <div
                                                        key={wItem.item_id}
                                                        className={`wardrobe-picker__item ${selectedWardrobeItem?.id === wItem.item_id ? 'active' : ''}`}
                                                        onClick={() => {
                                                            handleSelectWardrobeItem(wItem);
                                                            setWardrobeSearch('');
                                                        }}
                                                    >
                                                        {wItem.thumbnail_url && <img src={wItem.thumbnail_url} alt="" className="wardrobe-picker__thumb" loading="lazy" />}
                                                        <div className="wardrobe-picker__item-info">
                                                            <span className="wardrobe-picker__name">{wItem.title || 'Untitled'}</span>
                                                            <span className="wardrobe-picker__category">{wItem.category}{wItem.brand ? ` · ${wItem.brand}` : ''}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {isLoadingWardrobe && (
                                                    <div className="wardrobe-picker__loading">Loading items...</div>
                                                )}
                                                {!isLoadingWardrobe && wardrobeItems.length === 0 && (
                                                    <div className="wardrobe-picker__empty">
                                                        <span>No wardrobe items yet.</span>
                                                        <button className="wardrobe-picker__link" onClick={() => navigate('/studio/designer')}>
                                                            Go to Designer →
                                                        </button>
                                                    </div>
                                                )}
                                                {!isLoadingWardrobe && wardrobeItems.length > 0 && filteredWardrobe.length === 0 && (
                                                    <div className="wardrobe-picker__empty">
                                                        <span>No items match &quot;{wardrobeSearch}&quot;</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Prompt */}
                            <div className="form-group">
                                <div className="label-with-action">
                                    <label>Style Instructions <span className="optional">(optional)</span></label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {promptData.prompt.trim() && !isGuest && (
                                            <button className="btn-picker" onClick={() => setShowSavePromptModal(true)} title="Save this prompt as a template">
                                                <span className="material-symbols-outlined">save</span>
                                                Save
                                            </button>
                                        )}
                                        {savedPrompts.length > 0 && (
                                            <button className="btn-picker" onClick={() => setShowPromptPicker(!showPromptPicker)}>
                                                <span className="material-symbols-outlined">description</span>
                                                {showPromptPicker ? 'Close' : 'Saved Prompts'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {showPromptPicker && (
                                    <div className="prompt-picker-dropdown">
                                        <div className="picker-search">
                                            <span className="material-symbols-outlined">search</span>
                                            <input
                                                type="text"
                                                placeholder="Search prompts..."
                                                value={promptSearch}
                                                onChange={(e) => setPromptSearch(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        {savedPrompts
                                            .filter(p => !promptSearch || (p.name || '').toLowerCase().includes(promptSearch.toLowerCase()) || (p.promptText || '').toLowerCase().includes(promptSearch.toLowerCase()))
                                            .map(p => (
                                            <div
                                                key={p.id}
                                                className="picker-item"
                                                onClick={() => {
                                                    setPromptData(prev => ({ ...prev, prompt: p.promptText, negativePrompt: p.negativePrompt || '' }));
                                                    setShowPromptPicker(false);
                                                    setPromptSearch('');
                                                }}
                                            >
                                                <span className="picker-item-title">{p.name || 'Untitled Prompt'}</span>
                                                <span className="picker-item-text">{(p.promptText || '').substring(0, 60)}...</span>
                                            </div>
                                        ))}
                                        {savedPrompts.filter(p => !promptSearch || (p.name || '').toLowerCase().includes(promptSearch.toLowerCase()) || (p.promptText || '').toLowerCase().includes(promptSearch.toLowerCase())).length === 0 && (
                                            <div className="picker-empty">No prompts found</div>
                                        )}
                                    </div>
                                )}
                                <textarea
                                    placeholder="Describe the mood, background or lighting..."
                                    value={promptData.prompt}
                                    onChange={(e) => {
                                        if (e.target.value.length <= PROMPT_MAX_LENGTH) {
                                            setPromptData(prev => ({ ...prev, prompt: e.target.value }));
                                        }
                                    }}
                                    rows="2"
                                    maxLength={PROMPT_MAX_LENGTH}
                                />
                                <div className="char-count">
                                    <span className={promptData.prompt.length >= PROMPT_MAX_LENGTH ? 'at-limit' : ''}>
                                        {promptData.prompt.length}
                                    </span>
                                    /{PROMPT_MAX_LENGTH}
                                </div>
                            </div>

                            {/* Negative Prompt */}
                            <div className="form-group">
                                <label>Negative Prompt <span className="optional">(optional)</span></label>
                                <textarea
                                    placeholder="What to avoid in the result..."
                                    value={promptData.negativePrompt}
                                    onChange={(e) => {
                                        if (e.target.value.length <= PROMPT_MAX_LENGTH) {
                                            setPromptData(prev => ({ ...prev, negativePrompt: e.target.value }));
                                        }
                                    }}
                                    rows="1"
                                    maxLength={PROMPT_MAX_LENGTH}
                                />
                                <div className="char-count">
                                    <span className={promptData.negativePrompt.length >= PROMPT_MAX_LENGTH ? 'at-limit' : ''}>
                                        {promptData.negativePrompt.length}
                                    </span>
                                    /{PROMPT_MAX_LENGTH}
                                </div>
                            </div>

                            {/* Output Settings */}
                            <div className="form-group">
                                <label>Output Settings</label>
                                <div className="size-presets">
                                    {SIZE_PRESETS.map(preset => (
                                        <button
                                            key={preset.label}
                                            className={`size-preset-btn ${promptData.width === preset.width && promptData.height === preset.height ? 'active' : ''}`}
                                            onClick={() => setPromptData(prev => ({ ...prev, width: preset.width, height: preset.height }))}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="quality-presets">
                                    {QUALITY_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            className={`size-preset-btn ${promptData.quality === opt.value ? 'active' : ''}`}
                                            onClick={() => setPromptData(prev => ({ ...prev, quality: opt.value }))}
                                        >
                                            {opt.label} · {opt.credits} cr
                                        </button>
                                    ))}
                                </div>
                                <div className="output-row">
                                    <div className="output-row--seeds">
                                        <div className="output-field">
                                            <span className="output-field-label">W</span>
                                            <input
                                                type="number"
                                                value={promptData.width}
                                                onChange={(e) => setPromptData(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                                            />
                                        </div>
                                        <span className="output-separator">×</span>
                                        <div className="output-field">
                                            <span className="output-field-label">H</span>
                                            <input
                                                type="number"
                                                value={promptData.height}
                                                onChange={(e) => setPromptData(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                                            />
                                        </div>
                                    </div>
                                    <select
                                        className="format-select"
                                        value={promptData.format}
                                        onChange={(e) => setPromptData(prev => ({ ...prev, format: e.target.value }))}
                                    >
                                        {FORMAT_OPTIONS.map(f => (
                                            <option key={f.value} value={f.value}>{f.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Generate Footer */}
                        <div className="generate-footer">
                            <div className="credit-info">
                                <span className="material-symbols-outlined">generating_tokens</span>
                                <span>{creditsNeeded} credits</span>
                                <span className="credit-divider">·</span>
                                <span className="credit-balance">{profile?.credits_balance || 0} available</span>
                                {profile?.credits_balance < creditsNeeded && (
                                    <span className="credit-insufficient">
                                        {isGuest ? (
                                            <a href="/login" className="credit-signup-link">Sign up for more</a>
                                        ) : 'Insufficient'}
                                    </span>
                                )}
                            </div>
                            <button
                                className="btn-generate"
                                onClick={handleGenerate}
                                disabled={isGenerating || !selectedModel || !selectedWardrobeItem || profile?.credits_balance < creditsNeeded}
                            >
                                {isGenerating ? (
                                    <><div className="spinner"></div> Generating...</>
                                ) : (
                                    <><span className="material-symbols-outlined">auto_awesome</span> Try On</>
                                )}
                            </button>
                        </div>
                    </aside>

                    {/* Right Panel - Results */}
                    <main className="try-on-result">
                        <div className="results-header">
                            <div className="results-header-left">
                                <h3>
                                    <span className="material-symbols-outlined">image</span>
                                    Preview
                                </h3>
                            </div>
                        </div>
                        <div className="results-content">
                            <div className="generated-result">
                                <div className={`preview-stage ${isGenerating ? 'is-generating' : ''}`}>
                                    {generatedImage ? (
                                        <img src={generatedImage} alt="Try-on result" className="preview-stage__image" />
                                    ) : (
                                        <div className="preview-placeholder preview-stage__placeholder">
                                            <span className="material-symbols-outlined">checkroom</span>
                                            <p>Select a model and clothing to generate a try-on</p>
                                        </div>
                                    )}
                                    {isGenerating && (
                                        <div className="preview-stage__overlay">
                                            <span className="spinner"></span>
                                            <div className="preview-stage__progress-copy">
                                                <span className="preview-stage__progress-label">{progressHeadline}</span>
                                                <ProgressBar
                                                    value={progressValue}
                                                    label="Processing"
                                                    size="sm"
                                                    className="preview-stage__progress-bar"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {generatedImage && (
                                    <div className="result-actions">
                                        <Button variant="secondary" size="sm" icon="download" onClick={handleDownload}>Download</Button>
                                        <Button variant="secondary" size="sm" icon="refresh" onClick={handleReset}>New Try-On</Button>
                                        <Button variant="secondary" size="sm" icon="share" onClick={handleShare}>Share</Button>
                                        <Button variant="outline" size="sm" icon="add_photo_alternate" onClick={handleAddToGallery}>Gallery</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            <Modal
                open={showGalleryModal}
                onClose={() => setShowGalleryModal(false)}
                title="Add to Gallery"
                footer={
                    <>
                        <Button variant="secondary" size="md" onClick={() => setShowGalleryModal(false)}>Cancel</Button>
                        <Button variant="primary" size="md" icon="add_photo_alternate" onClick={confirmAddToGallery}>Add to Gallery</Button>
                    </>
                }
            >
                <div className="form-group">
                    <label>Title *</label>
                    <input
                        type="text"
                        value={galleryTitle}
                        onChange={(e) => setGalleryTitle(e.target.value)}
                        placeholder="e.g. Editorial Denim Try-On"
                        maxLength={120}
                        autoFocus
                    />
                </div>
                <div className="form-group">
                    <label>Description <span className="optional">(optional)</span></label>
                    <textarea
                        value={galleryDescription}
                        onChange={(e) => setGalleryDescription(e.target.value)}
                        placeholder="Describe your try-on look..."
                        rows={3}
                    />
                </div>
            </Modal>

            {/* Save Prompt Modal */}
            <Modal
                open={showSavePromptModal}
                onClose={() => setShowSavePromptModal(false)}
                title="Save Style Instructions"
                footer={
                    <>
                        <Button variant="secondary" size="md" onClick={() => setShowSavePromptModal(false)}>Cancel</Button>
                        <Button variant="primary" size="md" onClick={handleSavePrompt} disabled={!promptName.trim() || isSavingPrompt}>
                            {isSavingPrompt ? 'Saving...' : 'Save'}
                        </Button>
                    </>
                }
            >
                <div className="form-group">
                    <label>Template Name</label>
                    <input
                        type="text"
                        placeholder="e.g., Casual Streetwear Lighting"
                        value={promptName}
                        onChange={(e) => setPromptName(e.target.value)}
                        autoFocus
                    />
                </div>
            </Modal>
        </div>
    );
};

export default TryOn;
