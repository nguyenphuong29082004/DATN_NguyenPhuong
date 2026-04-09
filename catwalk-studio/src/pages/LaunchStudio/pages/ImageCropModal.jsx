import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import './ImageCropModal.css';

/**
 * Tạo canvas crop từ ảnh gốc
 */
function getCroppedImg(imageSrc, pixelCrop) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;
            const ctx = canvas.getContext('2d');

            ctx.drawImage(
                image,
                pixelCrop.x,
                pixelCrop.y,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                pixelCrop.width,
                pixelCrop.height
            );

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            }, 'image/webp', 0.92);
        };
        image.onerror = reject;
        image.src = imageSrc;
    });
}

const ImageCropModal = ({ imageSrc, onConfirm, onCancel, aspectRatio = 3 / 4 }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return;
        setIsProcessing(true);
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            const croppedFile = new File([croppedBlob], 'profile-cropped.webp', { type: 'image/webp' });
            onConfirm(croppedFile);
        } catch (err) {
            console.error('Crop failed:', err);
            alert('Failed to crop image. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!imageSrc) return null;

    return (
        <div className="crop-modal-overlay" onClick={onCancel}>
            <div className="crop-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="crop-modal-header">
                    <h3 className="crop-modal-title">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '8px' }}>crop</span>
                        Adjust Your Portrait
                    </h3>
                    <p className="crop-modal-subtitle">Drag to reposition · Scroll or use slider to zoom</p>
                </div>

                {/* Crop Area */}
                <div className="crop-area-wrapper">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspectRatio}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        cropShape="rect"
                        showGrid={false}
                        style={{
                            containerStyle: {
                                borderRadius: '8px',
                            },
                            cropAreaStyle: {
                                border: '2px solid rgba(241, 224, 182, 0.6)',
                                borderRadius: '4px',
                            },
                        }}
                    />
                </div>

                {/* Zoom Slider */}
                <div className="crop-zoom-control">
                    <span className="material-symbols-outlined zoom-icon" style={{ fontSize: '16px' }}>zoom_out</span>
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.05}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="crop-zoom-slider"
                        style={{
                            background: `linear-gradient(to right, #F1E0B6 0%, #F1E0B6 ${((zoom - 1) / 2) * 100}%, rgba(255, 255, 255, 0.1) ${((zoom - 1) / 2) * 100}%, rgba(255, 255, 255, 0.1) 100%)`
                        }}
                    />
                    <span className="material-symbols-outlined zoom-icon" style={{ fontSize: '16px' }}>zoom_in</span>
                </div>

                {/* Actions */}
                <div className="crop-modal-actions">
                    <button className="crop-btn-cancel" onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        className="crop-btn-confirm"
                        onClick={handleConfirm}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <div className="processing-spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#0A0A0A', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '8px' }}></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '6px' }}>check</span>
                                Confirm Crop
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropModal;
