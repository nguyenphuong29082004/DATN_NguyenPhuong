import { useTranslation } from 'react-i18next';

export function StatsSection() {
  const { t } = useTranslation();
  
  return (
    <section className="stats-section">
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">{t('landing.stats.talent')}</span>
          <span className="stat-value">10k<span>+</span></span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{t('landing.stats.partners')}</span>
          <span className="stat-value">500<span>+</span></span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{t('landing.stats.earnings')}</span>
          <span className="stat-value">£2M<span>+</span></span>
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
