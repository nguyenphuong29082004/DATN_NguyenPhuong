import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useUserCampaigns, useCreateCampaign } from '../../../hooks/campaigns/useCampaigns';
import { getSupabaseClient } from '../../../infrastructure/supabase/supabase.client';
import { Button } from '../../../components/common/Button/Button';
import { Modal } from '../../../components/common/Modal/Modal';
import './CreateCampaign.css';

const CampaignCard = ({ campaign, onClick }) => {
    const genCount = campaign.generationCount || 0;

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="campaign-card" onClick={onClick}>
            <div className="campaign-card__header">
                <span className="material-symbols-outlined campaign-card__icon">folder</span>
                <span className={`campaign-card__status campaign-card__status--${campaign.status}`}>
                    {campaign.status}
                </span>
            </div>
            <div className="campaign-card__body">
                <h3>{campaign.name}</h3>
                {campaign.details && (
                    <p className="campaign-card__details">{campaign.details}</p>
                )}
            </div>
            <div className="campaign-card__footer">
                <div className="campaign-card__stat">
                    <span className="material-symbols-outlined">image</span>
                    <span>{genCount} generations</span>
                </div>
                <span className="campaign-card__date">{formatDate(campaign.createdAt || campaign.created_at)}</span>
            </div>
        </div>
    );
};

const CreateCampaign = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { campaigns, isLoading } = useUserCampaigns(user?.id);
    const { createCampaignAsync, isCreating } = useCreateCampaign();
    const fileInputRef = useRef(null);

    const [showCreatePanel, setShowCreatePanel] = useState(false);
    const [formData, setFormData] = useState({ name: '', details: '', brandGuidelinesUrl: '' });
    const [brandGuidelinesFile, setBrandGuidelinesFile] = useState(null);
    const [isUploadingGuidelines, setIsUploadingGuidelines] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async () => {
        if (!user?.id) {
            setError('Please sign in to create a campaign');
            return;
        }

        if (!formData.name.trim()) {
            setError('Campaign name is required');
            return;
        }

        setError('');

        try {
            let uploadedGuidelinesUrl = formData.brandGuidelinesUrl.trim() || null;

            if (brandGuidelinesFile) {
                setIsUploadingGuidelines(true);
                const supabase = getSupabaseClient();
                const fileExt = brandGuidelinesFile.name.split('.').pop();
                const fileName = `guidelines_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('campaign_assets')
                    .upload(filePath, brandGuidelinesFile);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('campaign_assets').getPublicUrl(filePath);
                uploadedGuidelinesUrl = data?.publicUrl || uploadedGuidelinesUrl;
            }

            const result = await createCampaignAsync({
                userId: user.id,
                name: formData.name.trim(),
                details: formData.details.trim() || null,
                brandGuidelinesUrl: uploadedGuidelinesUrl,
            });

            setShowCreatePanel(false);
            setFormData({ name: '', details: '', brandGuidelinesUrl: '' });
            setBrandGuidelinesFile(null);
            navigate(`/studio/create-campaign/${result.id}`);
        } catch (err) {
            console.error('Error creating campaign:', err);
            setError(err.message || 'Failed to create campaign');
        } finally {
            setIsUploadingGuidelines(false);
        }
    };

    return (
        <div className="campaigns-page">
            <main className="campaigns-main">
                <div className="step-header">
                    <h2>Campaigns</h2>
                    <p>Organize your shoots into campaigns — like folders for your creative projects</p>
                </div>

                <div className="campaigns-toolbar">
                    <Button variant="primary" size="md" icon="add" onClick={() => setShowCreatePanel(true)}>
                        New Campaign
                    </Button>
                </div>

                <Modal
                    open={showCreatePanel}
                    onClose={() => setShowCreatePanel(false)}
                    title="Create Campaign"
                    className="campaign-create-modal"
                    footer={(
                        <>
                            <Button variant="secondary" size="md" onClick={() => setShowCreatePanel(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                size="md"
                                onClick={handleCreate}
                                disabled={!formData.name.trim() || isCreating || isUploadingGuidelines}
                                loading={isCreating || isUploadingGuidelines}
                            >
                                {isCreating || isUploadingGuidelines ? 'Creating...' : 'Create Campaign'}
                            </Button>
                        </>
                    )}
                >
                    <div className="form-group">
                        <label>Campaign Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, name: e.target.value }));
                                if (error) setError('');
                            }}
                            placeholder="e.g., Summer 2026, Product Shoot"
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label>Description <span className="optional">(optional)</span></label>
                        <textarea
                            value={formData.details}
                            onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                            placeholder="What's this campaign about?"
                            rows={3}
                        />
                    </div>
                    <div className="form-group">
                        <label>Brand Guidelines Upload <span className="optional">(optional)</span></label>
                        {brandGuidelinesFile ? (
                            <div className="campaign-upload-selected">
                                <div className="campaign-upload-selected__info">
                                    <span className="material-symbols-outlined">description</span>
                                    <div>
                                        <span className="campaign-upload-selected__name">{brandGuidelinesFile.name}</span>
                                        <span className="campaign-upload-selected__meta">{Math.max(1, Math.round(brandGuidelinesFile.size / 1024))} KB</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="campaign-upload-selected__remove"
                                    onClick={() => {
                                        setBrandGuidelinesFile(null);
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                    }}
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="btn-upload-garment campaign-upload-trigger"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <span className="material-symbols-outlined">upload</span>
                                    Upload Brand Guidelines
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                                    onChange={(e) => setBrandGuidelinesFile(e.target.files?.[0] || null)}
                                    hidden
                                />
                            </>
                        )}
                        <p className="campaign-upload-note">PDF, DOC, DOCX, PNG, JPG, JPEG, WEBP</p>
                    </div>
                    <div className="form-group">
                        <label>Brand Guidelines URL <span className="optional">(optional)</span></label>
                        <input
                            type="url"
                            value={formData.brandGuidelinesUrl}
                            onChange={(e) => setFormData(prev => ({ ...prev, brandGuidelinesUrl: e.target.value }))}
                            placeholder="https://example.com/brand-guidelines.pdf"
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                </Modal>

                {/* Loading */}
                {isLoading && (
                    <div className="campaigns-empty">
                        <span className="material-symbols-outlined">hourglass_empty</span>
                        <h3>Loading campaigns...</h3>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && campaigns.length === 0 && (
                    <div className="campaigns-empty">
                        <span className="material-symbols-outlined">folder_open</span>
                        <h3>No campaigns yet</h3>
                        <p>Create your first campaign to start organizing your content</p>
                    </div>
                )}

                {/* Campaign Grid */}
                {!isLoading && campaigns.length > 0 && (
                    <div className="campaigns-grid">
                        {/* New campaign card */}
                        <div className="campaign-card campaign-card--new" onClick={() => setShowCreatePanel(true)}>
                            <span className="material-symbols-outlined">create_new_folder</span>
                            <span>New Campaign</span>
                        </div>

                        {campaigns.map((campaign) => (
                            <CampaignCard
                                key={campaign.id}
                                campaign={campaign}
                                onClick={() => navigate(`/studio/create-campaign/${campaign.id}`)}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default CreateCampaign;
