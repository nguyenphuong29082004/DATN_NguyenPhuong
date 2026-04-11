import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton } from '../../../components/common/Button/Button';
import { Modal } from '../../../components/common/Modal/Modal';
import { useAuth } from '../../../hooks/useAuth';
import {
    useUserWardrobeItems,
    useUserWardrobeItemsInfinite,
    usePublicWardrobeItemsInfinite,
    useCreateWardrobeItem,
    useDeleteWardrobeItem,
} from '../../../hooks/wardrobe/useWardrobe';
import { useUserCollections, useCreateCollection, useDeleteCollection } from '../../../hooks/designer/useDesigner';
import { useFileUpload } from '../../../hooks/storage/useFileUpload';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getNearestColorName } from '../../../utils/colors';
import './Designer.css';

const ITEMS_PER_PAGE = 20;

const CATEGORIES = [
    { id: 'clothing', label: 'Clothing', icon: 'checkroom' },
    { id: 'accessories', label: 'Accessories', icon: 'watch' },
    { id: 'footwear', label: 'Footwear', icon: 'steps' },
    { id: 'jewellery', label: 'Jewellery', icon: 'diamond' },
];

const ItemCard = ({ item, isOwner, onEdit, onUse, onDelete, onAddToCollection, t }) => (
    <div className="designer-card">
        <div className="designer-card__image">
            {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt={item.altText || item.title} />
            ) : (
                <div className="designer-card__placeholder">
                    <span className="material-symbols-outlined">image</span>
                </div>
            )}
            {item.canBuy && (
                <span className="designer-card__badge designer-card__badge--buy">
                    <span className="material-symbols-outlined">shopping_bag</span>
                </span>
            )}
            <div className="designer-card__overlay">
                {isOwner && (
                    <IconButton icon="edit" variant="ghost" onClick={() => onEdit(item)} title={t('designer.editByPrompt')} />
                )}
                <IconButton icon="photo_camera" variant="ghost" onClick={() => onUse(item)} title={t('quickShoot.title')} />
                {isOwner && onAddToCollection && (
                    <IconButton icon="playlist_add" variant="ghost" onClick={() => onAddToCollection(item)} title={t('designer.addToCollection')} />
                )}
                {isOwner && (
                    <IconButton icon="delete" variant="ghost" className="btn-delete-action" onClick={() => onDelete(item.id)} title={t('common.delete')} />
                )}
            </div>
        </div>
        <div className="designer-card__info">
            <div className="designer-card__meta">
                <h3>{item.title}</h3>
                <span className="designer-card__category">{t(`designer.categories.${item.category}`) || item.category}</span>
                {item.brand && <span className="designer-card__brand">{item.brand}</span>}
            </div>
            {item.colour && (
                <div className="designer-card__colour">
                    {item.colourHex && (
                        <span
                            className="designer-card__colour-dot"
                            style={{ backgroundColor: item.colourHex }}
                        />
                    )}
                    {item.colour}
                </div>
            )}
        </div>
    </div>
);

const CollectionCard = ({ collection, onView, onDelete, itemCount, t }) => (
    <div className="collection-card" onClick={() => onView(collection)}>
        <div className="collection-card__header">
            <div className="collection-card__icon">
                <span className="material-symbols-outlined">folder_special</span>
            </div>
            <div className="collection-card__actions" onClick={e => e.stopPropagation()}>
                {collection.isPublic && (
                    <span className="collection-card__public-badge">
                        <span className="material-symbols-outlined">public</span>
                    </span>
                )}
                <IconButton icon="delete" variant="ghost" className="btn-delete-action" onClick={() => onDelete(collection)} title={t('common.delete')} />
            </div>
        </div>
        <div className="collection-card__info">
            <h3>{collection.name}</h3>
            {collection.description && <p className="collection-card__desc">{collection.description}</p>}
            <div className="collection-card__meta">
                <span>{itemCount === 1 ? t('designer.collectionCountSingle').replace('{count}', itemCount) : t('designer.itemsCount').replace('{count}', itemCount)}</span>
                {collection.tags?.length > 0 && (
                    <span className="collection-card__tags">
                        {collection.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="collection-card__tag">{tag}</span>
                        ))}
                    </span>
                )}
            </div>
        </div>
    </div>
);

