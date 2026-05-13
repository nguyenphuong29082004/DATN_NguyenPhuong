import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useCampaignDetail, useArchiveCampaign, useDeleteCampaign } from '../../../hooks/campaigns/useCampaigns';
import { useAddToGallery } from '../../../hooks/generations/useQuickShoot';
import { useDeleteGeneration } from '../../../hooks/generations/useGenerations';
import { CampaignWizard } from '../components/CampaignWizard/CampaignWizard';
import { Button } from '../../../components/common/Button/Button';
import { SidePanel } from '../../../components/common/SidePanel/SidePanel';
import { Modal } from '../../../components/common/Modal/Modal';
import './CampaignDetail.css';

const CampaignDetail = () => {
    const { campaignId } = useParams();
    const { user, isGuest } = useAuth();
    const navigate = useNavigate();

    const { campaign, generations, isLoading } = useCampaignDetail(campaignId, user?.id);
    const { archiveCampaign, isArchiving } = useArchiveCampaign();
    const { deleteCampaignAsync, isDeleting } = useDeleteCampaign();
    const { deleteGenerationAsync, isDeleting: isDeletingGen } = useDeleteGeneration();
    const { addToGalleryAsync } = useAddToGallery();
    const [showWizard, setShowWizard] = useState(false);
    const [wizardPrefill, setWizardPrefill] = useState(null);
    const [selectedGen, setSelectedGen] = useState(null);
    const [activePanel, setActivePanel] = useState(null);
    const [galleryTitle, setGalleryTitle] = useState('');
    const [galleryDescription, setGalleryDescription] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [genToDelete, setGenToDelete] = useState(null);

    const handleArchive = () => {
        if (!campaign || !user?.id) return;
        archiveCampaign({
            campaignId,
            userId: user.id,
        });
    };

    const handleDelete = async () => {
        if (!campaign || !user?.id) return;
        try {
            await deleteCampaignAsync({
                campaignId,
                userId: user.id,
            });
            navigate('/studio/campaigns');
        } catch (err) {
            console.error('Delete campaign failed', err);
        } finally {
            setShowDeleteConfirm(false);
        }
    };

    const handleDeleteGen = async () => {
        if (!genToDelete || !user?.id) return;
        try {
            await deleteGenerationAsync({
                generationId: genToDelete.id,
                userId: user.id,
                campaignId,
            });
        } catch (err) {
            console.error('Delete generation failed', err);
        } finally {
            setGenToDelete(null);
        }
    };

    const handleNewShoot = () => {
        setWizardPrefill(null);
        setSelectedGen(null);
        setActivePanel(null);
        setShowWizard(true);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleDownload = async (url, format = 'png') => {
        if (!url) return;
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `campaign-${campaignId}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Download failed', err);
        }
    };


    const readSettingsFromGeneration = (gen) => {
        const params = gen.parameters_json || {};
        return {
            models: gen.model_id ? [gen.model_id] : [],
            type: params?.metadata?.shootType || 'photo',
            products: params?.metadata?.products || [],
            prompt: gen.prompt_text || '',
            negativePrompt: params?.negativePrompt || '',
            output: {
                size: params?.metadata?.output?.size || '9:16',
                quality: gen.quality || 'standard',
                filter: params?.metadata?.output?.filter || 'none',
                background: params?.metadata?.output?.background || 'auto',
                customWidth: params?.metadata?.output?.customWidth || gen.width || 1080,
                customHeight: params?.metadata?.output?.customHeight || gen.height || 1350,
            },
            template: params?.metadata?.template || null,
            sourceGenerationId: gen.id,
        };
    };

    const handleRemixGen = (gen) => {
        setWizardPrefill(readSettingsFromGeneration(gen));
        setSelectedGen(null);
        setActivePanel(null);
        setShowWizard(true);
    };

    const handleShareGen = async (gen) => {
        const shareUrl = `${window.location.origin}/studio/create-campaign/${campaignId}?generation=${gen.id}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    };

    const handleOpenPrompt = (gen) => {
        setSelectedGen(gen);
        setActivePanel('prompt');
    };

    const handleOpenGallery = (gen) => {
        setSelectedGen(gen);
        setGalleryTitle('');
        setGalleryDescription('');
        setActivePanel('gallery');
    };

    const handleConfirmGallery = async () => {
        if (!selectedGen?.id) return;
        const title = galleryTitle.trim();
        if (!title) return;

        try {
            await addToGalleryAsync({
                generationId: selectedGen.id,
                title,
                description: galleryDescription.trim() || null,
                tags: [],
                typeLabel: 'campaign',
                username: user?.email || null,
            });
            setActivePanel(null);
        } catch (err) {
            console.error('Add to gallery failed', err);
        }
    };

    if (isLoading) {
        return (
            <div className="campaign-detail">
                <div className="campaign-detail__loading">
                    <div className="spinner" />
                    <p>Loading campaign...</p>
                </div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="campaign-detail">
                <div className="campaign-detail__not-found">
                    <span className="material-symbols-outlined">error_outline</span>
                    <h3>Campaign not found</h3>
                    <button className="btn-secondary" onClick={() => navigate('/studio/campaigns')}>
                    Back to Campaigns
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="campaign-detail">
            {!showWizard && (
                <div className="campaign-detail__container">
                {/* Back Navigation */}
                <button
                    className="campaign-detail__back"
                    onClick={() => navigate('/studio/campaigns')}
                    >
                    <span className="material-symbols-outlined">arrow_back</span>
                    All Campaigns
                </button>

                {/* Campaign Header */}
                <header className="campaign-detail__header">
                    <div className="campaign-detail__header-left">
                        <div className="campaign-detail__title-row">
                            <span className="material-symbols-outlined campaign-detail__folder-icon">folder</span>
                            <h1>{campaign.name}</h1>
                            <span className={`campaign-detail__status campaign-detail__status--${campaign.status}`}>
                                {campaign.status}
                            </span>
                        </div>
                        {campaign.details && (
                            <p className="campaign-detail__description">{campaign.details}</p>
                        )}
                        <span className="campaign-detail__date">
                            Created {formatDate(campaign.created_at)}
                        </span>
                    </div>
                    <div className="campaign-detail__header-actions">
                        <Button
                            variant="primary"
                            icon="auto_awesome"
                            onClick={handleNewShoot}
                            title="Start a new shoot in this campaign"
                        >
                            New Shoot
                        </Button>
                        <button
                            className="btn-icon"
                            onClick={handleArchive}
                            disabled={isArchiving}
                            style={{ padding: '12px' }}
                            title={campaign.status === 'active' ? 'Archive' : 'Reactivate'}
                        >
                            <span className="material-symbols-outlined">
                                {campaign.status === 'active' ? 'archive' : 'unarchive'}
                            </span>
                        </button>
                        <button
                            className="btn-icon"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isDeleting}
                            style={{ padding: '12px', color: 'var(--color-error, #ef4444)' }}
                            title="Delete campaign"
                        >
                            <span className="material-symbols-outlined">delete</span>
                        </button>
                    </div>
                </header>

                {/* Stats Bar */}
                <div className="campaign-detail__stats">
                    <div className="campaign-detail__stat">
                        <span className="material-symbols-outlined">image</span>
                        <div>
                            <span className="stat-value">{generations.length}</span>
                            <span className="stat-label">Generations</span>
                        </div>
                    </div>
                </div>

                {/* Generations Grid */}
                <section className="campaign-detail__content">
                    <div className="campaign-detail__content-header">
                        <h2>Content</h2>
                    </div>

                    {generations.length === 0 ? (
                        <div className="campaign-detail__empty">
                            <span className="material-symbols-outlined">auto_awesome</span>
                            <h3>No content yet</h3>
                            <p>Start generating content for this campaign</p>
                            <Button variant="primary" onClick={handleNewShoot} icon="auto_awesome">
                                New Shoot
                            </Button>
                        </div>
                    ) : (
                        <div className="campaign-results-grid">
                            {generations.map((gen) => (
                                <div key={gen.id} className={`campaign-gen-card ${gen.status}`}>
                                    <div className="campaign-gen-card__image-container">
                                        {gen.status === 'completed' && gen.output_url ? (
                                            <img
                                                src={gen.output_url}
                                                alt="Generated content"
                                                className="campaign-gen-card__image"
                                            />
                                        ) : gen.status === 'processing' || gen.status === 'pending' ? (
                                            <div className="campaign-gen-card__placeholder processing">
                                                <div className="spinner"></div>
                                                <span>Processing...</span>
                                            </div>
                                        ) : (
                                            <div className="campaign-gen-card__placeholder failed">
                                                <span className="material-symbols-outlined">error</span>
                                                <span>Failed</span>
                                                <button className="icon-btn" onClick={() => setGenToDelete(gen)} title="Delete" style={{ color: 'var(--color-error, #ef4444)', marginTop: '8px' }}>
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                        )}
                                        
                                        {/* Overlay Actions */}
                                        {gen.status === 'completed' && gen.output_url && (
                                            <div className="campaign-gen-card__overlay">
                                                <button className="icon-btn" onClick={() => handleDownload(gen.output_url)} title="Download">
                                                    <span className="material-symbols-outlined">download</span>
                                                </button>
                                                <button className="icon-btn" onClick={() => handleRemixGen(gen)} title="Remix">
                                                    <span className="material-symbols-outlined">refresh</span>
                                                </button>
                                                <button className="icon-btn" onClick={() => handleShareGen(gen)} title="Share">
                                                    <span className="material-symbols-outlined">share</span>
                                                </button>
                                                <button className="icon-btn" onClick={() => handleOpenGallery(gen)} title="Add to Gallery">
                                                    <span className="material-symbols-outlined">add_photo_alternate</span>
                                                </button>
                                                <button className="icon-btn" onClick={() => setGenToDelete(gen)} title="Delete" style={{ color: 'var(--color-error, #ef4444)' }}>
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>

                                            </div>
                                        )}
                                    </div>
                                    <div className="campaign-gen-card__info">
                                        <div className="campaign-gen-card__model">
                                            {gen.models?.profile_image_url ? (
                                                <img src={gen.models.profile_image_url} alt="Model" />
                                            ) : (
                                                <span className="material-symbols-outlined">face</span>
                                            )}
                                            <span>{gen.models?.display_name || 'Unknown Model'}</span>
                                        </div>
                                        <button className="campaign-gen-card__prompt" title={gen.prompt_text} onClick={() => handleOpenPrompt(gen)}>
                                            {gen.prompt_text}
                                        </button>
                                        <div className="campaign-gen-card__meta">
                                            <span className="meta-badge">{gen.type === 'quick_shoot' ? 'Photo' : gen.type}</span>
                                            <span className="meta-badge credits">
                                                <span className="material-symbols-outlined">generating_tokens</span>
                                                {gen.credits_used}
                                            </span>
                                            <span className="meta-date">{formatDate(gen.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
                </div>
            )}

            {showWizard && (
                <div className="campaign-detail__wizard-stage">
                    <CampaignWizard
                        campaignId={campaignId}
                        initialSelections={wizardPrefill}
                        layout="page"
                        headerTitle={wizardPrefill ? 'Remix Shoot' : 'New Campaign Shoot'}
                        onClose={() => {
                            setShowWizard(false);
                            setWizardPrefill(null);
                        }}
                    />
                </div>
            )}

            {selectedGen && (
                <SidePanel
                    open={!!activePanel}
                    onClose={() => setActivePanel(null)}
                    title={activePanel === 'prompt' ? 'Generation Prompt & Settings' : 'Add to Gallery'}
                    footer={activePanel === 'prompt' ? (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => setActivePanel(null)}>Close</Button>
                            <Button variant="primary" size="sm" icon="refresh" onClick={() => {
                                handleRemixGen(selectedGen);
                            }}>
                                Remix (Edit & Rerun)
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => setActivePanel(null)}>Cancel</Button>
                            <Button variant="primary" size="sm" icon="add_photo_alternate" onClick={handleConfirmGallery}>Add to Gallery</Button>
                        </>
                    )}
                >
                    {activePanel === 'prompt' ? (
                        <>
                            <div className="form-group">
                                <label>Prompt</label>
                                <textarea value={selectedGen.prompt_text || ''} readOnly rows={4} />
                            </div>
                            <div className="form-group">
                                <label>Negative Prompt</label>
                                <textarea value={selectedGen.parameters_json?.negativePrompt || ''} readOnly rows={3} />
                            </div>
                            <div className="cm-side-panel__meta">
                                <span>Type: {selectedGen.parameters_json?.metadata?.shootType || 'photo'}</span>
                                <span>Size: {selectedGen.parameters_json?.metadata?.output?.size || '9:16'}</span>
                                <span>Filter: {selectedGen.parameters_json?.metadata?.output?.filter || 'none'}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    value={galleryTitle}
                                    onChange={(e) => setGalleryTitle(e.target.value)}
                                    placeholder="e.g. Summer campaign look"
                                    maxLength={120}
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Description <span className="optional">(optional)</span></label>
                                <textarea
                                    value={galleryDescription}
                                    onChange={(e) => setGalleryDescription(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </>
                    )}
                </SidePanel>
            )}

            <Modal
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                title="Delete Campaign"
                footer={
                    <>
                        <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                        <Button variant="danger" size="sm" icon="delete" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </>
                }
            >
                <p>Are you sure you want to delete <strong>{campaign?.name}</strong>?</p>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '0.875rem' }}>
                    This will permanently delete the campaign, all {generations.length} generation(s), and their associated images. This action cannot be undone.
                </p>
            </Modal>

            <Modal
                open={!!genToDelete}
                onClose={() => setGenToDelete(null)}
                title="Delete Generation"
                footer={
                    <>
                        <Button variant="ghost" size="sm" onClick={() => setGenToDelete(null)}>Cancel</Button>
                        <Button variant="danger" size="sm" icon="delete" onClick={handleDeleteGen} disabled={isDeletingGen}>
                            {isDeletingGen ? 'Deleting...' : 'Delete'}
                        </Button>
                    </>
                }
            >
                <p>Are you sure you want to delete this generation?</p>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '0.875rem' }}>
                    The generated image will be permanently removed from storage. This action cannot be undone.
                </p>
            </Modal>
        </div>
    );
};

export default CampaignDetail;
