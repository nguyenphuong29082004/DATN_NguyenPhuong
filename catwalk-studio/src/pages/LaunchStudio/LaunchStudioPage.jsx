import React from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import CreateCampaign from './pages/CreateCampaign';
import CampaignDetail from './pages/CampaignDetail';
import QuickShoot from './pages/QuickShoot';
import TryOn from './pages/TryOn';
import Prompts from './pages/Prompts';
import Account from './pages/Account';
import Designer from './pages/Designer';
import ModelsGenerator from './pages/ModelsGenerator';
import Credits from './pages/Credits';
import Library from './pages/Library';
import './LaunchStudioPage.css';

const MobileHeader = ({ onMenuToggle }) => {
    useTranslation();
    return (
        <div className="studio-mobile-header">
            <button className="hamburger-btn" onClick={onMenuToggle}>
                <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="mobile-logo">Catwalk Studio</div>
            <div className="mobile-utility"></div>
        </div>
    );
};

const LaunchStudioPage = () => {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

    const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);
    const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

    return (
        <div className="launch-studio-page">
            <MobileHeader onMenuToggle={toggleMobileSidebar} />
            <Sidebar isMobileOpen={isMobileSidebarOpen} onClose={closeMobileSidebar} />
            <div className="launch-studio-main">
                <Routes>
                    <Route path="campaigns" element={<CreateCampaign />} />
                    <Route path="campaigns/:campaignId" element={<CampaignDetail />} />
                    <Route path="quick-shoot" element={<QuickShoot />} />
                    <Route path="try-on" element={<TryOn />} />
                    <Route path="prompts" element={<Prompts />} />
                    <Route path="account" element={<Account />} />
                    <Route path="designer" element={<Designer />} />
                    <Route path="models" element={<ModelsGenerator />} />
                    <Route path="credits" element={<Credits />} />
                    <Route path="library" element={<Library />} />
                </Routes>
            </div>
        </div>
    );
};

export default LaunchStudioPage;

