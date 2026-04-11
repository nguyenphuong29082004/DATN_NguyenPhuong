import { useLanguage } from '../../../contexts/LanguageContext';

export function StatsSection() {
  const { t } = useLanguage();

  return (
    <section className="stats-section">
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">{t('landing.stats.curatedTalent')}</span>
          <span className="stat-value">10k+</span>
        </div>
        <div className="stat-item stat-item--bordered">
          <span className="stat-label">{t('landing.stats.luxuryPartners')}</span>
          <span className="stat-value">500+</span>
        </div>
        <div className="stat-item stat-item--last">
          <span className="stat-label">{t('landing.stats.talentEarnings')}</span>
          <span className="stat-value">£2M+</span>
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
