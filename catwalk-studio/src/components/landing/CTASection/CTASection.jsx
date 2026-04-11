import { useLanguage } from '../../../contexts/LanguageContext';

export function CTASection() {
  const { t } = useLanguage();

  return (
    <section className="cta-section">
      <div className="container-wide cta-container">
        <span className="cta-subtitle">{t('landing.cta.subtitle')}</span>
        <h2 className="cta-title editorial-kern">{t('landing.cta.title')}</h2>
        <p className="cta-description">
          {t('landing.cta.description')}
        </p>
        <button
          className="btn-cta-large"
          onClick={() => window.location.href = '/models/register'}
        >
          {t('landing.cta.startApplication')}
        </button>
        <p className="cta-footer-text">{t('landing.cta.limitedOpenings')}</p>
      </div>
    </section>
  );
}

export default CTASection;
