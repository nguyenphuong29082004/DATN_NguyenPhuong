import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useShootableModels, useAIEngines, useUserAICharacters } from '../../../hooks/models/useShootModels';
import { useInvokeQuickShoot, useGenerationStatus, useAddToGallery, useSaveGeneration } from '../../../hooks/generations/useQuickShoot';
import { useUserPrompts, usePublicPrompts, useCreatePrompt } from '../../../hooks/prompts/usePrompts';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Button } from '../../../components/common/Button/Button';
import { RegisterPromptModal } from '../../../components/common/RegisterPromptModal';
import { SidePanel } from '../../../components/common/SidePanel/SidePanel';
import { Modal } from '../../../components/common/Modal/Modal';
import { ProgressBar } from '../../../components/common/ProgressBar';
import { QUICK_SHOOT_PROMPT_CATEGORIES, filterPromptsByCategories } from './promptCategoryFilters';
import './QuickShoot.css';

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

const QUICK_SHOOT_PROGRESS_STEPS = [
    { until: 30, label: 'Preparing preview...' },
    { until: 80, label: 'Generating image...' },
    { until: 100, label: 'Finalizing result...' },
];

const ENGINE_UI_CONFIG = {
    default: {
        description: 'Balanced image generation for fashion shoots.',
        requiresModelSelection: false,
        supportsNegativePrompt: true,
        supportsSeed: true,
        supportsQuality: true,
        supportsCustomDimensions: false,
        supportedFormats: ['png', 'jpg', 'webp'],
        lockedSettings: [],
    },
    'catwalk-ai-fast': {
        description: 'Fast generation with prompt, ratio, and optional seed.',
        requiresModelSelection: false,
        supportsNegativePrompt: false,
        supportsSeed: true,
        supportsQuality: true,
        supportsCustomDimensions: true,
        supportedFormats: [],
        lockedSettings: ['Output format is handled by the engine.'],
    },
    'catwalk-ai-pro': {
        description: 'Best all-around engine with quality and safety controls built in.',
        requiresModelSelection: true,
        supportsNegativePrompt: false,
        supportsSeed: true,
        supportsQuality: true,
        supportsCustomDimensions: true,
        supportedFormats: ['png', 'jpg', 'webp'],
        lockedSettings: ['Output quality and safety tolerance use engine defaults.'],
    },
    'catwalk-ai-pro-ultra': {
        description: 'High-end Imagen engine with fixed image size and safety profile.',
        requiresModelSelection: false,
        supportsNegativePrompt: false,
        supportsSeed: false,
        supportsQuality: true,
        supportsCustomDimensions: false,
        supportedFormats: ['png', 'jpg'],
        lockedSettings: ['Image size is fixed to 1K.', 'Safety filter uses the engine default.'],
    },
};

