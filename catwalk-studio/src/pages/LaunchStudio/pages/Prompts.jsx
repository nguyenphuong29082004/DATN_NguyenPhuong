import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton } from '../../../components/common/Button/Button';
import { Modal } from '../../../components/common/Modal/Modal';
import { useAuth } from '../../../hooks/useAuth';
import {
    useUserPromptsInfinite,
    usePublicPromptsInfinite,
    useCreatePrompt,
    useDeletePrompt,
} from '../../../hooks/prompts/usePrompts';
import { PROMPT_CATEGORY_OPTIONS } from './promptCategoryOptions';
import { useLanguage } from '../../../contexts/LanguageContext';
import './Prompts.css';

const PromptCard = ({ prompt, isOwner, onUse, onDelete, t }) => (
    <div className="prompt-card">
        <div className="prompt-card__header">
            <h3>{prompt.name}</h3>
            <div className="prompt-card__actions">
                {isOwner && (
                    <IconButton icon="delete" variant="ghost" onClick={onDelete} title={t('common.delete')} />
                )}
            </div>
        </div>
        <div className="prompt-card__body">
            <div className="prompt-preview" title={prompt.promptText}>
                <p>{prompt.promptText}</p>
            </div>
            {prompt.negativePrompt && (
                <div className="negative-preview" title={prompt.negativePrompt}>
                    <span className="label">{t('prompts.negativePrompt')}:</span>
                    <p>{prompt.negativePrompt}</p>
                </div>
            )}
            <div className="preset-info">
                <span>{prompt.parametersJson?.width || 1024} x {prompt.parametersJson?.height || 1024}</span>
                {prompt.category && <span className="category-badge">{prompt.category}</span>}
            </div>
        </div>
        <div className="prompt-card__footer">
            <Button variant="outline" size="sm" icon="play_arrow" fullWidth onClick={() => onUse(prompt)}>{t('prompts.useTemplate')}</Button>
        </div>
    </div>
);

const ITEMS_PER_PAGE = 20;

