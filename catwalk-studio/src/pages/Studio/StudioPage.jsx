import { Link } from 'react-router-dom';
import './StudioPage.css';
import { LandingHeader, LandingFooter } from '../../components/landing';
const tools = [
  {
    icon: 'photo_camera',
    title: 'Photo Editor',
    description: 'Professional-grade editing tools for perfect shots every time.',
  },
  {
    icon: 'auto_awesome',
    title: 'AI Enhancement',
    description: 'Intelligent retouching and enhancement powered by AI.',
  },
  {
    icon: 'accessibility_new',
    title: 'Pose Library',
    description: 'Extensive collection of poses with real-time guidance.',
  },
  {
    icon: 'light_mode',
    title: 'Lighting Setup',
    description: 'Virtual lighting studio with realistic simulations.',
  },
  {
    icon: 'palette',
    title: 'Color Grading',
    description: 'Cinema-quality color correction and grading tools.',
  },
  {
    icon: 'view_in_ar',
    title: '3D Preview',
    description: 'Visualize your work in immersive 3D environments.',
  },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['5 projects/month', 'Basic editing tools', 'Standard exports', 'Community support'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    features: ['Unlimited projects', 'AI enhancement', 'All editing tools', '4K exports', 'Priority support'],
    cta: 'Start Pro Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: ['Everything in Pro', 'Team collaboration', 'API access', 'Custom integrations', 'Dedicated support'],
    cta: 'Contact Sales',
    highlight: false,
  },
];

export function StudioPage() {
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
                <span className="subtitle-text">Creative Workspace</span>
                <div className="subtitle-line"></div>
              </div>
              <h1 className="studio-hero-title editorial-kern">
                Catwalk <span className="italic">Studio</span>
              </h1>
              <p className="studio-hero-description">
                The ultimate creative suite for fashion photography and AI modeling.
                Professional tools designed for modern creators to bridge the gap between
                imagination and reality.
              </p>
              <div className="studio-hero-actions">
                <Link to="/studio/quick-shoot" className="btn-hero-primary">
                  <span>Launch Studio</span>
                  <span className="material-symbols-outlined thin-icon">rocket_launch</span>
                </Link>
                <button className="btn-hero-secondary">
                  <span>Watch Demo</span>
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
                <span className="subtitle-text">The Suite</span>
                <div className="subtitle-line"></div>
              </div>
              <h2 className="studio-section-title editorial-kern">
                Powerful <span className="italic">Tools</span>
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
                  <span className="subtitle-text">The Interface</span>
                </div>
                <h2 className="studio-preview-title editorial-kern">
                  Intuitive <span className="italic">Workspace</span>
                </h2>
                <p className="studio-preview-description">
                  A clean, modern interface that puts creativity first.
                  Customize your workspace to match your unique workflow and
                  unlock new levels of productivity.
                </p>
                <ul className="studio-preview-features">
                  <li>
                    <span className="material-symbols-outlined thin-icon">check_circle</span>
                    Drag-and-drop timeline
                  </li>
                  <li>
                    <span className="material-symbols-outlined thin-icon">check_circle</span>
                    Real-time collaboration
                  </li>
                  <li>
                    <span className="material-symbols-outlined thin-icon">check_circle</span>
                    Cloud sync across devices
                  </li>
                  <li>
                    <span className="material-symbols-outlined thin-icon">check_circle</span>
                    Pro keyboard shortcuts
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
                <span className="subtitle-text">Membership</span>
                <div className="subtitle-line"></div>
              </div>
              <h2 className="studio-section-title editorial-kern">
                Elevate Your <span className="italic">Craft</span>
              </h2>
            </div>

            <div className="studio-pricing-grid">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`studio-pricing-card ${plan.highlight ? 'highlight' : ''}`}
                >
                  {plan.highlight && <div className="pricing-badge">Recommended</div>}
                  <h3 className="pricing-name">{plan.name}</h3>
                  <div className="pricing-value">
                    <span className="currency">$</span>
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
