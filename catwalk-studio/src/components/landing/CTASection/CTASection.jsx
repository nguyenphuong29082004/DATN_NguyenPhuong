export function CTASection() {
  return (
    <section className="cta-section">
      <div className="container-wide cta-container">
        <span className="cta-subtitle">Invitations Only</span>
        <h2 className="cta-title editorial-kern">Join the Elite.</h2>
        <p className="cta-description">
          Applications are reviewed on a rolling basis. We look for uniqueness, professionalism, and digital readiness.
        </p>
        <button
          className="btn-cta-large"
          onClick={() => window.location.href = '/models/register'}
        >
          Start Your Application
        </button>
        <p className="cta-footer-text">Limited Openings for Q4 2024</p>
      </div>
    </section>
  );
}

export default CTASection;
