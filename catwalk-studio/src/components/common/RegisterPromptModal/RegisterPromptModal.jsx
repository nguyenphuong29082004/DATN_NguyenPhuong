import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Modal } from '../Modal';
import { Button } from '../Button';
import './RegisterPromptModal.css';

export function RegisterPromptModal({ open, onClose, reason = 'save' }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();

    const REASONS = {
        save: {
            icon: 'bookmark',
            title: t('auth.saveYourCreation'),
            description: t('auth.saveYourCreationDesc'),
        },
        credits: {
            icon: 'generating_tokens',
            title: t('auth.creditsUsedUp'),
            description: t('auth.creditsUsedUpDesc'),
        },
    };
    const config = REASONS[reason] || REASONS.save;

    const handleSignUp = () => {
        onClose?.();
        navigate('/login', { state: { from: location.pathname } });
    };

    return (
        <Modal open={open} onClose={onClose} title={t('auth.joinCatwalk')} className="register-prompt-modal">
            <div className="register-prompt__content">
                <span className="material-symbols-outlined register-prompt__icon">{config.icon}</span>
                <h3 className="register-prompt__heading">{config.title}</h3>
                <p className="register-prompt__text">{config.description}</p>
                <div className="register-prompt__actions">
                    <Button variant="primary" size="md" icon="person_add" onClick={handleSignUp}>
                        {t('auth.signUpFree')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        {t('auth.maybeLater')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

export default RegisterPromptModal;
