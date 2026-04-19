import { useTranslation } from 'react-i18next';

export function FeaturesSection() {
  const { t } = useTranslation();
  
  const features = [
    {
      icon: 'calendar_today',
      title: t('landing.features.feature1.title'),
      description: t('landing.features.feature1.description')
    },
    {
      icon: 'token',
      title: t('landing.features.feature2.title'),
      description: t('landing.features.feature2.description')
    },
    {
      icon: 'auto_awesome',
      title: t('landing.features.feature3.title'),
      description: t('landing.features.feature3.description')
    }
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
