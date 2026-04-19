import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { getSupabaseClient } from '../../../infrastructure/supabase/supabase.client';
import './AssetsLibrary.css';

const FILTERS = [
    { key: 'all', label: 'All Assets' },
    { key: 'quick_shoot', label: 'Quick Shoot' },
    { key: 'try_on', label: 'Try On' },
    { key: 'video', label: 'Video' },
];

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const isVideoAsset = (asset) => {
    if (!asset) return false;
    if (asset.generation_type === 'video') return true;
    return typeof asset.output_type === 'string' && asset.output_type.startsWith('video');
};

const AssetsLibrary = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState('all');

    const { data: assets = [], isLoading, error } = useQuery({
        queryKey: ['studio-assets', user?.id],
        enabled: !!user?.id,
        queryFn: async () => {
            const supabase = getSupabaseClient();
            const { data, error: fetchError } = await supabase
                .from('generations')
                .select('id, campaign_id, prompt_text, output_url, output_type, generation_type, type, status, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(200);

            if (fetchError) throw new Error(fetchError.message);
            return (data || []).filter(item => item.output_url);
        },
    });

    const filteredAssets = useMemo(() => {
        if (activeFilter === 'all') return assets;
        if (activeFilter === 'video') return assets.filter(isVideoAsset);
        return assets.filter(asset => asset.type === activeFilter);
    }, [activeFilter, assets]);

    return (
        <div className="assets-library-page">
            <main className="assets-library-main">
                <div className="step-header">
                    <h2>Library</h2>
                    <p>All your generated images and videos in one place.</p>
                </div>

                <div className="assets-library-toolbar">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter.key}
                            className={`assets-filter-chip ${activeFilter === filter.key ? 'active' : ''}`}
                            onClick={() => setActiveFilter(filter.key)}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {isLoading && (
                    <div className="assets-empty-state">
                        <span className="material-symbols-outlined">hourglass_empty</span>
                        <h3>Loading assets...</h3>
                    </div>
                )}

                {!isLoading && error && (
                    <div className="assets-empty-state">
                        <span className="material-symbols-outlined">error</span>
                        <h3>Failed to load assets</h3>
                        <p>{error.message}</p>
                    </div>
                )}

                {!isLoading && !error && filteredAssets.length === 0 && (
                    <div className="assets-empty-state">
                        <span className="material-symbols-outlined">perm_media</span>
                        <h3>No assets yet</h3>
                        <p>Generate content in Quick Shoot or Try On and it will appear here.</p>
                    </div>
                )}

                {!isLoading && !error && filteredAssets.length > 0 && (
                    <div className="assets-grid">
                        {filteredAssets.map((asset) => (
                            <article key={asset.id} className="asset-card">
                                <div className="asset-preview">
                                    {isVideoAsset(asset) ? (
                                        <video src={asset.output_url} controls preload="metadata" />
                                    ) : (
                                        <img src={asset.output_url} alt={asset.prompt_text || 'Generated asset'} loading="lazy" />
                                    )}
                                </div>
                                <div className="asset-card-body">
                                    <div className="asset-card-meta">
                                        <span className="asset-chip">{asset.type || 'generation'}</span>
                                        <span className={`asset-chip asset-chip--status asset-chip--${asset.status || 'pending'}`}>
                                            {asset.status || 'pending'}
                                        </span>
                                    </div>
                                    <p className="asset-prompt">{asset.prompt_text || 'No prompt available'}</p>
                                    <div className="asset-card-footer">
                                        <span>{formatDate(asset.created_at)}</span>
                                        <div className="asset-actions">
                                            {asset.campaign_id && (
                                                <button
                                                    className="asset-link-btn"
                                                    onClick={() => navigate(`/studio/create-campaign/${asset.campaign_id}`)}
                                                >
                                                    Campaign
                                                </button>
                                            )}
                                            <a
                                                className="asset-link-btn"
                                                href={asset.output_url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Open
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AssetsLibrary;
