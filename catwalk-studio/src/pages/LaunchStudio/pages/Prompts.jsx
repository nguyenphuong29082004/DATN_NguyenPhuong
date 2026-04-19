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
import './Prompts.css';

const PromptCard = ({ prompt, isOwner, onUse, onDelete }) => (
    <div className="prompt-card">
        <div className="prompt-card__header">
            <h3>{prompt.name}</h3>
            <div className="prompt-card__actions">
                {isOwner && (
                    <IconButton icon="delete" variant="ghost" onClick={onDelete} title="Delete" />
                )}
            </div>
        </div>
        <div className="prompt-card__body">
            <div className="prompt-preview" title={prompt.promptText}>
                <p>{prompt.promptText}</p>
            </div>
            {prompt.negativePrompt && (
                <div className="negative-preview" title={prompt.negativePrompt}>
                    <span className="label">Negative:</span>
                    <p>{prompt.negativePrompt}</p>
                </div>
            )}
            <div className="preset-info">
                <span>{prompt.parametersJson?.width || 1024} x {prompt.parametersJson?.height || 1024}</span>
                {prompt.category && <span className="category-badge">{prompt.category}</span>}
            </div>
        </div>
        <div className="prompt-card__footer">
            <Button variant="outline" size="sm" icon="play_arrow" fullWidth onClick={() => onUse(prompt)}>Use Template</Button>
        </div>
    </div>
);

const ITEMS_PER_PAGE = 20;

const Prompts = () => {
    const { user, isGuest } = useAuth();
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
                    <h2>Prompt Templates</h2>
                    <p>Save and manage your favorite prompts for quick access</p>
                </div>

                <div className="prompts-toolbar">
                    {!isGuest && (
                        <Button variant="primary" size="md" icon="add" onClick={() => setShowAddForm(true)}>New Template</Button>
                    )}
                </div>

                {/* Add Form Modal */}
                <Modal
                    open={showAddForm}
                    onClose={() => setShowAddForm(false)}
                    title="New Prompt Template"
                    footer={
                        <>
                            <Button variant="secondary" size="md" onClick={() => setShowAddForm(false)}>Cancel</Button>
                            <Button variant="primary" size="md" onClick={handleAddPrompt} disabled={!newPrompt.name.trim() || !newPrompt.prompt.trim() || isCreating}>
                                {isCreating ? 'Saving...' : 'Save Template'}
                            </Button>
                        </>
                    }
                >
                    <div className="form-group">
                        <label>Template Name</label>
                        <input
                            type="text"
                            placeholder="e.g., Editorial Portrait"
                            value={newPrompt.name}
                            onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Category</label>
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
                        <label>Prompt</label>
                        <textarea
                            placeholder="Describe the image style..."
                            value={newPrompt.prompt}
                            onChange={(e) => setNewPrompt({ ...newPrompt, prompt: e.target.value })}
                            rows="4"
                        />
                    </div>
                    <div className="form-group">
                        <label>Negative Prompt <span className="optional">(optional)</span></label>
                        <textarea
                            placeholder="What to avoid..."
                            value={newPrompt.negativePrompt}
                            onChange={(e) => setNewPrompt({ ...newPrompt, negativePrompt: e.target.value })}
                            rows="2"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Width</label>
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
                            <label>Height</label>
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
                    title="Confirm Delete"
                    footer={
                        <>
                            <Button variant="secondary" size="md" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                            <Button variant="danger" size="md" onClick={confirmDelete} disabled={isDeleting}>
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </>
                    }
                >
                    <p>Are you sure you want to delete template <strong>"{deleteConfirm?.name}"</strong>?</p>
                    <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>This action cannot be undone.</p>
                </Modal>

                {/* Loading State */}
                {isLoading && (
                    <div className="prompts-empty">
                        <span className="material-symbols-outlined">hourglass_empty</span>
                        <h3>Loading templates...</h3>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="prompts-empty">
                        <span className="material-symbols-outlined">error</span>
                        <h3>Failed to load templates</h3>
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
                                    My Templates
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
                                                />
                                            ))}
                                        </div>
                                        {hasMoreMy && (
                                            <div className="prompts-load-more" ref={mySentinelRef}>
                                                <span className="spinner" />
                                                <span>Loading more templates...</span>
                                            </div>
                                        )}
                                        <p className="prompts-item-count">
                                            Loaded {myPrompts.length} templates
                                        </p>
                                    </>
                                ) : (
                                    <div className="prompts-empty prompts-empty--compact">
                                        <span className="material-symbols-outlined">edit_note</span>
                                        <p>No saved templates yet. Click "New Template" to create one.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Platform Templates Section */}
                        {platformPrompts.length > 0 && (
                            <div className="prompts-section">
                                <h3 className="prompts-section__title">
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                    Platform Templates
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
                                        />
                                    ))}
                                </div>
                                {hasMorePlatform && (
                                    <div className="prompts-load-more" ref={platformSentinelRef}>
                                        <span className="spinner" />
                                        <span>Loading more templates...</span>
                                    </div>
                                )}
                                <p className="prompts-item-count">
                                    Loaded {platformPrompts.length} templates
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
