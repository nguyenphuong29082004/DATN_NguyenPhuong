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
        <title>Catwalk.AI — Professional AI Fashion & Modelling Studio</title>
        <meta name="description" content="The premier B2B platform for AI fashion models, virtual try-ons, and digital creative mastery. Bridging physical runways with virtual licensing for brands and agencies." />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://catwalk.ai/" />
        <meta property="og:title" content="Catwalk.AI — The Future of Fashion Photography" />
        <meta property="og:description" content="Create stunning AI fashion content, license digital twins, and book elite AI models for global campaigns." />
        <meta property="og:image" content="https://catwalk.ai/og-main.jpg" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Catwalk.AI — AI Fashion Photography" />
        <meta name="twitter:description" content="Revolutionizing fashion media with high-end AI modelling and virtual try-on technology." />
        <meta name="twitter:image" content="https://catwalk.ai/og-main.jpg" />
        
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.origin : 'https://catwalk.ai'} />
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

