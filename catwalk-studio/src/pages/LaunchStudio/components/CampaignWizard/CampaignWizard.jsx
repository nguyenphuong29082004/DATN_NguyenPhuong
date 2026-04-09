import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useShootableModels } from '../../../../hooks/models/useShootModels';
import { useInvokeQuickShoot } from '../../../../hooks/generations/useQuickShoot';
import { useAuth } from '../../../../hooks/useAuth';
import { useShootWardrobe } from '../../../../hooks/wardrobe/useShootWardrobe';
import { useUserPromptsInfinite, usePublicPrompts } from '../../../../hooks/prompts/usePrompts';
import { getSupabaseClient } from '../../../../infrastructure/supabase/supabase.client';
import { Button } from '../../../../components/common/Button/Button';
import './CampaignWizard.css';
import '../../pages/ModelOnboarding.css';

const STEPS = [
    { id: 'models', label: 'Select Models' },
    { id: 'type', label: 'Shoot Type' },
    { id: 'products', label: 'Products' },
    { id: 'prompt', label: 'Prompt' },
    { id: 'output', label: 'Output' },
    { id: 'template', label: 'Template' }
];

const TEMPLATES = [
    {
        id: 'ugc_product',
        label: 'UGC Product Show & Tell',
        prompt: 'A casual styled shot of a model holding the product, smiling naturally at the camera, bright lighting, social media influencer style',
        size: '9:16',
        filter: 'none',
        background: 'street'
    },
    {
        id: 'fashion_twirl',
        label: 'Fashion Model Twirl',
        prompt: 'Dynamic fashion editorial shot, model twirling with confident movement, high-end magazine aesthetic, dramatic lighting',
        size: '4:5',
        filter: 'high_fashion',
        background: 'studio'
    },
    {
        id: 'editorial_lookbook',
        label: 'Editorial Lookbook',
        prompt: 'Clean minimal lookbook photography, full body shot, soft diffused lighting, neutral minimalist background',
        size: '4:5',
        filter: 'editorial',
        background: 'studio'
    },
    {
        id: 'ecommerce_shot',
        label: 'E-commerce Product Shot',
        prompt: 'Standard e-commerce model shot, front facing, well lit, clean white background, focus on the garment',
        size: '4:5',
        filter: 'none',
        background: 'studio'
    },
    {
        id: 'social_story',
        label: 'Social Media Story',
        prompt: 'Social media story style fashion shot, vertical framing, engaging lifestyle composition, trendy editorial lighting',
        size: '9:16',
        filter: 'street',
        background: 'street'
    }
];

const SHOOT_TYPE_CAPABILITIES = {
    photo: true,
    video: false,
    gif: false,
    cinemagraph: false,
};

const SIZE_PRESETS = {
    '1:1': { width: 1024, height: 1024 },
    '4:5': { width: 896, height: 1120 },
    '9:16': { width: 768, height: 1344 },
    '16:9': { width: 1344, height: 768 },
};

const clampDimension = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(2048, Math.max(256, parsed));
};

