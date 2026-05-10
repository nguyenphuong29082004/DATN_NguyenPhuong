import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import { useAuth } from './contexts/AuthContext';

// Lazy load all pages for better code splitting
// This reduces initial bundle size and improves FCP/LCP
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));
const ModelsPage = lazy(() => import('./pages/Models/ModelsPage'));
const StudioPage = lazy(() => import('./pages/Studio/StudioPage'));
const LaunchStudioPage = lazy(() => import('./pages/LaunchStudio/LaunchStudioPage'));
const BecomeModelPage = lazy(() => import('./pages/BecomeModel/BecomeModelPage'));
const ModelProfilePage = lazy(() => import('./pages/ModelProfile/ModelProfilePage'));
const GalleryPage = lazy(() => import('./pages/Gallery/GalleryPage'));
const GalleryDetailPage = lazy(() => import('./pages/Gallery/GalleryDetailPage'));
const LoginPage = lazy(() => import('./pages/Login/LoginPage'));
const BecomeModelForm = lazy(() => import('./pages/LaunchStudio/pages/BecomeModel'));
const HelpPage = lazy(() => import('./pages/Help/HelpPage'));
const AppDownloadPage = lazy(() => import('./pages/AppDownload/AppDownloadPage'));

import Sidebar from './components/Sidebar/Sidebar';
import './pages/LaunchStudio/LaunchStudioPage.css';

// Loading fallback component
function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader__spinner"></div>
    </div>
  );
}

const StudioLayout = ({ children }) => (
  <div className="launch-studio-page">
    <Sidebar />
    {children}
  </div>
);

const RequireGuest = ({ children }) => {
  const { user, initialized, signInAsGuest } = useAuth();

  useEffect(() => {
    if (initialized && !user) {
      signInAsGuest();
    }
  }, [initialized, user, signInAsGuest]);

  return children;
};

const RequireRealAuth = ({ children }) => {
  const { user, initialized, isAnonymous, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized && !loading && (!user || isAnonymous)) {
      // Redirect to login if not logged in or only a guest
      const returnPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/login?returnTo=${returnPath}`;
    }
  }, [initialized, loading, user, isAnonymous, navigate]);

  if (!initialized || loading || !user || isAnonymous) {
    return <PageLoader />;
  }

  return children;
};

import ScrollToTop from './components/common/ScrollToTop/ScrollToTop';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<AppDownloadPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/models/:username" element={<ModelProfilePage />} />
          
          <Route path="/models/register" element={
            <RequireRealAuth>
              <BecomeModelForm />
            </RequireRealAuth>
          } />
          
          <Route path="/studio" element={
            <RequireGuest>
              <StudioPage />
            </RequireGuest>
          } />
          <Route path="/studio/*" element={
            <RequireGuest>
              <LaunchStudioPage />
            </RequireGuest>
          } />
          
          <Route path="/become-model" element={
            <RequireRealAuth>
              <BecomeModelPage />
            </RequireRealAuth>
          } />
          
          <Route path="/help" element={<HelpPage />} />

          {/* Gallery Routes */}
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/gallery/:slug" element={<GalleryDetailPage />} />

          {/* Root-level model profile (SRS: catwalk.ai/{username}) — MUST be last */}
          <Route path="/:username" element={<ModelProfilePage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
