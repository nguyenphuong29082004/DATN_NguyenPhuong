import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQueryClient } from '@tanstack/react-query';
import { useGalleryItems, useLikeGalleryItem, useGalleryLikeState } from '../../hooks/gallery/useGallery';
import { LandingHeader, LandingFooter } from '../../components/landing';
import './GalleryPage.css';

const GalleryPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const [page, setPage] = useState(0);
    const itemsPerPage = 20;

    const [activeType, setActiveType] = useState(searchParams.get('type') || 'all');
    const [activeStyle, setActiveStyle] = useState(searchParams.get('style') || 'all');

    const { likedIds, toggleLike, userId } = useGalleryLikeState();
    const [likeCounts, setLikeCounts] = useState({});

    const { items: pageItems, hasMore, isLoading } = useGalleryItems({
        page,
        limit: itemsPerPage,
        type: activeType,
        style: activeStyle,
    });

    const { likeItemAsync } = useLikeGalleryItem();

    const allItems = useMemo(() => {
        if (page === 0 && pageItems.length === 0) {
            return [];
        }

        const mergedItems = [];
        const seenIds = new Set();

        for (let currentPage = 0; currentPage <= page; currentPage += 1) {
            const cached = queryClient.getQueryData(['gallery', 'generations', currentPage, itemsPerPage, activeType, activeStyle]);
            const items = cached?.items || [];

            for (const item of items) {
                if (seenIds.has(item.id)) continue;
                seenIds.add(item.id);
                mergedItems.push({
                    ...item,
                    likesCount: likeCounts[item.id] ?? item.likesCount,
                });
            }
        }

        return mergedItems;
    }, [activeStyle, activeType, likeCounts, itemsPerPage, page, pageItems, queryClient]);

    const filterTypes = [
        { id: 'all', label: t('gallery.filters.all'), icon: 'apps' },
        { id: 'photo', label: t('gallery.filters.photos'), icon: 'photo' },
        { id: 'video', label: t('gallery.filters.videos'), icon: 'videocam' },
    ];

    const filterStyles = [
        { id: 'all', label: t('gallery.filters.allStyles') },
        { id: 'editorial', label: t('marketplace.categories.editorial') },
        { id: 'commercial', label: t('marketplace.categories.commercial') },
        { id: 'streetwear', label: t('marketplace.categories.streetwear') },
        { id: 'try-on', label: 'Virtual Try-On' },
        { id: 'high-fashion', label: t('gallery.filters.highFashion', 'High Fashion') },
        { id: 'minimalist', label: t('marketplace.categories.minimalist') },
    ];

    const loadMore = () => {
        setPage(prev => prev + 1);
    };

    const handleTypeChange = (type) => {
        setActiveType(type);
        setPage(0);
        setLikeCounts({});
        const params = new URLSearchParams(searchParams);
        if (type === 'all') {
            params.delete('type');
        } else {
            params.set('type', type);
        }
        setSearchParams(params);
    };

    const handleStyleChange = (style) => {
        setActiveStyle(style);
        setPage(0);
        setLikeCounts({});
        const params = new URLSearchParams(searchParams);
        if (style === 'all') {
            params.delete('style');
        } else {
            params.set('style', style);
        }
        setSearchParams(params);
    };

    const handleLike = async (item) => {
        const wasLiked = likedIds.has(item.id);
        toggleLike(item.id);

        const currentCount = likeCounts[item.id] ?? (item.likesCount || 0);
        const newCount = wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
        setLikeCounts(prev => ({ ...prev, [item.id]: newCount }));

        try {
            await likeItemAsync({ 
                galleryId: item.id, 
                currentLikes: currentCount, 
                isLiked: wasLiked,
                userId: userId
            });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="gallery-page">
            <Helmet>
                <title>Community Gallery | Catwalk.AI Fashion Discoveries</title>
                <meta name="description" content="Discover stunning AI-generated fashion creations from our community. Browse editorial, streetwear, and commercial fashion photography on Catwalk.ai." />
                <meta property="og:title" content="Community Gallery | Catwalk.AI" />
                <meta property="og:description" content="Explore the future of fashion. AI-generated photography and videos from our top creators." />
                <meta property="og:type" content="website" />
                <link rel="canonical" href={`${window.location.origin}/gallery`} />
            </Helmet>
            <LandingHeader />

            <main className="gallery-main">
                <div className="gallery-container">
                    {/* Header */}
                    <header className="gallery-header">
                        <h1>{t('gallery.header.title')}</h1>
                        <p>{t('gallery.header.subtitle')}</p>
                    </header>

                    {/* Filters */}
                    <div className="gallery-filters">
                        <div className="filter-group">
                            <span className="filter-label">{t('gallery.filters.type')}</span>
                            <div className="filter-buttons">
                                {filterTypes.map(type => (
                                    <button
                                        key={type.id}
                                        className={`filter-btn ${activeType === type.id ? 'active' : ''}`}
                                        onClick={() => handleTypeChange(type.id)}
                                    >
                                        <span className="material-symbols-outlined thin-icon">{type.icon}</span>
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="filter-group">
                            <span className="filter-label">{t('gallery.filters.style')}</span>
                            <select
                                value={activeStyle}
                                onChange={(e) => handleStyleChange(e.target.value)}
                                className="style-select"
                            >
                                {filterStyles.map(style => (
                                    <option key={style.id} value={style.id}>{style.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Masonry Grid */}
                    {isLoading && allItems.length === 0 ? (
                        <div className="gallery-loading">
                            <div className="spinner-large"></div>
                            <p>{t('gallery.states.loading')}</p>
                        </div>
                    ) : allItems.length === 0 ? (
                        <div className="gallery-empty">
                            <span className="material-symbols-outlined">photo_library</span>
                            <h3>{t('gallery.states.empty.title')}</h3>
                            <p>{t('gallery.states.empty.description')}</p>
                            <Link to="/studio/launch/quick-shoot" className="btn-create-first">
                                <span className="material-symbols-outlined thin-icon">add</span>
                                {t('gallery.states.empty.action')}
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="gallery-masonry">
                                {allItems.map(item => (
                                    <div key={item.id} className="gallery-item">
                                        <Link to={`/gallery/${item.id}`} className="gallery-item__image">
                                            <img
                                                src={item.outputUrl}
                                                alt={item.title || t('gallery.filters.all')}
                                                loading={allItems.indexOf(item) === 0 ? "eager" : "lazy"}
                                                fetchPriority={allItems.indexOf(item) === 0 ? "high" : "auto"}
                                            />
                                            {item.outputType === 'video' && (
                                                <span className="video-badge">
                                                    <span className="material-symbols-outlined thin-icon">play_arrow</span>
                                                </span>
                                            )}
                                        </Link>
                                        <div className="gallery-item__info">
                                            <h3>{item.title || 'Untitled'}</h3>
                                            <div className="gallery-item__meta">
                                                {(item.users?.username || item.users?.email) && (
                                                    <span className="model-name">
                                                        <span className="material-symbols-outlined thin-icon">person</span>
                                                        {item.users.username || item.users.email}
                                                    </span>
                                                )}
                                                <button
                                                    className={`like-btn ${likedIds.has(item.id) ? 'liked' : ''}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleLike(item);
                                                    }}
                                                >
                                                    <span className="material-symbols-outlined">
                                                        {likedIds.has(item.id) ? 'favorite' : 'favorite_border'}
                                                    </span>
                                                    <span>{item.likesCount || 0}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Load More */}
                            {hasMore && (
                                <div className="gallery-load-more">
                                    <button
                                        className="btn-load-more"
                                        onClick={loadMore}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="spinner-small"></span>
                                                {t('gallery.footer.loading')}
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined thin-icon">expand_more</span>
                                                {t('gallery.footer.loadMore')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <LandingFooter />
        </div>
    );
};

export default GalleryPage;
