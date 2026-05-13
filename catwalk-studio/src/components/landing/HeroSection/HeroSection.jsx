import { useTranslation } from 'react-i18next';

export function HeroSection() {
  const { t } = useTranslation();
  return (
    <section className="hero-section">
      <div className="container-wide hero-grid">
        <div className="hero-content">

          <h1 className="hero-title editorial-kern">
            {t('landing.hero.titlePart1')} <br />
            <span className="italic">{t('landing.hero.titlePart2')}</span>
          </h1>
          <p className="hero-description">
            {t('landing.hero.description')}
          </p>
          <div className="hero-actions">
            <button className="btn-hero-primary" onClick={() => window.location.href = '/models/register'}>
              {t('landing.hero.becomeModel')}
            </button>
            <button className="btn-hero-secondary" onClick={() => window.location.href = '/models'}>
              <span>{t('landing.hero.hireTalent')}</span>
              <span className="material-symbols-outlined thin-icon">arrow_forward</span>
            </button>
          </div>
        </div>

        <div className="hero-visual group">
          <div className="visual-glow"></div>
          <div className="visual-images">
            <div className="visual-card visual-card--1">
              <div className="image-overlay image-overlay--dark"></div>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsNv9HF1rz4gvOEfqLVxDPtzmgiRyPO3n6ZfDkecUZItxzdoDLsiuFiaTFOSLhXW-uEZWBCBUPhdys_KIrjCpIipKSZGKlZ5HyzXvbTFoh5Y-jOmxqxWv3T9zLBLWgYzbYsYaRt6ZGCzaB4cu0TLq85pjgwPZvfS8ORK18rfkvU3SS0lHSIVbUpN5yWhuu7nx6iNicWgSl6B8yIIuIMMOsIiAOjjm9qpim17kDBcEEElKttFIULpuyRKIBLhHZcfnHq2b97BhkR2Q"
                alt={t('landing.hero.realLife')}
              />
              <div className="card-label">
                <span className="card-label-text">{t('landing.hero.realLife')}</span>
              </div>
            </div>
            <div className="visual-card visual-card--2">
              <div className="image-overlay image-overlay--accent"></div>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFQOvvvBxmU0x2u8sBu-6xTrCPlYKLcMSIsW1t2_QLB3omhqvo2YpwfzTjEtuOsyNtcZjfGUdtCM_O067ZwRA-gnfCGjR4E5IVlCBS-ZzFm0oVBWJaKwKn009u7sFD3aKBs81fq9Pf24CMYFz1dlp6vI6SYBOzYPy0dFwHPz9-oQ9ZlxNKJ1p3PG--YJlqQlGc3VF9KtAtQCQlnJkilxekffvZ6tiKwL7YdT_f6x77coYYDe8Do6lzqhfGMEm545RlO0gcgWUNF1c"
                alt={t('landing.hero.aiSynthetic')}
              />
              <div className="card-label card-label--accent">
                <span className="card-label-text">{t('landing.hero.aiSynthetic')}</span>
              </div>
            </div>
            <div className="visual-card visual-card--3">
              <div className="image-overlay image-overlay--dark"></div>
              <img
                src="https://images.unsplash.com/photo-1539109132314-3475961e0281?q=80&w=1974&auto=format&fit=crop"
                alt="Elite Fashion"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
