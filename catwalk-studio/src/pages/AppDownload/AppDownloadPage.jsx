import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_STORE_URL, navigateToAppDownload } from '../../utils/appDownloadRedirect';

export default function AppDownloadPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigateToAppDownload({
      userAgent: navigator.userAgent,
      hasMSStream: Boolean(window.MSStream),
      navigate,
      replaceLocation: (url) => {
        window.location.href = url;
      },
    });
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '32rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#111827' }}>
          Redirecting to App Store...
        </h1>
        <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
          If you are not redirected automatically, use the link below.
        </p>
        <a href={APP_STORE_URL} style={{ color: '#2563eb' }}>
          Download Catwalk.AI on the App Store
        </a>
      </div>
    </div>
  );
}
