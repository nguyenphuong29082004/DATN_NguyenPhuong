import { useLanguage } from '../../../contexts/LanguageContext';

export function FeaturesSection() {
  const { t } = useLanguage();

  const features = [
    {
      icon: 'calendar_today',
      title: t('landing.features.realLifeBooking'),
      description: t('landing.features.realLifeBookingDesc'),
    },
    {
      icon: 'token',
      title: t('landing.features.aiLicensing'),
      description: t('landing.features.aiLicensingDesc'),
    },
    {
      icon: 'auto_awesome',
      title: t('landing.features.eliteVisibility'),
      description: t('landing.features.eliteVisibilityDesc'),
    },
  ];

  return (
    <section className="features-section">
      <div className="container-wide features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-item">
            <span className="material-symbols-outlined feature-icon thin-icon">{feature.icon}</span>
            <div className="feature-content">
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeaturesSection;
