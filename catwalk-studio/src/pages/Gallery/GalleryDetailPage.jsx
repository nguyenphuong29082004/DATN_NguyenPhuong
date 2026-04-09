import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useGalleryItem, useLikeGalleryItem, useGalleryLikeState } from '../../hooks/gallery/useGallery';
import { LandingHeader, LandingFooter } from '../../components/landing';
import './GalleryDetailPage.css';

const GalleryDetailPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();

    const { item, isLoading } = useGalleryItem(slug);
    const { likeItemAsync } = useLikeGalleryItem();
    const { likedIds, toggleLike, userId } = useGalleryLikeState();

    const isLiked = likedIds.has(item?.id);
    const [likeDelta, setLikeDelta] = useState(0);
    const [showEmbedModal, setShowEmbedModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState('');

    const localLikeCount = (item?.likesCount || 0) + likeDelta;

    const handleLike = async () => {
        if (!item) return;

        const currentlyLiked = likedIds.has(item.id);
        toggleLike(item.id);
        
        const newDelta = currentlyLiked ? likeDelta - 1 : likeDelta + 1;
        setLikeDelta(newDelta);

        try {
            await likeItemAsync({ 
                galleryId: item.id, 
                currentLikes: item.likesCount || 0, 
                isLiked: currentlyLiked,
                userId: userId
            });
        } catch (err) {
            console.error(err);
        }
    };

    const getEmbedCode = () => {
        const url = `${window.location.origin}/gallery/${slug}`;
        return `<iframe src="${url}/embed" width="400" height="500" frameborder="0" style="border-radius: 12px;"></iframe>`;
    };

    const copyToClipboard = async (text, type) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopySuccess(type);
            setTimeout(() => setCopySuccess(''), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    const getShareUrls = () => {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(item?.title || 'Check out this AI fashion creation');

        return {
            twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            pinterest: `https://pinterest.com/pin/create/button/?url=${url}&description=${title}`,
            linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`,
        };
    };

    const handleRecreate = () => {
        if (!item) return;
        const params = new URLSearchParams({
            prompt: item.promptText || '',
            model_id: item.modelId || '',
        });
        navigate(`/studio/launch/quick-shoot?${params.toString()}`);
    };

    if (isLoading) {
        return (
            <div className="gallery-detail-page">
                <LandingHeader />
                <main className="gallery-detail-main">
                    <div className="gallery-detail-loading">
                        <div className="spinner-large"></div>
                        <p>Loading...</p>
                    </div>
                </main>
                <LandingFooter />
            </div>
        );
    }

    if (!item) {
        return (
            <div className="gallery-detail-page">
                <LandingHeader />
                <main className="gallery-detail-main">
                    <div className="gallery-detail-error">
                        <span className="material-symbols-outlined">error</span>
                        <h2>Item not found</h2>
                        <p>This gallery item may have been removed or made private.</p>
                        <Link to="/gallery" className="btn-back">
                            <span className="material-symbols-outlined thin-icon">arrow_back</span>
                            Back to Gallery
                        </Link>
                    </div>
                </main>
                <LandingFooter />
            </div>
        );
    }

    const shareUrls = getShareUrls();

    return (
        <div className="gallery-detail-page">
            <Helmet>
                <title>{item.title || 'Fashion Creation'} | Catwalk.AI Gallery</title>
                <meta name="description" content={item.promptText ? `"${item.promptText.substring(0, 160)}..." AI fashion creation on Catwalk.ai` : 'View this amazing AI fashion creation.'} />
                <meta property="og:title" content={`${item.title || 'AI Fashion'} | Catwalk.AI`} />
                <meta property="og:description" content={item.promptText?.substring(0, 200)} />
                <meta property="og:image" content={item.outputUrl} />
                <meta property="og:type" content={item.outputType === 'video' ? 'video.other' : 'website'} />
                <meta name="twitter:card" content="summary_large_image" />
                <link rel="canonical" href={`${window.location.origin}/gallery/${slug}`} />
            </Helmet>
            <LandingHeader />

            <main className="gallery-detail-main">
                <div className="gallery-detail-container">
                    {/* Back button */}
                    <Link to="/gallery" className="back-link">
                        <span className="material-symbols-outlined thin-icon">arrow_back</span>
                        Back to Gallery
                    </Link>

                    <div className="gallery-detail-content">
                        {/* Media Section */}
                        <div className="gallery-detail-media">
                            {item.outputType === 'video' ? (
                                <video
                                    src={item.outputUrl}
                                    controls
                                    autoPlay
                                    loop
                                    muted
                                />
                            ) : (
                                <img
                                    src={item.outputUrl}
                                    alt={item.title || 'Gallery item'}
                                />
                            )}
                        </div>

                        {/* Info Section */}
                        <div className="gallery-detail-info">
                            <h1>{item.title || 'Untitled'}</h1>

                            {/* Creator info */}
                            <div className="creator-info">
                                {item.models?.profile_image_url && (
                                    <img
                                        src={item.models.profile_image_url}
                                        alt={item.models.display_name}
                                        className="creator-avatar"
                                    />
                                )}
                                <div className="creator-details">
                                    {(item.users?.username || item.users?.email || item.models?.display_name || item.models?.username) && (
                                        <span className="creator-name">
                                            {item.users?.username || item.users?.email || item.models?.display_name || item.models?.username}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="detail-actions">
                                <button
                                    className={`btn-action btn-like ${isLiked ? 'liked' : ''}`}
                                    onClick={handleLike}
                                >
                                    <span className="material-symbols-outlined">
                                        {isLiked ? 'favorite' : 'favorite_border'}
                                    </span>
                                    <span>{localLikeCount}</span>
                                </button>

                                <button
                                    className="btn-action btn-recreate"
                                    onClick={handleRecreate}
                                >
                                    <span className="material-symbols-outlined thin-icon">replay</span>
                                    Recreate
                                </button>

                                <button
                                    className="btn-action btn-embed"
                                    onClick={() => setShowEmbedModal(true)}
                                >
                                    <span className="material-symbols-outlined thin-icon">code</span>
                                    Embed
                                </button>
                            </div>

                            {/* Generation Details */}
                            <div className="generation-details">
                                <h3>Generation Details</h3>

                                <div className="detail-item">
                                    <span className="detail-label">Prompt</span>
                                    <p className="detail-value prompt-text">{item.promptText}</p>
                                    <button
                                        className="btn-copy"
                                        onClick={() => copyToClipboard(item.promptText, 'prompt')}
                                    >
                                        {copySuccess === 'prompt' ? (
                                            <span className="material-symbols-outlined thin-icon">check</span>
                                        ) : (
                                            <span className="material-symbols-outlined thin-icon">content_copy</span>
                                        )}
                                    </button>
                                </div>

                                {item.parametersJson && (
                                    <div className="parameters-grid">
                                        {item.parametersJson.style && (
                                            <div className="param-item">
                                                <span className="param-label">Style</span>
                                                <span className="param-value">{item.parametersJson.style}</span>
                                            </div>
                                        )}
                                        {item.parametersJson.width && (
                                            <div className="param-item">
                                                <span className="param-label">Size</span>
                                                <span className="param-value">{item.parametersJson.width} × {item.parametersJson.height}</span>
                                            </div>
                                        )}
                                        {item.creditsUsed && (
                                            <div className="param-item">
                                                <span className="param-label">Credits</span>
                                                <span className="param-value">{item.creditsUsed}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Social Share */}
                            <div className="social-share">
                                <h3>Share</h3>
                                <div className="share-buttons">
                                    <a
                                        href={shareUrls.twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="share-btn twitter"
                                    >
                                        𝕏
                                    </a>
                                    <a
                                        href={shareUrls.facebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="share-btn facebook"
                                    >
                                        f
                                    </a>
                                    <a
                                        href={shareUrls.pinterest}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="share-btn pinterest"
                                    >
                                        P
                                    </a>
                                    <button
                                        className="share-btn link"
                                        onClick={() => copyToClipboard(window.location.href, 'link')}
                                    >
                                        {copySuccess === 'link' ? (
                                            <span className="material-symbols-outlined thin-icon">check</span>
                                        ) : (
                                            <span className="material-symbols-outlined thin-icon">link</span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Meta */}
                            <div className="item-meta">
                                <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Embed Modal */}
            {showEmbedModal && (
                <div className="modal-overlay" onClick={() => setShowEmbedModal(false)}>
                    <div className="modal modal-embed" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Embed This Creation</h2>
                            <button className="modal-close" onClick={() => setShowEmbedModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Copy and paste this code to embed on your website:</p>
                            <div className="embed-code-container">
                                <code>{getEmbedCode()}</code>
                                <button
                                    className="btn-copy-embed"
                                    onClick={() => copyToClipboard(getEmbedCode(), 'embed')}
                                >
                                    {copySuccess === 'embed' ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <div className="embed-preview">
                                <h4>Preview</h4>
                                <div className="embed-preview-frame">
                                    <img src={item.outputUrl} alt="Preview" />
                                    <div className="embed-preview-info">
                                        <span>{item.title}</span>
                                        <small>via Catwalk.AI</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <LandingFooter />
        </div>
    );
};

export default GalleryDetailPage;
