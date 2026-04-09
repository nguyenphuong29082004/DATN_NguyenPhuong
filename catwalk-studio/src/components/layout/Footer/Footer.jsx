import './Footer.css';
import { Button } from '../../common';

export function Footer({
  onBack,
  onNext,
  onSkip,
  backLabel = 'Back',
  nextLabel = 'Continue',
  skipLabel,
  hint,
  showBack = true,
  nextDisabled = false,
  className = ''
}) {
  return (
    <footer className={`layout-footer ${className}`}>
      <div className="footer__container">
        {showBack ? (
          <Button
            variant="ghost"
            icon="arrow_back"
            iconPosition="left"
            onClick={onBack}
          >
            {backLabel}
          </Button>
        ) : (
          <div />
        )}

        <div className="footer__actions">
          {hint && <span className="footer__hint">{hint}</span>}

          {skipLabel && (
            <Button variant="ghost" onClick={onSkip}>
              {skipLabel}
            </Button>
          )}

          <Button
            variant="primary"
            icon="arrow_forward"
            onClick={onNext}
            disabled={nextDisabled}
          >
            {nextLabel}
          </Button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
