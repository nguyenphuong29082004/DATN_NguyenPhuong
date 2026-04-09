import { Helmet } from 'react-helmet-async';
import './LandingPage.css';
import {
  LandingHeader,
  HeroSection,
  StatsSection,
  FeaturesSection,
  InterfaceSection,
  LandingFooter,
  MainTeaser,
} from '../../components/landing';

export function LandingPage() {
  return (
    <div className="landing-page">
      <Helmet>
        <title>Catwalk.AI — The Future of Fashion Modelling & AI Magic</title>
        <meta name="description" content="Catwalk.ai is the premier B2B platform for AI fashion models, virtual try-ons, and digital creative mastery. Bridging physical runways with virtual licensing." />
        <meta property="og:title" content="Catwalk.AI — AI Fashion & Modelling Dashboard" />
        <meta property="og:description" content="License your digital twin or book elite AI models for your next campaign." />
        <meta property="og:image" content="https://catwalk.ai/og-sharing.jpg" />
        <link rel="canonical" href={window.location.origin} />
      </Helmet>
      <LandingHeader />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <InterfaceSection />
        <MainTeaser />
      </main>
      <LandingFooter />
    </div>
  );
}

export default LandingPage;

