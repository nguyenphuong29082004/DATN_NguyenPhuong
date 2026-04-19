import { Link } from 'react-router-dom';
import { usePublicModels } from '../../../hooks/models/useModels';
import { useGalleryItems } from '../../../hooks/gallery/useGallery';
import './MainTeaser.css';

export function MainTeaser() {
  const { models, isLoading: loadingModels } = usePublicModels({ limit: 4 });
  const { items: galleryItems, isLoading: loadingGallery } = useGalleryItems({ limit: 6, page: 0 });

  return (
    <section className="main-teaser-section">
      <div className="container-wide">
        {/* Models Teaser */}
        <div className="teaser-group">
          <div className="teaser-header">
            <div className="teaser-title-wrap">
              <span className="teaser-subtitle">Elite Talent</span>
              <h2 className="teaser-title">Model <span className="italic">Discovery</span></h2>
            </div>
            <Link to="/models" className="teaser-link">
              <span>View Marketplace</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
          
          <div className="models-teaser-grid">
            {loadingModels ? (
              <div className="teaser-loader">Loading models...</div>
            ) : (
              models.slice(0, 4).map(model => (
                <Link key={model.id} to={`/models/${model.username}`} className="model-teaser-card">
                  <div className="model-teaser-image">
                    <img src={model.profileImageUrl} alt={model.displayName} loading="lazy" />
                    {model.isElite && <span className="elite-tag">Elite</span>}
                  </div>
                  <div className="model-teaser-info">
                    <h4>{model.displayName || model.username}</h4>
                    <p>{model.location || 'Global'}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Gallery Teaser */}
        <div className="teaser-group gallery-teaser-group">
          <div className="teaser-header">
            <div className="teaser-title-wrap">
              <span className="teaser-subtitle">Community Creations</span>
              <h2 className="teaser-title">Fashion <span className="italic">Gallery</span></h2>
            </div>
            <Link to="/gallery" className="teaser-link">
              <span>Explore All</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>

          <div className="gallery-teaser-grid">
            {loadingGallery ? (
              <div className="teaser-loader">Loading gallery...</div>
            ) : (
              galleryItems.slice(0, 6).map(item => (
                <Link key={item.id} to={`/gallery/${item.id}`} className="gallery-teaser-item">
                  <img src={item.outputUrl} alt={item.title} loading="lazy" />
                  {item.outputType === 'video' && (
                    <span className="video-icon">
                      <span className="material-symbols-outlined">play_circle</span>
                    </span>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default MainTeaser;
