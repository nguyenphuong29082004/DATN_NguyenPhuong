import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './StudioPage.css';
import { LandingHeader, LandingFooter } from '../../components/landing';

export function StudioPage() {
  const { t } = useTranslation();

  const tools = [
    {
      icon: 'photo_camera',
      title: t('studio_landing.tools.tool1.title'),
      description: t('studio_landing.tools.tool1.description'),
    },
    {
      icon: 'auto_awesome',
      title: t('studio_landing.tools.tool2.title'),
      description: t('studio_landing.tools.tool2.description'),
    },
    {
      icon: 'accessibility_new',
      title: t('studio_landing.tools.tool3.title'),
      description: t('studio_landing.tools.tool3.description'),
    },
    {
      icon: 'light_mode',
      title: t('studio_landing.tools.tool4.title'),
      description: t('studio_landing.tools.tool4.description'),
    },
    {
      icon: 'palette',
      title: t('studio_landing.tools.tool5.title'),
      description: t('studio_landing.tools.tool5.description'),
    },
    {
      icon: 'view_in_ar',
      title: t('studio_landing.tools.tool6.title'),
      description: t('studio_landing.tools.tool6.description'),
    },
  ];

  const plans = [
    {
      name: t('studio_landing.pricing.free.name'),
      price: '$0',
      period: t('studio_landing.pricing.forever'),
      features: t('studio_landing.pricing.free.features', { returnObjects: true }),
      cta: t('studio_landing.pricing.free.cta'),
      highlight: false,
    },
    {
      name: t('studio_landing.pricing.pro.name'),
      price: '$29',
      period: t('studio_landing.pricing.perMonth'),
      features: t('studio_landing.pricing.pro.features', { returnObjects: true }),
      cta: t('studio_landing.pricing.pro.cta'),
      highlight: true,
    },
    {
      name: t('studio_landing.pricing.enterprise.name'),
      price: 'Custom',
      period: '',
      features: t('studio_landing.pricing.enterprise.features', { returnObjects: true }),
      cta: t('studio_landing.pricing.enterprise.cta'),
      highlight: false,
    },
  ];

  return (
    <div className="studio-page">
      <LandingHeader />
      <main className="studio-main">
        {/* Hero Section */}
        <section className="studio-hero section-padding">
          <div className="container-wide">
            <div className="studio-hero-content">

              <h1 className="studio-hero-title editorial-kern">
                {t('studio_landing.hero.titlePart1')} <span className="italic">{t('studio_landing.hero.titlePart2')}</span>
              </h1>
              <p className="studio-hero-description">
                {t('studio_landing.hero.description')}
              </p>
              <div className="studio-hero-actions">
                <Link to="/studio/quick-shoot" className="btn-hero-primary">
                  <span>{t('studio_landing.hero.launch')}</span>
                  <span className="material-symbols-outlined thin-icon">rocket_launch</span>
                </Link>
                <a href="https://youtu.be/F68UFG3i4R8" target="_blank" rel="noopener noreferrer" className="btn-hero-secondary">
                  <span>{t('studio_landing.hero.demo')}</span>
                  <span className="material-symbols-outlined thin-icon">play_circle</span>
                </a>>
              </div>
            </div>
          </div>
        </section>

        {/* Tools Section */}
        <section className="studio-tools-section section-padding">
          <div className="container-wide">
            <div className="section-header text-center">

              <h2 className="studio-section-title editorial-kern">
                {t('studio_landing.tools.titlePart1')} <span className="italic">{t('studio_landing.tools.titlePart2')}</span>
              </h2>
            </div>

            <div className="studio-tools-grid">
              {tools.map((tool) => (
                <div key={tool.title} className="studio-tool-card">
                  <div className="studio-tool-icon">
                    <span className="material-symbols-outlined thin-icon">{tool.icon}</span>
                  </div>
                  <h3 className="studio-tool-title">{tool.title}</h3>
                  <p className="studio-tool-description">{tool.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workspace Preview */}
        <section className="studio-preview-section section-padding">
          <div className="container-wide">
            <div className="studio-preview-grid">
              <div className="studio-preview-content">

                <h2 className="studio-preview-title editorial-kern">
                  {t('studio_landing.preview.titlePart1')} <span className="italic">{t('studio_landing.preview.titlePart2')}</span>
                </h2>
                <p className="studio-preview-description">
                  {t('studio_landing.preview.description')}
                </p>
                <ul className="studio-preview-features">
                  <li>
                    <span className="material-symbols-outlined thin-icon">check_circle</span>
                    {t('studio_landing.preview.f1')}
                  </li>
                  <li>
                    <span className="material-symbols-outlined thin-icon">check_circle</span>
                    {t('studio_landing.preview.f2')}
                  </li>
                  <li>
                    <span className="material-symbols-outlined thin-icon">check_circle</span>
                    {t('studio_landing.preview.f3')}
                  </li>
                  <li>
                    <span className="material-symbols-outlined thin-icon">check_circle</span>
                    {t('studio_landing.preview.f4')}
                  </li>
                </ul>
              </div>
              <div className="studio-preview-mockup">
                <div className="editorial-mockup-wrapper">
                  <div className="mockup-window">
                    <div className="mockup-window-header">
                      <div className="mockup-dots">
                        <span></span><span></span><span></span>
                      </div>
                      <div className="mockup-title">Catwalk Studio Pro</div>
                    </div>
                    <div className="mockup-window-content">
                      <div className="mockup-sidebar"></div>
                      <div className="mockup-canvas">
                        <div className="mockup-placeholder">
                          <span className="material-symbols-outlined thin-icon">auto_fix_high</span>
                        </div>
                      </div>
                      <div className="mockup-panel"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="studio-pricing-section section-padding">
          <div className="container-wide">
            <div className="section-header text-center">

              <h2 className="studio-section-title editorial-kern">
                {t('studio_landing.pricing.titlePart1')} <span className="italic">{t('studio_landing.pricing.titlePart2')}</span>
              </h2>
            </div>

            <div className="studio-pricing-grid">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`studio-pricing-card ${plan.highlight ? 'highlight' : ''}`}
                >
                  {plan.highlight && <div className="pricing-badge">{t('studio_landing.pricing.recommended')}</div>}
                  <h3 className="pricing-name">{plan.name}</h3>
                  <div className="pricing-value">
                    <span className="currency">$</span>
                    <span className="amount">{plan.price.replace('$', '')}</span>
                    <span className="period">{plan.period}</span>
                  </div>
                  <ul className="pricing-features">
                    {Array.isArray(plan.features) && plan.features.map((feature) => (
                      <li key={feature}>
                        <span className="material-symbols-outlined thin-icon">done</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className={`btn-pricing ${plan.highlight ? 'active' : ''}`}>
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}

export default StudioPage;
