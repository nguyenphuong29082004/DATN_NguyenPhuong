import { useEffect } from 'react';
import { IconButton } from '../Button/Button';
import './SidePanel.css';

export function SidePanel({ open, onClose, title, children, footer, className = '' }) {
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
        <div className="cm-side-panel-overlay" onClick={onClose}>
            <aside className={`cm-side-panel ${className}`} onClick={(e) => e.stopPropagation()}>
                <div className="cm-side-panel__header">
                    <h3 className="cm-side-panel__title">{title}</h3>
                    <IconButton icon="close" variant="ghost" onClick={onClose} />
                </div>
                <div className="cm-side-panel__body">
                    {children}
                </div>
                {footer && (
                    <div className="cm-side-panel__footer">
                        {footer}
                    </div>
                )}
            </aside>
        </div>
    );
}

export default SidePanel;
