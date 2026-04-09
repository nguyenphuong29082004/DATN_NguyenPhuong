export function FeaturesSection() {
  const features = [
    {
      icon: 'calendar_today',
      title: 'Real-Life Booking',
      description: 'Bespoke management for high-fashion campaigns, runway appearances, and global editorial placements.'
    },
    {
      icon: 'token',
      title: 'AI Licensing',
      description: 'Securely monetize your digital likeness. Our blockchain-verified licensing ensures you retain creative control.'
    },
    {
      icon: 'auto_awesome',
      title: 'Elite Visibility',
      description: 'Unparalleled exposure to creative directors from the world\'s most prestigious luxury houses.'
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
