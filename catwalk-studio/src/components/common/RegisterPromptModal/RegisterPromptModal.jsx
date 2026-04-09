import { useNavigate, useLocation } from 'react-router-dom';
import { Modal } from '../Modal';
import { Button } from '../Button';
import './RegisterPromptModal.css';

const REASONS = {
    save: {
        icon: 'bookmark',
        title: 'Save Your Creation',
        description: 'Sign up to save images to your personal collection and access them anytime.',
    },
    credits: {
        icon: 'generating_tokens',
        title: 'Credits Used Up',
        description: "You've used all your free credits. Create a free account to get more and keep creating!",
    },
};

export function RegisterPromptModal({ open, onClose, reason = 'save' }) {
    const navigate = useNavigate();
    const location = useLocation();
    const config = REASONS[reason] || REASONS.save;

    const handleSignUp = () => {
        onClose?.();
        navigate('/login', { state: { from: location.pathname } });
    };

    return (
        <Modal open={open} onClose={onClose} title="Join Catwalk.AI" className="register-prompt-modal">
            <div className="register-prompt__content">
                <span className="material-symbols-outlined register-prompt__icon">{config.icon}</span>
                <h3 className="register-prompt__heading">{config.title}</h3>
                <p className="register-prompt__text">{config.description}</p>
                <div className="register-prompt__actions">
                    <Button variant="primary" size="md" icon="person_add" onClick={handleSignUp}>
                        Sign Up Free
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Maybe Later
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

export default RegisterPromptModal;
