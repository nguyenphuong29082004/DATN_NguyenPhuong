export function InterfaceSection() {
  return (
    <section className="interface-section">
      <div
        className="interface-bg"
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuChGkhwmx8U8xHlNAv0EqrChl6iazn1y4ZniyX48sQCyE7O92x5z36HBMtftbjWuqNxb8dZ6fjf43RioXAA6oBALkMgpjWceVONFoYSrwogIEhCv6eL7esUlTFSnAr9s7biROMX4wZeizZcWtZpFcr2nxa1OTs3ke2SnJH4jNFuVj1lkMfOa_3l9j0qtz7LU29L5DK_8isRhBXO5FbKavjaonGXWERTTTjXLcC7gYzbOYB8WkMTPHXOzatSNF_fkknAcMdz_EDeUFw')" }}
      ></div>
      <div className="container-wide interface-grid">
        <div className="interface-preview">
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-meta">
                <div className="profile-image-wrapper">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHf775cCr5cb0dSjvNlIvQSrtfHngEv0LxJAjp8K7OA7iByB5DuBLxyxu1JGBVEf-JfMnpyBfoyBJpopGcxlHBaPckWyk7UG1UNzfY7VRlldFdc7H7Wcnk4X76_MLT0h0s4jUEyHkFlLW9oz5NSh5BXVBNHftw0dg6mUAZsH1aDi7tAsF6f1n7NpA3Dv3KL4_VRJjedPkOvKtdjXf5w9R3aJsUsMxfLjhy04MeeoP675hhWZwhCqgRlFjBY2i1iXfWR3vgQqIUZy4"
                    alt="Model Profile"
                  />
                </div>
                <div className="profile-info">
                  <h4>Elena R.</h4>
                  <span className="verified-badge">Verified Professional</span>
                </div>
              </div>
              <span className="material-symbols-outlined thin-icon" style={{ opacity: 0.3 }}>more_horiz</span>
            </div>

            <div className="profile-stats">
              <div className="stat-group">
                <span className="stat-group-label">Height</span>
                <span className="stat-group-value">178 CM</span>
              </div>
              <div className="stat-group">
                <span className="stat-group-label">Status</span>
                <span className="stat-group-value stat-group-value--accent">Available</span>
              </div>
            </div>

            <div className="profile-tags">
              <span className="tag">Runway</span>
              <span className="tag">Editorial</span>
              <span className="tag tag--active">AI Synthetic</span>
            </div>

            <button className="btn-profile-request">
              Request Portfolio
            </button>
          </div>
        </div>

        <div className="interface-content">
          <span className="interface-subtitle">The Interface</span>
          <h2 className="interface-title">
            The Curator's <br />
            <span className="italic">Dashboard</span>
          </h2>
          <p className="interface-description">
            Seamlessly manage your professional trajectory. A minimal, high-contrast workspace designed for clarity and efficiency.
          </p>
          <div className="interface-list">
            <div className="list-item">
              <span className="material-symbols-outlined list-icon thin-icon">verified</span>
              <span className="list-text">Global Talent Exchange</span>
            </div>
            <div className="list-item">
              <span className="material-symbols-outlined list-icon thin-icon">lock_open</span>
              <span className="list-text">Smart Contract Integration</span>
            </div>
            <div className="list-item">
              <span className="material-symbols-outlined list-icon thin-icon">analytics</span>
              <span className="list-text">Royalty Tracking Engine</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default InterfaceSection;