const QuickShoot = () => {
    const { user, profile, refreshProfile, isAnonymous, isGuest } = useAuth();
    const { t } = useLanguage();
    const [searchParams] = useSearchParams();

    // Data from hooks
    const { engines: aiModels } = useAIEngines();
    const [selectedAiModel, setSelectedAiModel] = useState(null);
    const [generationType, setGenerationType] = useState('photo'); // 'photo' | 'video'
    const effectiveAiModel = selectedAiModel || aiModels[0] || null;
    const engineUiConfig = ENGINE_UI_CONFIG[effectiveAiModel?.frontend_slug] || ENGINE_UI_CONFIG.default;
    const availableFormatOptions = FORMAT_OPTIONS.filter(option => engineUiConfig.supportedFormats.length === 0 || engineUiConfig.supportedFormats.includes(option.value));
    const marketplaceEnabled = effectiveAiModel?.frontend_slug === 'catwalk-ai-fast';
    const shouldShowModelSelector = engineUiConfig.requiresModelSelection || marketplaceEnabled;
    const { models, isLoading: isLoadingModels } = useShootableModels(marketplaceEnabled ? user?.id : null);
    const { characters: userAiCharacters } = useUserAICharacters(user?.id);
    const { prompts: userPromptsList } = useUserPrompts(user?.id);
    const { prompts: publicPromptsList } = usePublicPrompts();

    const savedPrompts = useMemo(() => {
        const map = new Map();
        [...(userPromptsList || []), ...(publicPromptsList || [])].forEach(p => map.set(p.id, p));
        return filterPromptsByCategories(Array.from(map.values()), QUICK_SHOOT_PROMPT_CATEGORIES);
    }, [userPromptsList, publicPromptsList]);

    const { invokeAsync } = useInvokeQuickShoot();
    const { addToGalleryAsync } = useAddToGallery();
    const { saveGenerationAsync } = useSaveGeneration();

    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const [modelSearch, setModelSearch] = useState('');
    const modelDropdownRef = useRef(null);
    const modelSearchRef = useRef(null);

    const [selectedModel, setSelectedModel] = useState(null);
    const [promptData, setPromptData] = useState({
        prompt: '',
        negativePrompt: '',
        width: 1024,
        height: 1024,
        format: 'png',
        quality: 'standard',
        seed: ''
    });
    const [showPromptPicker, setShowPromptPicker] = useState(false);
    const [promptSearch, setPromptSearch] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);
    const [generationId, setGenerationId] = useState(null);
    const [activeGenerationId, setActiveGenerationId] = useState(null);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [registerReason, setRegisterReason] = useState('save');
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [galleryTitle, setGalleryTitle] = useState('');
    const [galleryDescription, setGalleryDescription] = useState('');

    const { createPrompt, isCreating: isSavingPrompt } = useCreatePrompt();
    const [showSavePromptModal, setShowSavePromptModal] = useState(false);
    const [promptName, setPromptName] = useState('');
    const [progressValue, setProgressValue] = useState(0);

    const { generation: polledGeneration } = useGenerationStatus(activeGenerationId);

    const creditBalance = profile?.credits_balance ?? 0;
    const baseQualityCost = QUALITY_OPTIONS.find(q => q.value === promptData.quality)?.credits ?? 5;
    const engineMultiplier = effectiveAiModel?.cost_per_token ?? 1;
    const generationCost = Math.ceil(baseQualityCost * engineMultiplier);
    const progressMessage = QUICK_SHOOT_PROGRESS_STEPS.find(step => progressValue <= step.until)?.label || 'Generating image...';

    const applyPromptSelection = useCallback((selectedPrompt) => {
        if (!selectedPrompt) return;

        const params = selectedPrompt.parametersJson || {};
        setPromptData(prev => ({
            ...prev,
            prompt: selectedPrompt.promptText || '',
            negativePrompt: selectedPrompt.negativePrompt || '',
            ...(params.width && { width: params.width }),
            ...(params.height && { height: params.height }),
        }));
    }, []);

    // Marketplace models only apply when catwalk-ai-fast is selected; clear stale selection when switching engines
    useEffect(() => {
        if (!marketplaceEnabled && selectedModel && !selectedModel.isUserAiCharacter) {
            setSelectedModel(null);
        }
    }, [marketplaceEnabled, selectedModel]);

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
            const promptParam = searchParams.get('prompt');
            const promptId = searchParams.get('prompt_id');

            if (aiCharacterId && userAiCharacters.length > 0) {
                const character = userAiCharacters.find(c => c.id === aiCharacterId);
                if (character) setSelectedModel(character);
            } else if (modelId && models.length > 0) {
                const model = models.find(m => m.id === modelId);
                if (model) setSelectedModel(model);
            }

            if (promptParam) {
                setPromptData(prev => ({ ...prev, prompt: decodeURIComponent(promptParam) }));
            }

            if (promptId && savedPrompts.length > 0) {
                const promptObj = savedPrompts.find(p => p.id === promptId);
                if (promptObj) {
                    applyPromptSelection(promptObj);
                }
            }
        };
        applyUrlParams();
    }, [searchParams, models, userAiCharacters, savedPrompts, applyPromptSelection]);

    useEffect(() => {
        if (!isGenerating) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            setProgressValue(current => {
                if (current >= 94) return current;
                if (current < 20) return current + 5;
                if (current < 55) return current + 3;
                if (current < 80) return current + 2;
                return current + 1;
            });
        }, 900);

        return () => window.clearInterval(intervalId);
    }, [isGenerating]);

    // Watch polling result
    useEffect(() => {
        if (!polledGeneration) return;
        const handleResult = async () => {
            if (polledGeneration.status === 'completed' && polledGeneration.imageUrl) {
                setProgressValue(100);
                setGeneratedImage(polledGeneration.imageUrl);
                setGenerationId(polledGeneration.id);
                setIsGenerating(false);
                refreshProfile?.();
                setActiveGenerationId(null);
            } else if (['failed', 'timeout', 'canceled'].includes(polledGeneration.status)) {
                setIsGenerating(false);
                setError(polledGeneration.errorMessage || 'Generation failed');
                refreshProfile?.();
                setActiveGenerationId(null);
            }
        };
        handleResult();
    }, [polledGeneration, refreshProfile]);

    const handleGenerate = async () => {
        if (!user?.id) {
            setError(t('quickShoot.pleaseSignIn'));
            return;
        }
        if (!profile) {
            setError(t('quickShoot.profileLoading'));
            return;
        }
        if (shouldShowModelSelector && !effectiveSelectedModel) {
            setError(t('quickShoot.pleaseSelectModel'));
            return;
        }
        if (!sanitizedPromptData.prompt.trim()) {
            setError(t('quickShoot.pleaseEnterPrompt'));
            return;
        }
        if (creditBalance < generationCost) {
            if (isAnonymous) {
                setRegisterReason('credits');
                setShowRegisterModal(true);
            } else {
                setError(`Insufficient credits. Need ${generationCost}, have ${creditBalance}`);
            }
            return;
        }

        setIsGenerating(true);
        setProgressValue(8);
        setError(null);
        setSuccessMessage(null);

        try {
            const data = await invokeAsync({
                generationType,
                prompt: sanitizedPromptData.prompt,
                negativePrompt: sanitizedPromptData.negativePrompt,
                modelId: effectiveSelectedModel?.isUserAiCharacter ? null : effectiveSelectedModel?.id,
                aiModelId: effectiveSelectedModel?.isUserAiCharacter ? null : (effectiveAiModel?.ai_model_id || null),
                aiCharacterId: effectiveSelectedModel?.isUserAiCharacter ? effectiveSelectedModel?.id : null,
                modelImageUrl: effectiveSelectedModel?.profileImageUrl || effectiveSelectedModel?.thumbnailUrl || effectiveSelectedModel?.imageUrl || null,
                aiModelProviderName: effectiveAiModel?.frontend_slug,
                width: sanitizedPromptData.width,
                height: sanitizedPromptData.height,
                format: sanitizedPromptData.format,
                quality: sanitizedPromptData.quality,
                seed: sanitizedPromptData.seed,
            });

            setActiveGenerationId(data.generation.id);
        } catch (err) {
            setError(err.message);
            setIsGenerating(false);
            refreshProfile?.();
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
            a.download = `catwalk-${Date.now()}.${sanitizedPromptData.format || 'png'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            setSuccessMessage(t('quickShoot.imageDownloaded'));
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            setError(t('quickShoot.downloadFailed') + err.message);
        }
    };

    const handleSave = async () => {
        if (isAnonymous) {
            setRegisterReason('save');
            setShowRegisterModal(true);
            return;
        }
        if (!generationId) return;
        try {
            await saveGenerationAsync({ generationId });
            setSuccessMessage(t('quickShoot.imageSaved'));
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            setError(t('quickShoot.saveFailed') + err.message);
        }
    };

    const handleRemix = () => {
        setPromptData(prev => ({ ...prev, seed: '' }));
        setGeneratedImage(null);
        setGenerationId(null);
        setSuccessMessage(null);
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/studio/quick-shoot${generationId ? `?gen_id=${generationId}` : ''}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setSuccessMessage(t('quickShoot.linkCopied'));
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setSuccessMessage(t('quickShoot.linkCopied'));
            setTimeout(() => setSuccessMessage(null), 2000);
        }
    };

    const handleAddToGallery = () => {
        if (!generationId) return;
        // Pre-fill title from prompt
        setGalleryTitle('');
        setGalleryDescription('');
        setShowGalleryModal(true);
    };

    const confirmAddToGallery = async () => {
        if (!generationId) return;
        const title = galleryTitle.trim();
        if (!title) {
            setError(t('quickShoot.pleaseEnterTitle'));
            return;
        }
        setShowGalleryModal(false);
        try {
            const result = await addToGalleryAsync({
                generationId,
                title,
                description: galleryDescription.trim() || null,
                tags: [],
                typeLabel: 'quick-shoot',
                username: user?.email || null,
            });
            if (result.outputUrl) {
                setGeneratedImage(result.outputUrl);
            }
            if (result.alreadyExists) {
                setSuccessMessage(t('quickShoot.alreadyInGallery'));
            } else {
                setSuccessMessage(t('quickShoot.addedToGallery'));
            }
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            setError(t('quickShoot.addToGalleryFailed') + err.message);
        }
    };

    const handleSizePreset = (preset) => {
        setPromptData(prev => ({ ...prev, width: preset.width, height: preset.height }));
    };

    const handleSavePrompt = async () => {
        if (!promptName.trim() || !promptData.prompt.trim() || !user?.id) return;
        try {
            await createPrompt({
                userId: user.id,
                name: promptName.trim(),
                category: 'quick_shoot',
                promptText: promptData.prompt.trim(),
                negativePrompt: promptData.negativePrompt?.trim() || null,
                parametersJson: {
                    width: promptData.width,
                    height: promptData.height
                }
            });
            setSuccessMessage(t('quickShoot.promptSaved'));
            setShowSavePromptModal(false);
            setPromptName('');
            setTimeout(() => setSuccessMessage(null), 2000);
        } catch (err) {
            setError(t('quickShoot.savePromptFailed') + err.message);
        }
    };

    const sanitizedPromptData = {
        ...promptData,
        negativePrompt: engineUiConfig.supportsNegativePrompt ? promptData.negativePrompt : '',
        seed: engineUiConfig.supportsSeed ? promptData.seed : '',
        format: availableFormatOptions.some(option => option.value === promptData.format)
            ? promptData.format
            : (availableFormatOptions[0]?.value || promptData.format),
    };

    const effectiveSelectedModel = !shouldShowModelSelector
        ? null
        : (!marketplaceEnabled && selectedModel && !selectedModel.isUserAiCharacter
            ? null
            : selectedModel);

    const activeSizePreset = SIZE_PRESETS.find(
        p => p.width === sanitizedPromptData.width && p.height === sanitizedPromptData.height
    );

    return (
        <div className="quick-shoot-page">
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

            <div className="quick-shoot-main">
                <div className="quick-shoot-layout">
                    {/* Left Panel - Configuration */}
                    <aside className="quick-shoot-config">
                        <div className="panel-header">
                            <h3>
                                <span className="material-symbols-outlined">
                                    {generationType === 'video' ? 'videocam' : 'photo_camera'}
                                </span>
                                {t('quickShoot.title')}
                            </h3>
                            <div className="generation-mode-toggle">
                                <button
                                    className={generationType === 'photo' ? 'active' : ''}
                                    onClick={() => setGenerationType('photo')}
                                >
                                    {t('quickShoot.photo')}
                                </button>
                                <button
                                    className={generationType === 'video' ? 'active' : ''}
                                    onClick={() => setGenerationType('video')}
                                >
                                    {t('quickShoot.video')}
                                </button>
                            </div>
                        </div>
                        <div className="config-scroll">

                    <section className="config-section">

                    {/* AI Engine */}
                    <div className="form-group">
                        <label>{t('quickShoot.aiEngine')}</label>
                        <select
                            value={effectiveAiModel?.frontend_slug || ''}
                            onChange={(e) => setSelectedAiModel(aiModels.find(m => m.frontend_slug === e.target.value))}
                        >
                            {aiModels.map(aim => (
                                <option key={aim.ai_model_id} value={aim.frontend_slug}>
                                    {aim.frontend_name}{aim.cost_per_token > 1 ? ` (×${aim.cost_per_token})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Model Selector */}
                    {shouldShowModelSelector && (
                    <div className="form-group">
                        <label>{t('quickShoot.model')} <span className="required">*</span></label>
                        <div className="model-dropdown" ref={modelDropdownRef}>
                            <button
                                type="button"
                                className={`model-dropdown__trigger ${showModelDropdown ? 'open' : ''}`}
                                onClick={() => !isLoadingModels && setShowModelDropdown(!showModelDropdown)}
                                disabled={isLoadingModels}
                            >
                                {effectiveSelectedModel ? (
                                    <span className="model-dropdown__selected">
                                        {effectiveSelectedModel.imageUrl ? (
                                            <img src={effectiveSelectedModel.imageUrl} alt="" className="model-dropdown__thumb" />
                                        ) : (
                                            <span className="model-dropdown__thumb model-dropdown__thumb--placeholder material-symbols-outlined">face</span>
                                        )}
                                        <span className="model-dropdown__name">{effectiveSelectedModel.name}</span>
                                        {effectiveSelectedModel.isUserAiCharacter && <span className="model-dropdown__badge-ai">AI</span>}
                                        {effectiveSelectedModel.badge === 'Elite' && <span className="model-dropdown__elite">★ Elite</span>}
                                    </span>
                                ) : (
                                    <span className="model-dropdown__placeholder">
                                        {isLoadingModels ? t('quickShoot.loadingModels') : t('quickShoot.selectModel')}
                                    </span>
                                )}
                                <span className="material-symbols-outlined model-dropdown__chevron">expand_more</span>
                            </button>
                            {showModelDropdown && (
                                <div className="model-dropdown__list">
                                    <div className="model-dropdown__search">
                                        <span className="material-symbols-outlined">search</span>
                                        <input
                                            ref={modelSearchRef}
                                            type="text"
                                            placeholder={t('quickShoot.searchModels')}
                                            value={modelSearch}
                                            onChange={(e) => setModelSearch(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="model-dropdown__options">
                                        {/* User's AI Characters from Models Generator */}
                                        {!marketplaceEnabled && userAiCharacters.filter(c => !modelSearch || c.name.toLowerCase().includes(modelSearch.toLowerCase()) || (c.style && c.style.toLowerCase().includes(modelSearch.toLowerCase()))).length > 0 && (
                                            <>
                                                <div className="model-dropdown__section-label">{t('quickShoot.myAiModels')}</div>
                                                {userAiCharacters
                                                    .filter(c => !modelSearch || c.name.toLowerCase().includes(modelSearch.toLowerCase()) || (c.style && c.style.toLowerCase().includes(modelSearch.toLowerCase())))
                                                    .map(character => (
                                                    <div
                                                        key={`ai-${character.id}`}
                                                        className={`model-dropdown__option ${effectiveSelectedModel?.id === character.id ? 'active' : ''}`}
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
                                                            {character.style && <span className="model-dropdown__style">{character.style}</span>}
                                                        </div>
                                                        <span className="model-dropdown__badge-ai">AI</span>
                                                    </div>
                                                ))}
                                            </>
                                        )}

                                        {/* Marketplace Models */}
                                        {marketplaceEnabled && models.filter(m => !modelSearch || m.name.toLowerCase().includes(modelSearch.toLowerCase()) || (m.style && m.style.toLowerCase().includes(modelSearch.toLowerCase()))).length > 0 && (
                                            <div className="model-dropdown__section-label">{t('quickShoot.marketplace')}</div>
                                        )}
                                        {marketplaceEnabled && models
                                            .filter(m => !modelSearch || m.name.toLowerCase().includes(modelSearch.toLowerCase()) || (m.style && m.style.toLowerCase().includes(modelSearch.toLowerCase())))
                                            .map(model => (
                                            <div
                                                key={model.id}
                                                className={`model-dropdown__option ${effectiveSelectedModel?.id === model.id ? 'active' : ''}`}
                                                onClick={() => {
                                                    setSelectedModel(model);
                                                    setShowModelDropdown(false);
                                                    setModelSearch('');
                                                }}
                                            >
                                                <img src={model.imageUrl} alt="" className="model-dropdown__thumb" />
                                                <div className="model-dropdown__option-info">
                                                    <span className="model-dropdown__name">{model.name}</span>
                                                    {model.style && <span className="model-dropdown__style">{model.style}</span>}
                                                </div>
                                                {model.badge === 'Elite' && <span className="model-dropdown__elite">★</span>}
                                                {model.price && <span className="model-dropdown__price">${model.price}</span>}
                                            </div>
                                        ))}
                                        {((marketplaceEnabled ? models.filter(m => !modelSearch || m.name.toLowerCase().includes(modelSearch.toLowerCase()) || (m.style && m.style.toLowerCase().includes(modelSearch.toLowerCase()))).length : 0) === 0) && userAiCharacters.filter(c => !modelSearch || c.name.toLowerCase().includes(modelSearch.toLowerCase()) || (c.style && c.style.toLowerCase().includes(modelSearch.toLowerCase()))).length === 0 && (
                                            <div className="model-dropdown__empty">{t('quickShoot.noModelsFound')}</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    )}

                    {/* Prompt */}
                    <div className="form-group">
                        <div className="label-with-action">
                            <label>{t('quickShoot.prompt')} <span className="required">*</span></label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {promptData.prompt.trim() && !isGuest && (
                                    <button className="btn-picker" onClick={() => setShowSavePromptModal(true)} title="Save this prompt as a template">
                                        <span className="material-symbols-outlined">save</span>
                                        {t('common.save')}
                                    </button>
                                )}
                                {savedPrompts.length > 0 && (
                                    <button className="btn-picker" onClick={() => setShowPromptPicker(!showPromptPicker)}>
                                        <span className="material-symbols-outlined">description</span>
                                        {showPromptPicker ? t('common.close') : t('quickShoot.savedPrompts')}
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
                                        placeholder={t('quickShoot.searchPrompts')}
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
                                            applyPromptSelection(p);
                                            setShowPromptPicker(false);
                                            setPromptSearch('');
                                        }}
                                    >
                                        <span className="picker-item-title">{p.name || t('quickShoot.untitledPrompt')}</span>
                                        <span className="picker-item-text">{(p.promptText || '').substring(0, 60)}...</span>
                                    </div>
                                ))}
                                {savedPrompts.filter(p => !promptSearch || (p.name || '').toLowerCase().includes(promptSearch.toLowerCase()) || (p.promptText || '').toLowerCase().includes(promptSearch.toLowerCase())).length === 0 && (
                                    <div className="picker-empty">{t('quickShoot.noPromptsFound')}</div>
                                )}
                            </div>
                        )}

                        <textarea
                            placeholder={t('quickShoot.promptPlaceholder')}
                            value={promptData.prompt}
                            onChange={(e) => {
                                if (e.target.value.length <= PROMPT_MAX_LENGTH) {
                                    setPromptData(prev => ({ ...prev, prompt: e.target.value }));
                                }
                            }}
                            rows="4"
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
                    {engineUiConfig.supportsNegativePrompt ? (
                    <div className="form-group">
                        <label>{t('quickShoot.negativePrompt')} <span className="optional">{t('common.optional')}</span></label>
                        <textarea
                            placeholder={t('quickShoot.negativePromptPlaceholder')}
                            value={promptData.negativePrompt}
                            onChange={(e) => setPromptData(prev => ({ ...prev, negativePrompt: e.target.value }))}
                            rows="2"
                        />
                    </div>
                    ) : (
                    <div className="engine-note">
                        <span className="material-symbols-outlined">info</span>
                        <span>{t('quickShoot.negativePromptNotSupported')}</span>
                    </div>
                    )}

                        {engineUiConfig.lockedSettings.length > 0 && (
                            <div className="engine-lock-list">
                                {engineUiConfig.lockedSettings.map(note => (
                                    <div key={note} className="engine-note">
                                        <span className="material-symbols-outlined">lock</span>
                                        <span>{note}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                    {/* Output Settings (Photo Only) */}
                    {generationType === 'photo' && (
                    <div className="form-group">
                        <label>{t('quickShoot.outputSettings')}</label>
                        {!engineUiConfig.supportsCustomDimensions && (
                            <div className="engine-note">
                                <span className="material-symbols-outlined">straighten</span>
                                <span>{t('quickShoot.aspectRatioNote')}</span>
                            </div>
                        )}
                        <div className="size-presets">
                            {SIZE_PRESETS.map(preset => (
                                <button
                                    key={preset.label}
                                    className={`size-preset-btn ${activeSizePreset?.label === preset.label ? 'active' : ''}`}
                                    onClick={() => handleSizePreset(preset)}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                        {engineUiConfig.supportsQuality && (
                        <div className="quality-presets">
                            {QUALITY_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    className={`size-preset-btn ${promptData.quality === opt.value ? 'active' : ''}`}
                                    onClick={() => setPromptData(prev => ({ ...prev, quality: opt.value }))}
                                >
                                    {t(`quickShoot.${opt.value}`)} · {opt.credits} {t('quickShoot.creditsNeeded')}
                                </button>
                            ))}
                        </div>
                        )}
                        <div className="output-row output-row--stack-mobile">
                            {engineUiConfig.supportsCustomDimensions && (
                            <>
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
                            </>
                            )}
                            {availableFormatOptions.length > 0 && (
                            <select
                                className="format-select"
                                value={promptData.format}
                                onChange={(e) => setPromptData(prev => ({ ...prev, format: e.target.value }))}
                            >
                                {availableFormatOptions.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                            </select>
                            )}
                        </div>
                        {engineUiConfig.supportsSeed && (
                        <div className="output-row">
                            <div className="output-field seed-field">
                                <span className="output-field-label">Seed</span>
                                <input
                                    type="text"
                                    placeholder="Random"
                                    value={promptData.seed}
                                    onChange={(e) => setPromptData(prev => ({ ...prev, seed: e.target.value }))}
                                />
                            </div>
                        </div>
                        )}
                    </div>
                    )}
                    </section>

                        </div>{/* end config-scroll */}

                        {/* Sticky Generate Footer */}
                        <div className="generate-footer">
                            <div className="credit-info">
                                <span className="material-symbols-outlined">generating_tokens</span>
                                <span>{generationCost} {t('quickShoot.creditsNeeded')}</span>
                            </div>
                            <button
                                className="btn-generate"
                                onClick={handleGenerate}
                                disabled={isGenerating || !selectedModel || !sanitizedPromptData.prompt.trim() || creditBalance < generationCost}
                            >
                                {isGenerating ? (
                                    <><div className="spinner"></div> {t('quickShoot.generating')}</>
                                ) : (
                                    <><span className="material-symbols-outlined">auto_awesome</span> {t('quickShoot.generate')}</>
                                )}
                            </button>
                        </div>
                    </aside>

                    {/* Right Panel - Results */}
                    <main className="quick-shoot-result">
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
                                        <img src={generatedImage} alt="Generated" className="preview-stage__image" />
                                    ) : (
                                        <div className="preview-placeholder preview-stage__placeholder">
                                            <span className="material-symbols-outlined">image</span>
                                            <p>Your generated image will appear here</p>
                                        </div>
                                    )}
                                    {isGenerating && (
                                        <div className="preview-stage__overlay">
                                            <span className="spinner"></span>
                                            <div className="preview-stage__progress-copy">
                                                <span className="preview-stage__progress-label">{progressMessage}</span>
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
                                        <Button variant="secondary" size="sm" icon="download" onClick={handleDownload}>{t('common.download')}</Button>
                                        <Button variant="secondary" size="sm" icon="bookmark" onClick={handleSave}>{t('common.save')}</Button>
                                        <Button variant="secondary" size="sm" icon="refresh" onClick={handleRemix}>{t('quickShoot.remix')}</Button>
                                        <Button variant="secondary" size="sm" icon="share" onClick={handleShare}>{t('common.share')}</Button>
                                        <Button variant="outline" size="sm" icon="add_photo_alternate" onClick={handleAddToGallery}>{t('nav.gallery')}</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            <RegisterPromptModal
                open={showRegisterModal}
                onClose={() => setShowRegisterModal(false)}
                reason={registerReason}
            />

            {/* Gallery Title Side Panel */}
            <SidePanel
                open={showGalleryModal}
                onClose={() => setShowGalleryModal(false)}
                title={t('quickShoot.addToGallery')}
                footer={
                    <>
                        <Button variant="ghost" size="sm" onClick={() => setShowGalleryModal(false)}>{t('common.cancel')}</Button>
                        <Button variant="primary" size="sm" icon="add_photo_alternate" onClick={confirmAddToGallery}>{t('quickShoot.addToGallery')}</Button>
                    </>
                }
            >
                <div className="form-group">
                    <label>{t('quickShoot.galleryTitle')} <span className="required">*</span></label>
                    <input
                        type="text"
                        value={galleryTitle}
                        onChange={(e) => setGalleryTitle(e.target.value)}
                        maxLength={120}
                        autoFocus
                    />
                </div>
                <div className="form-group">
                    <label>{t('quickShoot.galleryDescription')} <span className="optional">{t('common.optional')}</span></label>
                    <textarea
                        value={galleryDescription}
                        onChange={(e) => setGalleryDescription(e.target.value)}
                        rows={3}
                    />
                </div>
            </SidePanel>

            {/* Save Prompt Modal */}
            <Modal
                open={showSavePromptModal}
                onClose={() => setShowSavePromptModal(false)}
                title={t('quickShoot.savePromptTitle')}
                footer={
                    <>
                        <Button variant="secondary" size="md" onClick={() => setShowSavePromptModal(false)}>{t('common.cancel')}</Button>
                        <Button variant="primary" size="md" onClick={handleSavePrompt} disabled={!promptName.trim() || isSavingPrompt}>
                            {isSavingPrompt ? t('common.loading') : t('common.save')}
                        </Button>
                    </>
                }
            >
                <div className="form-group">
                    <label>{t('quickShoot.promptNameLabel')}</label>
                    <input
                        type="text"
                        placeholder={t('quickShoot.promptNamePlaceholder')}
                        value={promptName}
                        onChange={(e) => setPromptName(e.target.value)}
                        autoFocus
                    />
                </div>
            </Modal>
        </div>
    );
};

export default QuickShoot;
