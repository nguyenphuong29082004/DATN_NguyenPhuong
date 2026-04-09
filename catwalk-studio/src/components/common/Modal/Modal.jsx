import { useEffect } from 'react';
import { IconButton } from '../Button/Button';
import './Modal.css';

export function Modal({ open, onClose, title, children, footer, className = '' }) {
    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = 'hidden';
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="cm-modal-overlay" onClick={onClose}>
            <div className={`cm-modal ${className}`} onClick={(e) => e.stopPropagation()}>
                <div className="cm-modal__header">
                    <h2 className="cm-modal__title">{title}</h2>
                    <IconButton icon="close" variant="ghost" onClick={onClose} />
                </div>
                <div className="cm-modal__body">
                    {children}
                </div>
                {footer && (
                    <div className="cm-modal__footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Modal;