export const CampaignWizard = ({ campaignId, onClose, initialSelections = null, layout = 'modal', headerTitle = 'Campaign Setup' }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [selections, setSelections] = useState({
        models: initialSelections?.models || [],
        type: initialSelections?.type || 'photo',
        products: initialSelections?.products || [],
        prompt: initialSelections?.prompt || '',
        negativePrompt: initialSelections?.negativePrompt || '',
        output: {
            size: initialSelections?.output?.size || '9:16',
            quality: initialSelections?.output?.quality || 'standard',
            filter: initialSelections?.output?.filter || 'none',
            background: initialSelections?.output?.background || 'auto',
            customWidth: initialSelections?.output?.customWidth || 1080,
            customHeight: initialSelections?.output?.customHeight || 1350,
        },
        template: initialSelections?.template || null,
    });

    // Sync state when initialSelections changes (e.g. Remix button)
    useEffect(() => {
        if (!initialSelections) return;
        setCurrentStep(0);
        setSelections({
            models: initialSelections.models || [],
            type: initialSelections.type || 'photo',
            products: initialSelections.products || [],
            prompt: initialSelections.prompt || '',
            negativePrompt: initialSelections.negativePrompt || '',
            output: {
                size: initialSelections.output?.size || '9:16',
                quality: initialSelections.output?.quality || 'standard',
                filter: initialSelections.output?.filter || 'none',
                background: initialSelections.output?.background || 'auto',
                customWidth: initialSelections.output?.customWidth || 1080,
                customHeight: initialSelections.output?.customHeight || 1350,
            },
            template: initialSelections.template || null,
        });
    }, [initialSelections]);

    const { user } = useAuth();
    const customBackgroundInputRef = useRef(null);
    const { models: dbModels, isLoading: loadingModels } = useShootableModels(user?.id);
    const { invokeAsync, isInvoking } = useInvokeQuickShoot();
    const [generateError, setGenerateError] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Prompt Picker State
    const { prompts: userPromptsList, hasNextPage: hasMoreUserPrompts, fetchNextPage: fetchMoreUserPrompts, isFetchingNextPage: isFetchingMoreUserPrompts } = useUserPromptsInfinite(user?.id, { pageSize: 20 });
    const { prompts: publicPromptsList } = usePublicPrompts();
    const [showPromptPicker, setShowPromptPicker] = useState(false);
    const [promptSearch, setPromptSearch] = useState('');
    const promptPickerRef = useRef(null);

    const savedPrompts = useMemo(() => {
        const map = new Map();
        [...(userPromptsList || []), ...(publicPromptsList || [])].forEach(p => map.set(p.id, p));
        return Array.from(map.values());
    }, [userPromptsList, publicPromptsList]);

    const handlePromptPickerScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop - clientHeight < 80 && !isFetchingMoreUserPrompts && hasMoreUserPrompts) {
            fetchMoreUserPrompts();
        }
    }, [isFetchingMoreUserPrompts, hasMoreUserPrompts, fetchMoreUserPrompts]);

    const applyPromptSelection = useCallback((selectedPrompt) => {
        if (!selectedPrompt) return;
        setSelections(prev => ({
            ...prev,
            prompt: selectedPrompt.promptText || '',
            negativePrompt: selectedPrompt.negativePrompt || '',
        }));
    }, []);

    // Product Tabs State
    const [productTab, setProductTab] = useState('upload'); // 'upload', 'designer', 'ecommerce'
    
    const { items: wardrobeItems, isLoading: isLoadingWardrobe, hasMore: hasMoreWardrobe, loadMore: loadMoreWardrobe, search: searchWardrobe, fetchItems: fetchWardrobe } = useShootWardrobe(user?.id);
    const [designerSearch, setDesignerSearch] = useState('');
    const designerSearchTimer = useRef(null);
    const designerGridRef = useRef(null);

    useEffect(() => {
        if (productTab === 'designer' && wardrobeItems.length === 0) {
            fetchWardrobe();
        }
    }, [productTab, wardrobeItems.length, fetchWardrobe]);

    const handleDesignerSearch = useCallback((value) => {
        setDesignerSearch(value);
        clearTimeout(designerSearchTimer.current);
        designerSearchTimer.current = setTimeout(() => {
            searchWardrobe(value);
        }, 400);
    }, [searchWardrobe]);

    const handleDesignerScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop - clientHeight < 100 && !isLoadingWardrobe && hasMoreWardrobe) {
            loadMoreWardrobe();
        }
    }, [isLoadingWardrobe, hasMoreWardrobe, loadMoreWardrobe]);

    // Model Filters State
    const [modelFilters, setModelFilters] = useState({
        search: '',
        type: 'all',
        gender: 'all',
        ethnicity: 'all',
        bodyType: 'all',
        ageRange: 'all',
        style: '',
    });

    const filteredModels = useMemo(() => {
        if (!dbModels) return [];
        return dbModels.filter(m => {
            if (modelFilters.search && !m.name.toLowerCase().includes(modelFilters.search.toLowerCase())) return false;
            if (modelFilters.type === 'ai' && !m.isAi) return false;
            if (modelFilters.type === 'real' && m.isAi) return false;
            if (modelFilters.gender !== 'all' && m.gender !== modelFilters.gender) return false;
            if (modelFilters.ethnicity !== 'all' && m.ethnicity !== modelFilters.ethnicity) return false;
            if (modelFilters.bodyType !== 'all' && m.bodyType !== modelFilters.bodyType) return false;
            if (modelFilters.ageRange !== 'all' && m.ageRange !== modelFilters.ageRange) return false;
            if (modelFilters.style && !m.styleTags?.some(tag => tag.toLowerCase().includes(modelFilters.style.toLowerCase()))) return false;
            return true;
        });
    }, [dbModels, modelFilters]);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleProductUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setGenerateError('');
        try {
            const supabase = getSupabaseClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('campaign_assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('campaign_assets')
                .getPublicUrl(filePath);

            if (data?.publicUrl) {
                setSelections(prev => ({
                    ...prev,
                    products: [...prev.products, data.publicUrl]
                }));
            }
        } catch (err) {
            console.error('Upload failed:', err);
            setGenerateError('Failed to upload product image: ' + err.message);
        } finally {
            setIsUploading(false);
            e.target.value = null;
        }
    };

    const handleAddProductFromUrl = (url) => {
        if (!url) return;
        setSelections(prev => {
            const products = prev.products.includes(url)
                ? prev.products.filter(p => p !== url)
                : [...prev.products, url];
            return { ...prev, products };
        });
    };

    const handleRemoveProduct = (indexToRemove) => {
        setSelections(prev => ({
            ...prev,
            products: prev.products.filter((_, i) => i !== indexToRemove)
        }));
    };

    const handleCustomBackgroundUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const supabase = getSupabaseClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `bg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;
            const { error } = await supabase.storage.from('campaign_assets').upload(filePath, file);
            if (error) throw error;
            const { data } = supabase.storage.from('campaign_assets').getPublicUrl(filePath);
            if (data?.publicUrl) {
                setSelections(prev => ({ ...prev, output: { ...prev.output, background: data.publicUrl } }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsUploading(false);
            e.target.value = null;
        }
    };

    const handleComplete = async () => {
        if (!selections.prompt.trim()) {
            setGenerateError('Please enter a prompt.');
            return;
        }

        if (selections.models.length === 0) {
            setGenerateError('Please select at least one model.');
            return;
        }

        const isCustomSize = selections.output.size === 'custom';
        const width = isCustomSize
            ? clampDimension(selections.output.customWidth, 1080)
            : (SIZE_PRESETS[selections.output.size]?.width || 768);
        const height = isCustomSize
            ? clampDimension(selections.output.customHeight, 1350)
            : (SIZE_PRESETS[selections.output.size]?.height || 1344);

        setGenerateError('');

        try {
            const promises = selections.models.map((modelId) => {
                let finalPrompt = selections.prompt;
                if (selections.output.filter !== 'none') {
                    finalPrompt += `, ${selections.output.filter.replace('_', ' ')} photography style`;
                }
                if (selections.output.background !== 'auto') {
                    finalPrompt += `, ${selections.output.background} background`;
                }
                if (selections.products.length > 0) {
                    finalPrompt += `. Featuring product references: ${selections.products.join(', ')}`;
                }

                return invokeAsync({
                    prompt: finalPrompt,
                    negativePrompt: selections.negativePrompt,
                    modelId,
                    campaignId,
                    width,
                    height,
                    format: 'png',
                    quality: selections.output.quality,
                    metadata: {
                        shootType: selections.type,
                        template: selections.template,
                        output: {
                            size: selections.output.size,
                            filter: selections.output.filter,
                            background: selections.output.background,
                            customWidth: width,
                            customHeight: height,
                        },
                        products: selections.products,
                        source: initialSelections?.sourceGenerationId || null,
                    },
                });
            });

            await Promise.all(promises);
            onClose();
        } catch (err) {
            setGenerateError(err.message || 'Failed to start generations');
        }
    };

    const toggleModel = (modelId) => {
        setSelections(prev => {
            const models = prev.models.includes(modelId)
                ? prev.models.filter(id => id !== modelId)
                : [...prev.models, modelId];
            return { ...prev, models };
        });
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Select Models
                return (
                    <div className="wizard-step wizard-models">
                        <h3>Select Model(s)</h3>
                        <p className="wizard-desc">Choose one or multiple models. You can run comparison shoots across all selected models.</p>
                        
                        <div className="wizard-filters" style={{ flexWrap: 'wrap', gap: '8px' }}>
                            <input 
                                type="text" 
                                placeholder="Search models..." 
                                value={modelFilters.search}
                                onChange={(e) => setModelFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="wizard-filter-input"
                            />
                            <select 
                                value={modelFilters.type}
                                onChange={(e) => setModelFilters(prev => ({ ...prev, type: e.target.value }))}
                                className="wizard-filter-select"
                            >
                                <option value="all">All Types</option>
                                <option value="ai">AI Models</option>
                                <option value="real">Real Models</option>
                            </select>
                            <select 
                                value={modelFilters.gender}
                                onChange={(e) => setModelFilters(prev => ({ ...prev, gender: e.target.value }))}
                                className="wizard-filter-select"
                            >
                                <option value="all">All Genders</option>
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                                <option value="non-binary">Non-binary</option>
                            </select>
                            <select 
                                value={modelFilters.ethnicity}
                                onChange={(e) => setModelFilters(prev => ({ ...prev, ethnicity: e.target.value }))}
                                className="wizard-filter-select"
                            >
                                <option value="all">All Ethnicities</option>
                                <option value="caucasian">Caucasian</option>
                                <option value="asian">Asian</option>
                                <option value="black">Black</option>
                                <option value="hispanic">Hispanic</option>
                                <option value="middle_eastern">Middle Eastern</option>
                                <option value="mixed">Mixed</option>
                                <option value="other">Other</option>
                            </select>
                            <select 
                                value={modelFilters.bodyType}
                                onChange={(e) => setModelFilters(prev => ({ ...prev, bodyType: e.target.value }))}
                                className="wizard-filter-select"
                            >
                                <option value="all">All Body Types</option>
                                <option value="slim">Slim</option>
                                <option value="athletic">Athletic</option>
                                <option value="average">Average</option>
                                <option value="curvy">Curvy</option>
                                <option value="plus_size">Plus Size</option>
                            </select>
                            <select 
                                value={modelFilters.ageRange}
                                onChange={(e) => setModelFilters(prev => ({ ...prev, ageRange: e.target.value }))}
                                className="wizard-filter-select"
                            >
                                <option value="all">All Ages</option>
                                <option value="18-25">18-25</option>
                                <option value="26-35">26-35</option>
                                <option value="36-45">36-45</option>
                                <option value="46+">46+</option>
                            </select>
                            <input 
                                type="text" 
                                placeholder="Style tags (e.g. Vintage)" 
                                value={modelFilters.style}
                                onChange={(e) => setModelFilters(prev => ({ ...prev, style: e.target.value }))}
                                className="wizard-filter-input"
                            />
                        </div>

                        {loadingModels ? (
                            <div className="wizard-loading"><div className="spinner" /></div>
                        ) : (
                            <div className="wizard-model-grid">
                                {filteredModels.length === 0 ? (
                                    <div className="wizard-empty-state">
                                        No models match your filters.
                                    </div>
                                ) : (
                                    filteredModels.map(model => (
                                    <div 
                                        key={model.id} 
                                        className={`wizard-model-card ${selections.models.includes(model.id) ? 'selected' : ''}`}
                                        onClick={() => toggleModel(model.id)}
                                    >
                                        <div className="wizard-model-img">
                                            <img src={model.imageUrl} alt={model.name} />
                                            {selections.models.includes(model.id) && (
                                                <div className="wizard-model-check">
                                                    <span className="material-symbols-outlined">check_circle</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="wizard-model-info">
                                            <h4>{model.name}</h4>
                                            <span className="wizard-model-price">
                                                {model.price ? `${model.price} credits/gen` : '5 credits/gen'}
                                            </span>
                                            <div className="wizard-model-meta">
                                                <span>{model.availability || 'Availability TBD'}</span>
                                                <span>{typeof model.rating === 'number' ? `★ ${model.rating.toFixed(1)}` : 'No ratings yet'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )))}
                            </div>
                        )}
                        {selections.models.length > 1 && (
                            <div className="wizard-compare-notice">
                                <span className="material-symbols-outlined">compare</span>
                                <span><strong>Run Compare enabled:</strong> You've selected {selections.models.length} models. Generations will be run across all of them for comparison.</span>
                            </div>
                        )}
                    </div>
                );
            case 1: // Select Type
                return (
                    <div className="wizard-step wizard-type">
                        <h3>Select Shoot Type</h3>
                        <div className="wizard-options">
                            {['photo', 'video', 'gif', 'cinemagraph'].map(type => {
                                const isSupported = SHOOT_TYPE_CAPABILITIES[type];
                                return (
                                    <button
                                        key={type}
                                        className={`wizard-option-btn ${selections.type === type ? 'selected' : ''}`}
                                        onClick={() => isSupported && setSelections(prev => ({ ...prev, type }))}
                                        disabled={!isSupported}
                                        title={!isSupported ? 'Coming Soon' : ''}
                                    >
                                        <span className="material-symbols-outlined">
                                            {type === 'photo' ? 'image' : type === 'video' ? 'movie' : 'gif'}
                                        </span>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                        {!isSupported && <span style={{fontSize: '0.7rem', marginTop: '4px', opacity: 0.7}}>Coming Soon</span>}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="wizard-note">Campaign generation currently supports Photo only. Video, GIF and Cinemagraph are coming soon.</p>
                    </div>
                );
            case 2: // Add Clothing
                return (
                    <div className="wizard-step wizard-products">
                        <h3>Add Clothing / Products</h3>
                        <p className="wizard-desc">Upload product images or select from your Designer library.</p>

                        <div className="wizard-tabs">
                            <button className={`wizard-tab ${productTab === 'upload' ? 'active' : ''}`} onClick={() => setProductTab('upload')}>Upload</button>
                            <button className={`wizard-tab ${productTab === 'designer' ? 'active' : ''}`} onClick={() => setProductTab('designer')}>Designer Library</button>
                            <button className={`wizard-tab ${productTab === 'ecommerce' ? 'active' : ''}`} onClick={() => setProductTab('ecommerce')}>E-commerce</button>
                        </div>
                        
                        {selections.products.length > 0 && (
                            <div className="wizard-product-grid">
                                {selections.products.map((url, i) => (
                                    <div key={i} className="wizard-product-item">
                                        <img src={url} alt="Product" className="wizard-product-image" />
                                        <button
                                            className="wizard-product-remove"
                                            onClick={() => handleRemoveProduct(i)}
                                        >
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="wizard-tab-content">
                        {productTab === 'upload' && (
                            <div className="wizard-upload-area wizard-upload-area--clickable">
                                {isUploading ? (
                                    <div className="wizard-loading wizard-loading--spaced">
                                        <div className="spinner" />
                                        <p className="wizard-upload-text">Uploading...</p>
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleProductUpload}
                                            className="wizard-upload-input"
                                            title="Click to upload"
                                        />
                                        <span className="material-symbols-outlined wizard-upload-icon">cloud_upload</span>
                                        <p className="wizard-upload-text">Drag & drop product images here, or click to browse</p>
                                        <Button variant="secondary" size="sm" className="wizard-upload-button">Select Files</Button>
                                    </>
                                )}
                            </div>
                        )}

                        {productTab === 'designer' && (
                            <>
                                <div className="wizard-search-wrapper">
                                    <span className="material-symbols-outlined wizard-search-icon">search</span>
                                    <input
                                        type="text"
                                        placeholder="Search designer items..."
                                        value={designerSearch}
                                        onChange={(e) => handleDesignerSearch(e.target.value)}
                                        className="wizard-filter-input wizard-filter-input--search"
                                    />
                                </div>
                                <div
                                    className="wizard-designer-grid"
                                    ref={designerGridRef}
                                    onScroll={handleDesignerScroll}
                                >
                                    {wardrobeItems.map(item => {
                                        const imageUrl = item.high_res_image_url || item.thumbnail_url;
                                        const isSelected = selections.products.includes(imageUrl);
                                        return (
                                            <div
                                                key={item.item_id}
                                                className={`wizard-designer-item ${isSelected ? 'selected' : ''}`}
                                                onClick={() => handleAddProductFromUrl(imageUrl)}
                                            >
                                                <img src={item.thumbnail_url} alt={item.title} className="wizard-designer-item-image" />
                                                <div className="wizard-product-overlay" title={item.title}>{item.title}</div>
                                                {isSelected && (
                                                    <div className="wizard-product-selected">
                                                        <span className="material-symbols-outlined">check_circle</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {isLoadingWardrobe && (
                                        <div className="wizard-loading wizard-loading--full-row">
                                            <div className="spinner" />
                                        </div>
                                    )}
                                    {!isLoadingWardrobe && wardrobeItems.length === 0 && (
                                        <p className="wizard-empty-text">No items found.</p>
                                    )}
                                </div>
                            </>
                        )}

                        {productTab === 'ecommerce' && (
                            <div className="wizard-ecommerce-placeholder">
                                <span className="material-symbols-outlined">storefront</span>
                                <h4>Shopify & WooCommerce integration coming soon</h4>
                                <p>
                                    Direct import from connected e-commerce stores is not available yet.
                                    Use Upload or Designer Library in this release.
                                </p>
                            </div>
                        )}
                        </div>

                        {generateError && <p className="wizard-error wizard-error--spaced">{generateError}</p>}
                    </div>
                );
            case 3: // Prompt
                return (
                    <div className="wizard-step wizard-prompt">
                        <h3>Describe your Shoot</h3>
                        <p className="wizard-desc">Enter the prompt for your generations.</p>
                        
                        <div className="wizard-prompt-fields">
                            <div className="wizard-prompt-field">
                                <div className="wizard-prompt-label-row">
                                    <label>Prompt <span className="wizard-required">*</span></label>
                                    {savedPrompts.length > 0 && (
                                        <button
                                            className="wizard-btn-picker"
                                            onClick={() => setShowPromptPicker(!showPromptPicker)}
                                        >
                                            <span className="material-symbols-outlined">description</span>
                                            {showPromptPicker ? 'Close' : 'Saved Prompts'}
                                        </button>
                                    )}
                                </div>

                                {showPromptPicker && (
                                    <div className="wizard-prompt-picker-dropdown" ref={promptPickerRef} onScroll={handlePromptPickerScroll}>
                                        <div className="wizard-picker-search">
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
                                            .filter(p =>
                                                !promptSearch ||
                                                (p.name || '').toLowerCase().includes(promptSearch.toLowerCase()) ||
                                                (p.promptText || '').toLowerCase().includes(promptSearch.toLowerCase())
                                            )
                                            .map(p => (
                                                <div
                                                    key={p.id}
                                                    className="wizard-picker-item"
                                                    onClick={() => {
                                                        applyPromptSelection(p);
                                                        setShowPromptPicker(false);
                                                        setPromptSearch('');
                                                    }}
                                                >
                                                    <span className="wizard-picker-item-title">{p.name || 'Untitled Prompt'}</span>
                                                    <span className="wizard-picker-item-text">{(p.promptText || '').substring(0, 80)}...</span>
                                                </div>
                                            ))}
                                        {isFetchingMoreUserPrompts && (
                                            <div className="wizard-picker-loader">Loading more…</div>
                                        )}
                                        {savedPrompts.filter(p =>
                                            !promptSearch ||
                                            (p.name || '').toLowerCase().includes(promptSearch.toLowerCase()) ||
                                            (p.promptText || '').toLowerCase().includes(promptSearch.toLowerCase())
                                        ).length === 0 && !isFetchingMoreUserPrompts && (
                                            <div className="wizard-picker-empty">No prompts found</div>
                                        )}
                                    </div>
                                )}

                                <textarea
                                    value={selections.prompt}
                                    onChange={(e) => setSelections(prev => ({ ...prev, prompt: e.target.value }))}
                                    placeholder="A high fashion shoot in a neon-lit cyber city..."
                                    rows="4"
                                    className="wizard-textarea"
                                />
                            </div>

                            <div className="wizard-prompt-field">
                                <label>Negative Prompt</label>
                                <textarea
                                    value={selections.negativePrompt}
                                    onChange={(e) => setSelections(prev => ({ ...prev, negativePrompt: e.target.value }))}
                                    placeholder="Ugly, deformed, blurry..."
                                    rows="2"
                                    className="wizard-textarea"
                                />
                                <span className="wizard-field-hint">Describe what you don't want in the output</span>
                            </div>
                        </div>
                        
                        {generateError && <p className="wizard-error">{generateError}</p>}
                    </div>
                );
            case 4: // Configure Output
                return (
                    <div className="wizard-step wizard-output">
                        <h3>Configure Output</h3>
                        <p className="wizard-desc">Set the dimensions, quality, and style of your generated images.</p>
                        
                        <div className="wizard-output-grid">
                            <div className="wizard-output-card">
                                <div className="wizard-output-card-header">
                                    <span className="material-symbols-outlined">aspect_ratio</span>
                                    <label>Size / Aspect Ratio</label>
                                </div>
                                <div className="wizard-options-small">
                                    {['1:1', '4:5', '9:16', '16:9', 'custom'].map(size => (
                                        <button 
                                            key={size}
                                            className={`wizard-chip ${selections.output.size === size ? 'active' : ''}`}
                                            onClick={() => setSelections(prev => ({ ...prev, output: { ...prev.output, size } }))}
                                        >
                                            {size === 'custom' ? 'Custom' : size}
                                        </button>
                                    ))}
                                </div>
                                {selections.output.size === 'custom' && (
                                    <div className="wizard-custom-size-row">
                                        <input
                                            type="number"
                                            min="256"
                                            max="2048"
                                            value={selections.output.customWidth}
                                            onChange={(e) => setSelections(prev => ({ ...prev, output: { ...prev.output, customWidth: e.target.value } }))}
                                            placeholder="Width"
                                        />
                                        <span>×</span>
                                        <input
                                            type="number"
                                            min="256"
                                            max="2048"
                                            value={selections.output.customHeight}
                                            onChange={(e) => setSelections(prev => ({ ...prev, output: { ...prev.output, customHeight: e.target.value } }))}
                                            placeholder="Height"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="wizard-output-row">
                                <div className="wizard-output-card wizard-output-card--half">
                                    <div className="wizard-output-card-header">
                                        <span className="material-symbols-outlined">high_quality</span>
                                        <label>Quality</label>
                                    </div>
                                    <select
                                        value={selections.output.quality}
                                        onChange={(e) => setSelections(prev => ({ ...prev, output: { ...prev.output, quality: e.target.value } }))}
                                        className="wizard-filter-select wizard-filter-select--full"
                                    >
                                        <option value="standard">Standard</option>
                                        <option value="hd">HD (High Definition)</option>
                                        <option value="4k">4K (Ultra High Definition)</option>
                                    </select>
                                </div>

                                <div className="wizard-output-card wizard-output-card--half">
                                    <div className="wizard-output-card-header">
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                        <label>Filter</label>
                                    </div>
                                    <select
                                        value={selections.output.filter}
                                        onChange={(e) => setSelections(prev => ({ ...prev, output: { ...prev.output, filter: e.target.value } }))}
                                        className="wizard-filter-select wizard-filter-select--full"
                                    >
                                        <option value="none">None</option>
                                        <option value="vintage">Vintage</option>
                                        <option value="high_fashion">High Fashion</option>
                                        <option value="editorial">Editorial</option>
                                        <option value="street">Street</option>
                                    </select>
                                </div>
                            </div>

                            <div className="wizard-output-card">
                                <div className="wizard-output-card-header">
                                    <span className="material-symbols-outlined">wallpaper</span>
                                    <label>Background</label>
                                </div>
                                <select
                                    value={selections.output.background.startsWith('http') ? 'custom' : selections.output.background}
                                    onChange={(e) => setSelections(prev => ({ ...prev, output: { ...prev.output, background: e.target.value } }))}
                                    className="wizard-filter-select wizard-filter-select--full"
                                >
                                    <option value="auto">Auto</option>
                                    <option value="studio">Studio</option>
                                    <option value="street">Street</option>
                                    <option value="nature">Nature</option>
                                    <option value="custom">Custom Image...</option>
                                </select>
                                
                                {(selections.output.background === 'custom' || selections.output.background.startsWith('http')) && (
                                    <div
                                        className={`wizard-upload-zone ${isUploading ? 'is-uploading' : ''}`}
                                        onClick={() => customBackgroundInputRef.current?.click()}
                                    >
                                        {selections.output.background.startsWith('http') ? (
                                            <div className="wizard-uploaded-bg">
                                                <img src={selections.output.background} alt="Custom Background" className="wizard-uploaded-bg-thumb" />
                                                <span className="material-symbols-outlined">check_circle</span>
                                                <span>Uploaded</span>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined">cloud_upload</span>
                                                <p>{isUploading ? 'Uploading...' : 'Click to upload Custom Background'}</p>
                                            </>
                                        )}
                                        <input
                                            ref={customBackgroundInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="wizard-hidden-input"
                                            onChange={handleCustomBackgroundUpload}
                                            disabled={isUploading}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 5: // Select Template
                return (
                    <div className="wizard-step wizard-template">
                        <h3>Select Template</h3>
                        <p className="wizard-desc">Choose a preset template to quickly configure your shoot, or skip to use your custom settings.</p>
                        <div className="wizard-template-grid">
                            {TEMPLATES.map(tmpl => (
                                <div 
                                    key={tmpl.id}
                                    className={`wizard-template-card ${selections.template === tmpl.id ? 'selected' : ''}`}
                                    onClick={() => {
                                        setSelections(prev => ({ 
                                            ...prev, 
                                            template: tmpl.id,
                                            prompt: tmpl.prompt,
                                            output: {
                                                ...prev.output,
                                                size: tmpl.size,
                                                filter: tmpl.filter,
                                                background: tmpl.background
                                            }
                                        }));
                                    }}
                                >
                                    <div className="wizard-template-icon">
                                        <span className="material-symbols-outlined">auto_awesome_mosaic</span>
                                    </div>
                                    <div className="wizard-template-info">
                                        <span className="wizard-template-label">{tmpl.label}</span>
                                        <span className="wizard-template-meta">{tmpl.size} · {tmpl.filter === 'none' ? 'No filter' : tmpl.filter}</span>
                                    </div>
                                    {selections.template === tmpl.id && (
                                        <span className="wizard-template-check material-symbols-outlined">check_circle</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const isPageLayout = layout === 'page';
    const progressPercentage = Math.round(((currentStep + 1) / STEPS.length) * 100);

    const isNextDisabled = isInvoking
        || (currentStep === 0 && selections.models.length === 0)
        || (currentStep === 3 && !selections.prompt.trim());

    if (isPageLayout) {
        return (
            <div className="onboarding-container">
                <main className="onboarding-main">
                    <div className="step-header">
                        <h2 className="step-headline">{headerTitle}</h2>
                        <p className="step-description">{STEPS[currentStep]?.label}</p>
                    </div>
                    <div key={currentStep} className="wizard-step-wrapper">
                        {renderStepContent()}
                    </div>
                </main>

                <footer className="onboarding-footer">
                    <div className="footer-content">
                        <button className="back-btn" onClick={currentStep === 0 ? onClose : handleBack}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>west</span>
                            Back
                        </button>

                        <div className="footer-actions">
                            <div className="progress-info">
                                <span className="progress-label">Step {currentStep + 1} / {STEPS.length}</span>
                                <div className="progress-bar-track">
                                    <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }} />
                                </div>
                            </div>
                            <button
                                className="continue-btn"
                                onClick={handleNext}
                                disabled={isNextDisabled}
                            >
                                <span className="btn-text">
                                    {isInvoking ? 'Starting...' : (currentStep === STEPS.length - 1 ? 'Start Shoot' : 'Continue')}
                                </span>
                            </button>
                        </div>
                    </div>
                </footer>
            </div>
        );
    }

    const wizardContent = (
        <div className="campaign-wizard-shell">
            <div className="wizard-header">
                <h2>{headerTitle}</h2>
                <button className="wizard-close-btn" onClick={onClose}>
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            <div className="wizard-progress">
                {STEPS.map((step, index) => (
                    <div key={step.id} className={`wizard-progress-step ${index <= currentStep ? 'active' : ''} ${index === currentStep ? 'current' : ''}`}>
                        <div className="step-circle">{index < currentStep ? '✓' : index + 1}</div>
                        <span className="step-label">{step.label}</span>
                    </div>
                ))}
            </div>

            <div className="wizard-body">
                {renderStepContent()}
            </div>

            <div className="wizard-footer">
                <Button
                    variant="secondary"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                >
                    Back
                </Button>

                <div className="wizard-footer-right">
                    <span className="wizard-cost-preview">
                        Estimated cost: <strong>{selections.models.length * 5} credits</strong> per prompt
                    </span>
                    <Button
                        variant="primary"
                        onClick={handleNext}
                        disabled={isNextDisabled}
                    >
                        {isInvoking ? 'Starting...' : (currentStep === STEPS.length - 1 ? 'Start Shoot' : 'Continue')}
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="campaign-wizard-overlay">
            <div className="campaign-wizard-modal">
                {wizardContent}
            </div>
        </div>
    );
};