const Prompts = () => {
    const { user, isGuest } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const userId = user?.id;

    const {
        prompts: myPrompts,
        isLoading: myLoading,
        error: myError,
        hasNextPage: hasMoreMy,
        isFetchingNextPage: isFetchingMoreMy,
        fetchNextPage: fetchNextMy,
    } = useUserPromptsInfinite(userId, { pageSize: ITEMS_PER_PAGE });
    const {
        prompts: platformPrompts,
        isLoading: platformLoading,
        error: platformError,
        hasNextPage: hasMorePlatform,
        isFetchingNextPage: isFetchingMorePlatform,
        fetchNextPage: fetchNextPlatform,
    } = usePublicPromptsInfinite({ pageSize: ITEMS_PER_PAGE });
    const { createPrompt, isCreating } = useCreatePrompt();
    const { deletePromptAsync, isDeleting } = useDeletePrompt();

    const isLoading = myLoading || platformLoading;
    const error = myError || platformError;

    const [showAddForm, setShowAddForm] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, name }

    const platformSentinelRef = useRef(null);
    const mySentinelRef = useRef(null);

    // IntersectionObserver for my items infinite scroll
    useEffect(() => {
        const sentinel = mySentinelRef.current;
        if (!sentinel || !hasMoreMy) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isFetchingMoreMy) {
                    fetchNextMy();
                }
            },
            { rootMargin: '200px' }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMoreMy, isFetchingMoreMy, fetchNextMy]);

    // IntersectionObserver for platform items infinite scroll
    useEffect(() => {
        const sentinel = platformSentinelRef.current;
        if (!sentinel || !hasMorePlatform) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isFetchingMorePlatform) {
                    fetchNextPlatform();
                }
            },
            { rootMargin: '200px' }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMorePlatform, isFetchingMorePlatform, fetchNextPlatform]);
    const [newPrompt, setNewPrompt] = useState({
        name: '',
        category: PROMPT_CATEGORY_OPTIONS[0]?.value || '',
        prompt: '',
        negativePrompt: '',
        presets: { width: 1024, height: 1024 }
    });

    const handleAddPrompt = () => {
        if (!newPrompt.name.trim() || !newPrompt.prompt.trim() || !userId) return;

        createPrompt({
            userId,
            name: newPrompt.name.trim(),
            category: newPrompt.category || null,
            promptText: newPrompt.prompt.trim(),
            negativePrompt: newPrompt.negativePrompt.trim() || null,
            parametersJson: newPrompt.presets,
        });

        setNewPrompt({
            name: '',
            category: PROMPT_CATEGORY_OPTIONS[0]?.value || '',
            prompt: '',
            negativePrompt: '',
            presets: { width: 1024, height: 1024 }
        });
        setShowAddForm(false);
    };

    const handleDeletePrompt = (prompt) => {
        setDeleteConfirm({ id: prompt.id, name: prompt.name });
    };

    const confirmDelete = async () => {
        if (!userId || !deleteConfirm) return;
        try {
            await deletePromptAsync({ promptId: deleteConfirm.id, userId });
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Failed to delete prompt:', error);
        }
    };

    const handleUsePrompt = (prompt) => {
        navigate(`/studio/quick-shoot?prompt_id=${prompt.id}`);
    };

    return (
        <div className="prompts-page">
            <main className="prompts-main">
                <div className="step-header">
                    <h2>{t('prompts.title')}</h2>
                    <p>{t('prompts.subtitle')}</p>
                </div>

                <div className="prompts-toolbar">
                    {!isGuest && (
                        <Button variant="primary" size="md" icon="add" onClick={() => setShowAddForm(true)}>{t('prompts.newTemplate')}</Button>
                    )}
                </div>

                {/* Add Form Modal */}
                <Modal
                    open={showAddForm}
                    onClose={() => setShowAddForm(false)}
                    title={t('prompts.newTemplate')}
                    footer={
                        <>
                            <Button variant="secondary" size="md" onClick={() => setShowAddForm(false)}>{t('common.cancel')}</Button>
                            <Button variant="primary" size="md" onClick={handleAddPrompt} disabled={!newPrompt.name.trim() || !newPrompt.prompt.trim() || isCreating}>
                                {isCreating ? t('common.loading') : t('prompts.saveTemplate')}
                            </Button>
                        </>
                    }
                >
                    <div className="form-group">
                        <label>{t('prompts.templateName')}</label>
                        <input
                            type="text"
                            placeholder={t('prompts.templateNamePlaceholder')}
                            value={newPrompt.name}
                            onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('prompts.category')}</label>
                        <select
                            value={newPrompt.category}
                            onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                        >
                            {PROMPT_CATEGORY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{t('prompts.prompt')}</label>
                        <textarea
                            placeholder={t('prompts.promptPlaceholder')}
                            value={newPrompt.prompt}
                            onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })}
                            rows="4"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('prompts.negativePrompt')} <span className="optional">{t('common.optional')}</span></label>
                        <textarea
                            placeholder={t('prompts.negativePromptPlaceholder')}
                            value={newPrompt.negativePrompt}
                            onChange={(e) => setNewPrompt({ ...newPrompt, negativePrompt: e.target.value })}
                            rows="2"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('prompts.width')}</label>
                            <input
                                type="number"
                                value={newPrompt.presets.width}
                                onChange={(e) => setNewPrompt({
                                    ...newPrompt,
                                    presets: { ...newPrompt.presets, width: parseInt(e.target.value) }
                                })}
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('prompts.height')}</label>
                            <input
                                type="number"
                                value={newPrompt.presets.height}
                                onChange={(e) => setNewPrompt({
                                    ...newPrompt,
                                    presets: { ...newPrompt.presets, height: parseInt(e.target.value) }
                                })}
                            />
                        </div>
                    </div>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal
                    open={!!deleteConfirm}
                    onClose={() => setDeleteConfirm(null)}
                    title={t('prompts.confirmDelete')}
                    footer={
                        <>
                            <Button variant="secondary" size="md" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</Button>
                            <Button variant="danger" size="md" onClick={confirmDelete} disabled={isDeleting}>
                                {isDeleting ? t('common.loading') : t('common.delete')}
                            </Button>
                        </>
                    }
                >
                    <p>{t('prompts.deleteConfirmMessage').replace('{name}', deleteConfirm?.name)}</p>
                    <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>{t('prompts.cannotBeUndone')}</p>
                </Modal>

                {/* Loading State */}
                {isLoading && (
                    <div className="prompts-empty">
                        <span className="material-symbols-outlined">hourglass_empty</span>
                        <h3>{t('prompts.loadingTemplates')}</h3>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="prompts-empty">
                        <span className="material-symbols-outlined">error</span>
                        <h3>{t('prompts.failedToLoad')}</h3>
                        <p>{error.message}</p>
                    </div>
                )}

                {/* My Templates Section */}
                {!isLoading && !error && (
                    <>
                        {/* My Templates Section - only for logged-in users */}
                        {!isGuest && (
                            <div className="prompts-section">
                                <h3 className="prompts-section__title">
                                    <span className="material-symbols-outlined">person</span>
                                    {t('prompts.myTemplates')}
                                </h3>
                                {myPrompts.length > 0 ? (
                                    <>
                                        <div className="prompts-grid">
                                            {myPrompts.map(prompt => (
                                                <PromptCard
                                                    key={prompt.id}
                                                    prompt={prompt}
                                                    isOwner
                                                    onUse={handleUsePrompt}
                                                    onDelete={() => handleDeletePrompt(prompt)}
                                                    t={t}
                                                />
                                            ))}
                                        </div>
                                        {hasMoreMy && (
                                            <div className="prompts-load-more" ref={mySentinelRef}>
                                                <span className="spinner" />
                                                <span>{t('prompts.loadingTemplates')}</span>
                                            </div>
                                        )}
                                        <p className="prompts-item-count">
                                            {t('prompts.loadedTemplates').replace('{count}', myPrompts.length)}
                                        </p>
                                    </>
                                ) : (
                                    <div className="prompts-empty prompts-empty--compact">
                                        <span className="material-symbols-outlined">edit_note</span>
                                        <p>{t('prompts.noSavedTemplates')}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Platform Templates Section */}
                        {platformPrompts.length > 0 && (
                            <div className="prompts-section">
                                <h3 className="prompts-section__title">
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                    {t('prompts.platformTemplates')}
                                </h3>
                                <div className="prompts-grid">
                                    {platformPrompts.map(prompt => (
                                        <PromptCard
                                            key={prompt.id}
                                            prompt={prompt}
                                            isOwner={false}
                                            onUse={handleUsePrompt}
                                            onDelete={handleDeletePrompt}
                                            isDeleting={isDeleting}
                                            t={t}
                                        />
                                    ))}
                                </div>
                                {hasMorePlatform && (
                                    <div className="prompts-load-more" ref={platformSentinelRef}>
                                        <span className="spinner" />
                                        <span>{t('prompts.loadingTemplates')}</span>
                                    </div>
                                )}
                                <p className="prompts-item-count">
                                    {t('prompts.loadedTemplates').replace('{count}', platformPrompts.length)}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default Prompts;
