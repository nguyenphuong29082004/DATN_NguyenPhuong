import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useGenerationHistory } from '../../../hooks/generations/useGenerations';
import './Library.css';

const Library = () => {
    const { user } = useAuth();
    const { generations, isLoading } = useGenerationHistory(user?.id);
    const [filter, setFilter] = useState('all'); // all, photo, video

    const filteredGenerations = generations?.filter(g => {
        if (filter === 'all') return true;
        return g.outputType === filter;
    }) || [];

    return (
        <div className="library-page">
            <div className="step-header">
                <h2>Asset Library</h2>
                <p>Manage and organize your AI-generated fashion assets</p>
            </div>

            <div className="library-filters">
                <button 
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All Assets
                </button>
                <button 
                    className={`filter-btn ${filter === 'photo' ? 'active' : ''}`}
                    onClick={() => setFilter('photo')}
                >
                    Photos
                </button>
                <button 
                    className={`filter-btn ${filter === 'video' ? 'active' : ''}`}
                    onClick={() => setFilter('video')}
                >
                    Videos
                </button>
            </div>

            {isLoading ? (
                <div className="library-empty">
                    <div className="spinner-large"></div>
                    <p>Loading your library...</p>
                </div>
            ) : filteredGenerations.length === 0 ? (
                <div className="library-empty">
                    <span className="material-symbols-outlined">inventory_2</span>
                    <h3>Your library is empty</h3>
                    <p>Start a Quick Shoot or use the Designer to create assets.</p>
                </div>
            ) : (
                <div className="asset-grid">
                    {filteredGenerations.map((gen) => (
                        <div key={gen.id} className="asset-card">
                            <div className="asset-media">
                                {gen.outputType === 'video' ? (
                                    <video src={gen.imageUrl} muted loop onMouseOver={e => e.target.play()} onMouseOut={e => e.target.pause()} />
                                ) : (
                                    <img src={gen.imageUrl} alt={gen.prompt || 'Generated asset'} loading="lazy" />
                                )}
                            </div>
                            <div className="asset-info">
                                <span className="asset-type">{(gen.outputType || gen.type || 'asset').toUpperCase()}</span>
                                <span className="asset-date">{new Date(gen.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Library;