const Designer = () => {
    const { user, isGuest } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const userId = user?.id;

    // View state
    const [activeTab, setActiveTab] = useState('items'); // 'items' | 'collections'
    const [activeCategories, setActiveCategories] = useState([]);

    // Wardrobe hooks
    const shouldLoadAllMyItems = activeTab === 'collections';
    const { items: myItemsForCollections } = useUserWardrobeItems(userId, {
        enabled: shouldLoadAllMyItems,
    });
    const {
        items: myItems,
        isLoading: myLoading,
        error: myError,
        hasNextPage: hasMoreMy,
        isFetchingNextPage: isFetchingMoreMy,
        fetchNextPage: fetchNextMy,
    } = useUserWardrobeItemsInfinite(userId, {
        categories: activeTab === 'items' ? activeCategories : [],
        pageSize: ITEMS_PER_PAGE,
    });
    const {
        items: platformItems,
        isLoading: platformLoading,
        error: platformError,
        hasNextPage: hasMorePlatform,
        isFetchingNextPage: isFetchingMorePlatform,
        fetchNextPage: fetchNextPlatform,
    } = usePublicWardrobeItemsInfinite({
        categories: activeTab === 'items' ? activeCategories : [],
        pageSize: ITEMS_PER_PAGE,
    });
    const { createItem, isCreating } = useCreateWardrobeItem();
    const { deleteItem, isDeleting } = useDeleteWardrobeItem();
    const { uploadFile, isUploading } = useFileUpload();

    // Collection hooks
    const { collections, isLoading: collectionsLoading } = useUserCollections(userId);
    const { createCollection, isCreating: isCreatingCollection } = useCreateCollection();
    const { deleteCollection, isDeleting: isDeletingCollection } = useDeleteCollection();

    const isLoading = myLoading || platformLoading;
    const error = myError || platformError;

    // Modal states
    const [showNewItemModal, setShowNewItemModal] = useState(false);
    const [showEditItemModal, setShowEditItemModal] = useState(false);
    const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
    const [showCollectionDetailModal, setShowCollectionDetailModal] = useState(false);
    const [showAddToCollectionModal, setShowAddToCollectionModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteCollectionConfirm, setDeleteCollectionConfirm] = useState(null);

    // Form state - New Item
    const [newItem, setNewItem] = useState({
        title: '', description: '', category: 'clothing',
        brand: '', style: '', colour: '', colourHex: '', gender: '',
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Form state - Edit by Prompt
    const [editPrompt, setEditPrompt] = useState('');

    // Form state - New Collection
    const [newCollection, setNewCollection] = useState({
        name: '', description: '', isPublic: false, tags: '',
    });

    const platformSentinelRef = useRef(null);
    const mySentinelRef = useRef(null);
    const selectedCategoryLabels = CATEGORIES
        .filter(cat => activeCategories.includes(cat.id))
        .map(cat => t(`designer.categories.${cat.id}`));

    const handleCategoryChange = useCallback((catId) => {
        setActiveCategories(prev => prev.includes(catId)
            ? prev.filter(id => id !== catId)
            : [...prev, catId]);
    }, []);

    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
    }, []);

    // Reset handled inline in category/tab handlers

    // IntersectionObserver for platform items
    useEffect(() => {
        const sentinel = platformSentinelRef.current;
        if (!sentinel || !hasMorePlatform) return;
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting && !isFetchingMorePlatform) fetchNextPlatform(); },
            { rootMargin: '200px' }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMorePlatform, isFetchingMorePlatform, fetchNextPlatform]);

    // IntersectionObserver for my items
    useEffect(() => {
        const sentinel = mySentinelRef.current;
        if (!sentinel || !hasMoreMy) return;
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting && !isFetchingMoreMy) fetchNextMy(); },
            { rootMargin: '200px' }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMoreMy, isFetchingMoreMy, fetchNextMy]);

    // Handlers - File
    const processFile = (file) => {
        if (!file.type.startsWith('image/')) { alert('Please select an image file (PNG, JPG, WEBP)'); return; }
        if (file.size > 5 * 1024 * 1024) { alert('File size must not exceed 5MB'); return; }
        setSelectedFile(null);
        setImagePreview(null);
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        processFile(file);
        e.target.value = ''; // Reset input
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        processFile(file);
    };

    const handleRemoveImage = () => { setSelectedFile(null); setImagePreview(null); };

    // Handlers - Create Item
    const handleCreateItem = async () => {
        if (!newItem.title.trim() || !userId || !selectedFile) return;
        const uploadResult = await uploadFile(selectedFile, `wardrobe_items/${userId}`);
        if (!uploadResult) { alert('Failed to upload image. Please try again.'); return; }

        createItem({
            userId,
            title: newItem.title.trim(),
            category: newItem.category,
            description: newItem.description.trim() || null,
            brand: newItem.brand.trim() || null,
            style: newItem.style.trim() || null,
            colour: newItem.colour.trim() || null,
            colourHex: newItem.colourHex || null,
            gender: newItem.gender.trim() || null,
            thumbnailUrl: uploadResult.url,
            highResImageUrl: uploadResult.url,
        });

        setNewItem({ title: '', description: '', category: 'clothing', brand: '', style: '', colour: '', colourHex: '', gender: '' });
        setSelectedFile(null);
        setImagePreview(null);
        setShowNewItemModal(false);
    };

    // Handlers - Delete Item
    const handleDeleteItem = (item) => setDeleteConfirm({ id: item.id || item, title: item.title || 'this item' });
    const confirmDelete = () => {
        if (!userId || !deleteConfirm) return;
        deleteItem({ itemId: deleteConfirm.id, userId });
        setDeleteConfirm(null);
    };

    // Handlers - Edit by Prompt
    const handleEditItem = (item) => { setSelectedItem(item); setEditPrompt(''); setShowEditItemModal(true); };

    // Handlers - Use in Quick Shoot (navigate with item)
    const handleUseInQuickShoot = useCallback((item) => {
        navigate(`/studio/quick-shoot?wardrobe_item_id=${item.id}`);
    }, [navigate]);

    // Handlers - Collections
    const handleCreateCollection = () => {
        if (!newCollection.name.trim() || !userId) return;
        createCollection({
            userId,
            name: newCollection.name.trim(),
            description: newCollection.description.trim() || '',
            isPublic: newCollection.isPublic,
            tags: newCollection.tags ? newCollection.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        });
        setNewCollection({ name: '', description: '', isPublic: false, tags: '' });
        setShowNewCollectionModal(false);
    };

    const handleDeleteCollection = (collection) => setDeleteCollectionConfirm({ id: collection.id, name: collection.name });
    const confirmDeleteCollection = () => {
        if (!userId || !deleteCollectionConfirm) return;
        deleteCollection({ collectionId: deleteCollectionConfirm.id, userId });
        setDeleteCollectionConfirm(null);
    };

    const handleViewCollection = (collection) => { setSelectedCollection(collection); setShowCollectionDetailModal(true); };

    const handleAddToCollection = (item) => { setSelectedItem(item); setShowAddToCollectionModal(true); };

    // Get items that belong to a collection
    const getCollectionItems = useCallback((collection) => {
        if (!collection?.itemIds?.length) return [];
        return myItemsForCollections.filter(item => collection.itemIds.includes(item.id));
    }, [myItemsForCollections]);

    return (
        <div className="designer-page">
            <main className="designer-main">
                <div className="step-header">
                    <h2>{t('designer.title')}</h2>
                    <p>{t('designer.subtitle')}</p>
                </div>

                {/* Tab Navigation */}
                <div className="designer-tabs">
                    <button
                        className={`designer-tab ${activeTab === 'items' ? 'active' : ''}`}
                        onClick={() => handleTabChange('items')}
                    >
                        <span className="material-symbols-outlined">checkroom</span>
                        {t('designer.wardrobe')}
                    </button>
                    <button
                        className={`designer-tab ${activeTab === 'collections' ? 'active' : ''}`}
                        onClick={() => handleTabChange('collections')}
                    >
                        <span className="material-symbols-outlined">folder_special</span>
                        {t('designer.collections')}
                        {collections.length > 0 && <span className="designer-tab__count">{collections.length}</span>}
                    </button>
                </div>

                {/* ============================================ */}
                {/* ITEMS TAB */}
                {/* ============================================ */}
                {activeTab === 'items' && (
                    <>
                        <div className="designer-toolbar">
                            <div className="designer-filters">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        className={`filter-chip ${activeCategories.includes(cat.id) ? 'active' : ''}`}
                                        onClick={() => handleCategoryChange(cat.id)}
                                    >
                                        <span className="material-symbols-outlined">{cat.icon}</span>
                                        {cat.label}
                                    </button>
                                ))}
                                {activeCategories.length > 0 && (
                                    <Button variant="outline" size="sm" onClick={() => setActiveCategories([])}>
                                        {t('designer.clearFilters')}
                                    </Button>
                                )}
                            </div>
                            {!isGuest && (
                                <Button variant="primary" size="md" icon="add" onClick={() => setShowNewItemModal(true)}>
                                    {t('designer.newItem')}
                                </Button>
                            )}
                        </div>

                        {isLoading && (
                            <div className="designer-empty">
                                <span className="material-symbols-outlined">hourglass_empty</span>
                                <h3>{t('designer.loadingItems')}</h3>
                            </div>
                        )}

                        {error && (
                            <div className="designer-empty">
                                <span className="material-symbols-outlined">error</span>
                                <h3>{t('designer.failedToLoadItems')}</h3>
                                <p>{error.message}</p>
                            </div>
                        )}

                        {!isLoading && !error && (
                            <>
                                {/* My Items */}
                                {!isGuest && (
                                    <div className="designer-section">
                                        <h3 className="designer-section__title">
                                            <span className="material-symbols-outlined">person</span>
                                            {t('designer.myItems')}
                                        </h3>
                                        {myItems.length > 0 ? (
                                            <>
                                                <div className="designer-grid">
                                                    {myItems.map(item => (
                                                        <ItemCard
                                                            key={item.id}
                                                            item={item}
                                                            isOwner
                                                            onEdit={handleEditItem}
                                                            onUse={handleUseInQuickShoot}
                                                            onDelete={() => handleDeleteItem(item)}
                                                            onAddToCollection={collections.length > 0 ? handleAddToCollection : null}
                                                            t={t}
                                                        />
                                                    ))}
                                                </div>
                                                {(hasMoreMy || isFetchingMoreMy) && (
                                                    <div className="designer-load-more" ref={mySentinelRef}>
                                                        <span className="spinner" />
                                                        <span>{isFetchingMoreMy ? t('designer.loadingMoreItems') : t('designer.scrollToLoadMore')}</span>
                                                    </div>
                                                )}
                                                <p className="designer-item-count">
                                                    {hasMoreMy ? t('designer.loadedItems').replace('{count}', myItems.length) : t('designer.showingAllItems').replace('{count}', myItems.length)}
                                                </p>
                                            </>
                                        ) : (
                                            <div className="designer-empty designer-empty--compact">
                                                <span className="material-symbols-outlined">palette</span>
                                                <p>
                                                    {activeCategories.length > 0
                                                        ? t('designer.noSavedItemsFoundIn').replace('{categories}', selectedCategoryLabels.join(', '))
                                                        : t('designer.noSavedItemsYet')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Platform Items */}
                                <div className="designer-section">
                                    <h3 className="designer-section__title">
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                        {t('designer.platformWardrobe')}
                                    </h3>
                                    {platformItems.length > 0 ? (
                                        <>
                                            <div className="designer-grid">
                                                {platformItems.map(item => (
                                                    <ItemCard
                                                        key={item.id}
                                                        item={item}
                                                        isOwner={false}
                                                        onEdit={handleEditItem}
                                                        onUse={handleUseInQuickShoot}
                                                        onDelete={handleDeleteItem}
                                                        t={t}
                                                    />
                                                ))}
                                            </div>
                                            {(hasMorePlatform || isFetchingMorePlatform) && (
                                                <div className="designer-load-more" ref={platformSentinelRef}>
                                                    <span className="spinner" />
                                                    <span>{isFetchingMorePlatform ? t('designer.loadingMoreItems') : t('designer.scrollToLoadMore')}</span>
                                                </div>
                                            )}
                                            <p className="designer-item-count">
                                                {hasMorePlatform ? t('designer.loadedItems').replace('{count}', platformItems.length) : t('designer.showingAllItems').replace('{count}', platformItems.length)}
                                            </p>
                                        </>
                                    ) : (
                                        <div className="designer-empty designer-empty--compact">
                                            <span className="material-symbols-outlined">inventory_2</span>
                                            <p>
                                                {activeCategories.length > 0
                                                    ? t('designer.noPlatformItemsFoundIn').replace('{categories}', selectedCategoryLabels.join(', '))
                                                    : t('designer.noPlatformItemsAvailable')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* ============================================ */}
                {/* COLLECTIONS TAB */}
                {/* ============================================ */}
                {activeTab === 'collections' && (
                    <>
                        <div className="designer-toolbar">
                            <div className="designer-toolbar__info">
                                <span className="designer-toolbar__count">{collections.length === 1 ? t('designer.collectionCountSingle').replace('{count}', collections.length) : t('designer.collectionsCount').replace('{count}', collections.length)}</span>
                            </div>
                            {!isGuest && (
                                <Button variant="primary" size="md" icon="create_new_folder" onClick={() => setShowNewCollectionModal(true)}>
                                    {t('designer.newCollection')}
                                </Button>
                            )}
                        </div>

                        {collectionsLoading && (
                            <div className="designer-empty">
                                <span className="material-symbols-outlined">hourglass_empty</span>
                                <h3>{t('designer.loadingCollections')}</h3>
                            </div>
                        )}

                        {!collectionsLoading && collections.length > 0 ? (
                            <div className="collections-grid">
                                {collections.map(col => (
                                    <CollectionCard
                                        key={col.id}
                                        collection={col}
                                        onView={handleViewCollection}
                                        onDelete={handleDeleteCollection}
                                        itemCount={col.itemIds?.length || 0}
                                        t={t}
                                    />
                                ))}
                            </div>
                        ) : !collectionsLoading && (
                            <div className="designer-empty">
                                <span className="material-symbols-outlined">folder_off</span>
                                <h3>{t('designer.noCollectionsYet')}</h3>
                                <p>{t('designer.organiseItemsIntoCollections')}</p>
                                {!isGuest && (
                                    <Button variant="outline" size="md" icon="create_new_folder" onClick={() => setShowNewCollectionModal(true)} style={{ marginTop: 16 }}>
                                        {t('designer.createFirstCollection')}
                                    </Button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* ============================================ */}
            {/* MODALS */}
            {/* ============================================ */}

            {/* New Item Modal */}
            <Modal
                open={showNewItemModal}
                onClose={() => setShowNewItemModal(false)}
                title={t('designer.createNewItem')}
                footer={
                    <>
                        <Button variant="secondary" size="md" onClick={() => setShowNewItemModal(false)}>{t('common.cancel')}</Button>
                        <Button
                            variant="primary" size="md"
                            onClick={handleCreateItem}
                            disabled={!newItem.title.trim() || !selectedFile || isCreating || isUploading}
                        >
                            {isUploading ? t('designer.uploading') : isCreating ? t('designer.savingItem') : t('designer.saveItem')}
                        </Button>
                    </>
                }
            >
                <div className="form-group">
                    <label>{t('designer.imageRequired')}</label>
                    {imagePreview ? (
                        <div className="image-preview-container">
                            <img src={imagePreview} alt="Preview" className="image-preview" />
                            <button type="button" className="remove-image-btn" onClick={handleRemoveImage} title="Remove image">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    ) : (
                        <div 
                            className="file-upload-area"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <input type="file" id="item-image" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} disabled={isUploading} />
                            <label htmlFor="item-image" className={`file-upload-label ${isUploading ? 'uploading' : ''}`}>
                                {isUploading ? (
                                    <>
                                        <div className="processing-spinner spinner-small"></div>
                                        <span className="file-upload-text">{t('designer.uploading')}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">add_photo_alternate</span>
                                        <span className="file-upload-text">{t('designer.clickToUpload')}</span>
                                        <span className="file-upload-hint">{t('designer.uploadHint')}</span>
                                    </>
                                )}
                            </label>
                        </div>
                    )}
                </div>
                <div className="form-group">
                    <label>{t('designer.titleRequired')}</label>
                    <input type="text" placeholder="e.g., Classic Blazer" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>{t('designer.category')}</label>
                    <div className="category-buttons">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                className={`category-btn ${newItem.category === cat.id ? 'active' : ''}`}
                                onClick={() => setNewItem({ ...newItem, category: cat.id })}
                            >
                                <span className="material-symbols-outlined thin-icon">{cat.icon}</span>
                                {t(`designer.categories.${cat.id}`)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="form-group">
                    <label>{t('designer.brandOptional')}</label>
                    <input type="text" placeholder="e.g., Zara, Nike, Gucci" value={newItem.brand} onChange={e => setNewItem({ ...newItem, brand: e.target.value })} />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>{t('designer.styleOptional')}</label>
                        <input type="text" placeholder="e.g., Casual, Formal" value={newItem.style} onChange={e => setNewItem({ ...newItem, style: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label>{t('designer.colourOptional')}</label>
                        <div className="color-picker-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input
                                type="color"
                                value={newItem.colourHex || '#ffffff'}
                                onChange={e => {
                                    const hex = e.target.value;
                                    setNewItem({ ...newItem, colourHex: hex, colour: getNearestColorName(hex) });
                                }}
                                style={{ width: '38px', height: '38px', padding: '0', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', cursor: 'pointer', background: 'none' }}
                            />
                            <input
                                type="text"
                                placeholder={t('designer.hexOrName')}
                                value={newItem.colour}
                                onChange={e => setNewItem({ ...newItem, colour: e.target.value })}
                                style={{ flex: 1 }}
                            />
                        </div>
                    </div>
                </div>
                <div className="form-group">
                    <label>{t('designer.genderOptional')}</label>
                    <select value={newItem.gender} onChange={e => setNewItem({ ...newItem, gender: e.target.value })}>
                        <option value="">{t('designer.selectGender')}</option>
                        <option value="male">{t('designer.male')}</option>
                        <option value="female">{t('designer.female')}</option>
                        <option value="unisex">{t('designer.unisex')}</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>{t('designer.descriptionOptional')}</label>
                    <textarea placeholder={t('designer.describeFashionItem')} value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} rows="3" />
                </div>
            </Modal>


            {/* Edit by Prompt Modal */}
            <Modal
                open={showEditItemModal && !!selectedItem}
                onClose={() => setShowEditItemModal(false)}
                title={t('designer.editByPrompt')}
                footer={
                    <>
                        <Button variant="secondary" size="md" onClick={() => setShowEditItemModal(false)}>{t('common.cancel')}</Button>
                        <Button
                            variant="primary" size="md" icon="auto_awesome"
                            onClick={() => {
                                console.log('Edit variation:', editPrompt, selectedItem);
                                setShowEditItemModal(false);
                            }}
                            disabled={!editPrompt.trim()}
                        >
                            {t('designer.createVariation')}
                        </Button>
                    </>
                }
            >
                {selectedItem && (
                    <div className="edit-item-preview">
                        {selectedItem.thumbnailUrl && <img src={selectedItem.thumbnailUrl} alt={selectedItem.altText || selectedItem.title} />}
                        <div>
                            <h4>{selectedItem.title}</h4>
                            {selectedItem.brand && <p className="edit-item-brand">{selectedItem.brand}</p>}
                            {selectedItem.description && <p className="original-prompt">{selectedItem.description}</p>}
                        </div>
                    </div>
                )}
                <div className="form-group">
                    <label>{t('designer.modificationPrompt')}</label>
                    <textarea
                        placeholder={t('designer.modificationPromptPlaceholder')}
                        value={editPrompt}
                        onChange={e => setEditPrompt(e.target.value)}
                        rows="3"
                    />
                </div>
                <div className="edit-prompt-hint">
                    <span className="material-symbols-outlined">info</span>
                    <span>{t('designer.editPromptHint')}</span>
                </div>
            </Modal>

            {/* New Collection Modal */}
            <Modal
                open={showNewCollectionModal}
                onClose={() => setShowNewCollectionModal(false)}
                title={t('designer.newCollection')}
                footer={
                    <>
                        <Button variant="secondary" size="md" onClick={() => setShowNewCollectionModal(false)}>{t('common.cancel')}</Button>
                        <Button variant="primary" size="md" onClick={handleCreateCollection} disabled={!newCollection.name.trim() || isCreatingCollection}>
                            {isCreatingCollection ? t('common.loading') : t('designer.newCollection')}
                        </Button>
                    </>
                }
            >
                <div className="form-group">
                    <label>{t('designer.collectionNameRequired')}</label>
                    <input type="text" placeholder={t('designer.collectionNamePlaceholder')} value={newCollection.name} onChange={e => setNewCollection({ ...newCollection, name: e.target.value })} />
                </div>
                <div className="form-group">
                    <label>{t('designer.descriptionOptional')}</label>
                    <textarea placeholder={t('designer.describeCollection')} value={newCollection.description} onChange={e => setNewCollection({ ...newCollection, description: e.target.value })} rows="2" />
                </div>
                <div className="form-group">
                    <label>{t('designer.tagsCommaSeparated')}</label>
                    <input type="text" placeholder={t('designer.tagsPlaceholder')} value={newCollection.tags} onChange={e => setNewCollection({ ...newCollection, tags: e.target.value })} />
                </div>
                <div className="form-group form-group--inline">
                    <label>
                        <input type="checkbox" checked={newCollection.isPublic} onChange={e => setNewCollection({ ...newCollection, isPublic: e.target.checked })} />
                        <span>{t('designer.makePublic')}</span>
                    </label>
                </div>
            </Modal>

            {/* Delete Collection Confirmation */}
            <Modal
                open={!!deleteCollectionConfirm}
                onClose={() => setDeleteCollectionConfirm(null)}
                title={t('designer.deleteCollection')}
                footer={
                    <>
                        <Button variant="secondary" size="md" onClick={() => setDeleteCollectionConfirm(null)}>{t('common.cancel')}</Button>
                        <Button variant="danger" size="md" onClick={confirmDeleteCollection} disabled={isDeletingCollection}>
                            {isDeletingCollection ? t('common.loading') : t('common.delete')}
                        </Button>
                    </>
                }
            >
                <p>{t('designer.deleteCollectionConfirmMessage').replace('{name}', deleteCollectionConfirm?.name)}</p>
                <p style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.5)' }}>{t('designer.itemsWillNotBeDeleted')}</p>
            </Modal>

            {/* Collection Detail Modal */}
            <Modal
                open={showCollectionDetailModal && !!selectedCollection}
                onClose={() => setShowCollectionDetailModal(false)}
                title={selectedCollection?.name || 'Collection'}
                className="cm-modal--lg"
            >
                {selectedCollection && (
                    <>
                        {selectedCollection.description && (
                            <p className="collection-detail__desc">{selectedCollection.description}</p>
                        )}
                        {selectedCollection.tags?.length > 0 && (
                            <div className="collection-detail__tags">
                                {selectedCollection.tags.map(tag => (
                                    <span key={tag} className="collection-card__tag">{tag}</span>
                                ))}
                            </div>
                        )}
                        <div className="collection-detail__items">
                            {getCollectionItems(selectedCollection).length > 0 ? (
                                <div className="designer-grid">
                                    {getCollectionItems(selectedCollection).map(item => (
                                        <ItemCard
                                            key={item.id}
                                            item={item}
                                            isOwner
                                            onEdit={handleEditItem}
                                            onUse={handleUseInQuickShoot}
                                            onDelete={() => handleDeleteItem(item)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="designer-empty designer-empty--compact">
                                    <span className="material-symbols-outlined">inventory_2</span>
                                    <p>{t('designer.noItemsInCollection')}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </Modal>

            {/* Add to Collection Modal */}
            <Modal
                open={showAddToCollectionModal && !!selectedItem}
                onClose={() => setShowAddToCollectionModal(false)}
                title={t('designer.addToCollection')}
            >
                {selectedItem && (
                    <div className="add-to-collection__item">
                        {selectedItem.thumbnailUrl && <img src={selectedItem.thumbnailUrl} alt={selectedItem.title} />}
                        <span>{selectedItem.title}</span>
                    </div>
                )}
                <div className="add-to-collection__list">
                    {collections.map(col => {
                        const alreadyIn = col.itemIds?.includes(selectedItem?.id);
                        return (
                            <button
                                key={col.id}
                                className={`add-to-collection__option ${alreadyIn ? 'added' : ''}`}
                                disabled={alreadyIn}
                                onClick={() => {
                                    console.log('Add item to collection:', selectedItem?.id, col.id);
                                    setShowAddToCollectionModal(false);
                                }}
                            >
                                <span className="material-symbols-outlined">{alreadyIn ? 'check_circle' : 'folder_special'}</span>
                                <span>{col.name}</span>
                                {alreadyIn && <span className="add-to-collection__badge">{t('designer.added')}</span>}
                            </button>
                        );
                    })}
                    {collections.length === 0 && (
                        <div className="designer-empty designer-empty--compact">
                            <p>{t('designer.noCollectionsCreateFirst')}</p>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Delete Item Confirmation */}
            <Modal
                open={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title={t('common.delete')}
                footer={
                    <>
                        <Button variant="secondary" size="md" onClick={() => setDeleteConfirm(null)}>{t('common.cancel')}</Button>
                        <Button variant="danger" size="md" onClick={confirmDelete} disabled={isDeleting}>
                            {isDeleting ? t('common.loading') : t('common.delete')}
                        </Button>
                    </>
                }
            >
                <p>{t('designer.deleteItemConfirmMessage').replace('{title}', deleteConfirm?.title)}</p>
                <p style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.5)' }}>{t('designer.actionCannotBeUndone')}</p>
            </Modal>
        </div>
    );
};

export default Designer;
