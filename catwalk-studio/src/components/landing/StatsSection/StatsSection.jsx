export function StatsSection() {
  return (
    <section className="stats-section">
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Curated Talent</span>
          <span className="stat-value">10k+</span>
        </div>
        <div className="stat-item stat-item--bordered">
          <span className="stat-label">Luxury Partners</span>
          <span className="stat-value">500+</span>
        </div>
        <div className="stat-item stat-item--last">
          <span className="stat-label">Talent Earnings</span>
          <span className="stat-value">£2M+</span>
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
