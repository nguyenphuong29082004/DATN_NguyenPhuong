import { Link } from 'react-router-dom';
import './StudioPage.css';
import { LandingHeader, LandingFooter } from '../../components/landing';
import { useLanguage } from '../../contexts/LanguageContext';

export function StudioPage() {
  const { t } = useLanguage();

  const tools = [
    {
      icon: 'photo_camera',
      title: t('studioPage.tools.photoEditor'),
      description: t('studioPage.tools.photoEditorDesc'),
    },
    {
      icon: 'auto_awesome',
      title: t('studioPage.tools.aiEnhancement'),
      description: t('studioPage.tools.aiEnhancementDesc'),
    },
    {
      icon: 'accessibility_new',
      title: t('studioPage.tools.poseLibrary'),
      description: t('studioPage.tools.poseLibraryDesc'),
    },
    {
      icon: 'light_mode',
      title: t('studioPage.tools.lightingSetup'),
      description: t('studioPage.tools.lightingSetupDesc'),
    },
    {
      icon: 'palette',
      title: t('studioPage.tools.colorGrading'),
      description: t('studioPage.tools.colorGradingDesc'),
    },
    {
      icon: 'view_in_ar',
      title: t('studioPage.tools.preview3d'),
      description: t('studioPage.tools.preview3dDesc'),
    },
  ];

  const plans = [
    {
      name: t('studioPage.plans.free'),
      price: '$0',
      period: t('studioPage.plans.forever'),
      features: [
        t('studioPage.plans.projects5'),
        t('studioPage.plans.basicEditingTools'),
        t('studioPage.plans.standardExports'),
        t('studioPage.plans.communitySupport'),
      ],
      cta: t('studioPage.plans.getStarted'),
      highlight: false,
    },
    {
      name: t('studioPage.plans.pro'),
      price: '$29',
      period: t('studioPage.plans.perMonth'),
      features: [
        t('studioPage.plans.unlimitedProjects'),
        t('studioPage.plans.aiEnhancement'),
        t('studioPage.plans.allEditingTools'),
        t('studioPage.plans.exports4k'),
        t('studioPage.plans.prioritySupport'),
      ],
      cta: t('studioPage.plans.startProTrial'),
      highlight: true,
    },
    {
      name: t('studioPage.plans.enterprise'),
      price: t('studioPage.plans.custom'),
      period: '',
      features: [
        t('studioPage.plans.everythingInPro'),
        t('studioPage.plans.teamCollaboration'),
        t('studioPage.plans.apiAccess'),
        t('studioPage.plans.customIntegrations'),
        t('studioPage.plans.dedicatedSupport'),
      ],
      cta: t('studioPage.plans.contactSales'),
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
              <div className="subtitle-group justify-center">
                <div className="subtitle-line"></div>
                <span className="subtitle-text">{t('studioPage.subtitle')}</span>
                <div className="subtitle-line"></div>
              </div>
              <h1 className="studio-hero-title editorial-kern">
                {t('studioPage.heroTitle1')} <span className="italic">{t('studioPage.heroTitle2')}</span>
              </h1>
              <p className="studio-hero-description">
                {t('studioPage.heroDescription')}
              </p>
              <div className="studio-hero-actions">
                <Link to="/studio/quick-shoot" className="btn-hero-primary">
                  <span>{t('studioPage.launchStudio')}</span>
                  <span className="material-symbols-outlined thin-icon">rocket_launch</span>
                </Link>
                <button className="btn-hero-secondary">
                  <span>{t('studioPage.watchDemo')}</span>
                  <span className="material-symbols-outlined thin-icon">play_circle</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Tools Section */}
        <section className="studio-tools-section section-padding">
          <div className="container-wide">
            <div className="section-header text-center">
              <div className="subtitle-group justify-center">
                <div className="subtitle-line"></div>
                <span className="subtitle-text">{t('studioPage.theSuite')}</span>
                <div className="subtitle-line"></div>
              </div>
              <h2 className="studio-section-title editorial-kern">
                {t('studioPage.powerfulTools')} <span className="italic">{t('studioPage.powerfulToolsItalic')}</span>
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
                <div className="subtitle-group">
                  <div className="subtitle-line"></div>
                  <span className="subtitle-text">{t('studioPage.theInterface')}</span>
                </div>
                <h2 className="studio-preview-title editorial-kern">
                  {t('studioPage.intuitiveWorkspace')} <span className="italic">{t('studioPage.intuitiveWorkspaceItalic')}</span>
                </h2>
                <p className="studio-preview-description">
                  {t('studioPage.workspaceDescription')}
                </p>
                <ul className="studio-preview-features">
                  <li>
                    <span className="material-symbols-outlined thin-icon">check_circle</span>
                    {t('studioPage.dragDropTimeline')}
                  </li>
                  <li>
                    <span className="material-symbols-outlined thin-icon">check_circle</span>
                    {t('studioPage.realtimeCollaboration')}
                  </li>
                  <li>
                    <span className="material-symbols-outlined thin-icon">check_circle</span>
                    {t('studioPage.cloudSync')}
                  </li>
                  <li>
                    <span className="material-symbols-outlined thin-icon">check_circle</span>
                    {t('studioPage.proKeyboardShortcuts')}
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
              <div className="subtitle-group justify-center">
                <div className="subtitle-line"></div>
                <span className="subtitle-text">{t('studioPage.membership')}</span>
                <div className="subtitle-line"></div>
              </div>
              <h2 className="studio-section-title editorial-kern">
                {t('studioPage.elevateYourCraft')} <span className="italic">{t('studioPage.elevateYourCraftItalic')}</span>
              </h2>
            </div>

            <div className="studio-pricing-grid">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`studio-pricing-card ${plan.highlight ? 'highlight' : ''}`}
                >
                  {plan.highlight && <div className="pricing-badge">{t('studioPage.plans.recommended')}</div>}
                  <h3 className="pricing-name">{plan.name}</h3>
                  <div className="pricing-value">
                    <span className="currency">{plan.price === t('studioPage.plans.custom') ? '' : '$'}</span>
                    <span className="amount">{plan.price.replace('$', '')}</span>
                    <span className="period">{plan.period}</span>
                  </div>
                  <ul className="pricing-features">
                    {plan.features.map((feature) => (
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
