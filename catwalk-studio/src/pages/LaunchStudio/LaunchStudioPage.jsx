import React from 'react';
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
import './LaunchStudioPage.css';

const LaunchStudioPage = () => {
    // Auth is handled globally by AuthProvider - no need to register here

    return (
        <div className="launch-studio-page">
            <Sidebar />
            <Routes>
                {/* <Route index element={<LaunchDashboard />} /> Index is handled by Landing Page at /studio */}
                <Route path="create-campaign" element={<CreateCampaign />} />
                <Route path="create-campaign/:campaignId" element={<CampaignDetail />} />
                <Route path="quick-shoot" element={<QuickShoot />} />
                <Route path="try-on" element={<TryOn />} />
                <Route path="prompts" element={<Prompts />} />
                <Route path="account" element={<Account />} />
                <Route path="designer" element={<Designer />} />
                <Route path="models" element={<ModelsGenerator />} />
            </Routes>
        </div>
    );
};

export default LaunchStudioPage;

