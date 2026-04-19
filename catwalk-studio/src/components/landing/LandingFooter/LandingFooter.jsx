import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { handleAppDownloadLinkClick } from '../../../utils/appDownloadRedirect';

export function LandingFooter() {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const handleGetAppClick = (event) => {
    handleAppDownloadLinkClick(event, {
      userAgent: navigator.userAgent,
      hasMSStream: Boolean(window.MSStream),
      navigate,
      replaceLocation: (url) => {
        window.location.href = url;
      },
    });
  };

  return (
    <footer className="footer">
      <div className="container-wide">
        {/* Brand Section - Always visible */}
        <div className="footer-brand-section">
          <div className="footer-brand">
            <span className="material-symbols-outlined nav-logo-icon thin-icon">adjust</span>
            <span className="footer-logo-text">Catwalk.AI</span>
          </div>
          <p className="footer-description">
            Redefining the standards of the fashion industry through the ethical application of artificial intelligence and premium talent representation.
          </p>
        </div>

        {/* Expand Button - Only on mobile/tablet */}
        <button
          className="footer-expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <span className="footer-expand-text">{isExpanded ? 'Show Less' : 'Show More'}</span>
          <span className={`material-symbols-outlined footer-expand-icon ${isExpanded ? 'open' : ''}`}>
            expand_more
          </span>
        </button>

        {/* Collapsible Footer Grid */}
        <div className={`footer-grid ${isExpanded ? 'open' : ''}`}>
          <div>
            <h5 className="footer-heading">Pages</h5>
            <ul className="footer-links">
              <li className="footer-link-item"><Link to="/free-ai-fashion-designer">Free AI Fashion Designer</Link></li>
              <li className="footer-link-item"><Link to="/ai-fashion-models">AI Fashion Models</Link></li>
              <li className="footer-link-item"><Link to="/ai-virtual-try-on">AI Virtual Try On</Link></li>
              <li className="footer-link-item"><Link to="/ai-clothes-changer">AI Clothes Changer</Link></li>
              <li className="footer-link-item"><Link to="/ai-fashion-stylist">AI Fashion Stylist</Link></li>
              <li className="footer-link-item"><Link to="/models/register/">Become an AI Fashion Model</Link></li>
              <li className="footer-link-item"><Link to="/hire-fashion-models">Hire Fashion Models</Link></li>
              <li className="footer-link-item"><Link to="/ai-model-photoshoot-shopify">AI Model Photoshoot for Shopify</Link></li>
              <li className="footer-link-item"><Link to="/ai-content-generation-for-brands">AI Content Generation for Brands</Link></li>
              <li className="footer-link-item"><Link to="/fashion-photoshoot-vs-ai-models">Fashion Photoshoot vs AI Models</Link></li>
              <li className="footer-link-item"><Link to="/models">Fashion Models</Link></li>
              <li className="footer-link-item"><Link to="/gallery">Gallery</Link></li>
              <li className="footer-link-item"><Link to="/app" onClick={handleGetAppClick}>Download the App</Link></li>
              <li className="footer-link-item"><Link to="/help">FAQ</Link></li>
              <li className="footer-link-item"><Link to="/terms">Legal</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="footer-heading">Company &amp; Legal</h5>
            <ul className="footer-links">
              <li className="footer-link-item"><Link to="/about">About</Link></li>
              <li className="footer-link-item"><Link to="/team">Team</Link></li>
              <li className="footer-link-item"><Link to="/contact">Contact</Link></li>
              <li className="footer-link-item"><Link to="/privacy">Privacy</Link></li>
              <li className="footer-link-item"><Link to="/terms">Terms</Link></li>
              <li className="footer-link-item"><Link to="/credits">Credits</Link></li>
              <li className="footer-link-item"><Link to="/refund-policy">Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="footer-heading">Fashion Try-On Styles</h5>
            <ul className="footer-links">
              <li className="footer-link-item"><Link to="/try-on/cocktail-dress">Cocktail Dress</Link></li>
              <li className="footer-link-item"><Link to="/try-on/old-money-outfit">Old Money Outfit</Link></li>
              <li className="footer-link-item"><Link to="/try-on/cyberpunk-leather-jacket">Cyberpunk Leather Jacket</Link></li>
              <li className="footer-link-item"><Link to="/try-on/business-casual-office-outfit">Business Casual Office Outfit</Link></li>
              <li className="footer-link-item"><Link to="/try-on/retro-90s-denim-look">Retro 90s Denim Look</Link></li>
              <li className="footer-link-item"><Link to="/try-on/punk-plaid-skirt">Punk Plaid Skirt</Link></li>
              <li className="footer-link-item"><Link to="/try-on/bohemian-maxi-dress">Bohemian Maxi Dress</Link></li>
              <li className="footer-link-item"><Link to="/try-on/elegant-gown">Elegant Gown</Link></li>
              <li className="footer-link-item"><Link to="/try-on/oversized-streetwear-hoodie">Oversized Streetwear Hoodie</Link></li>
              <li className="footer-link-item"><Link to="/try-on/futuristic-metallic-outfit">Futuristic Metallic Outfit</Link></li>
              <li className="footer-link-item"><Link to="/try-on/chic-parisian-style-look">Chic Parisian Style Look</Link></li>
              <li className="footer-link-item"><Link to="/try-on/white-wedding-dress">White Wedding Dress</Link></li>
              <li className="footer-link-item"><Link to="/try-on/wedding-guest-dress">Wedding Guest Dress</Link></li>
              <li className="footer-link-item"><Link to="/try-on/luxury-fur-coat">Luxury Fur Coat</Link></li>
              <li className="footer-link-item"><Link to="/try-on/hip-hop-oversized-tracksuit">Hip Hop Oversized Tracksuit</Link></li>
              <li className="footer-link-item"><Link to="/try-on/evening-dinner-outfit">Evening Dinner Outfit</Link></li>
              <li className="footer-link-item"><Link to="/try-on/sequin-party-dress">Sequin Party Dress</Link></li>
              <li className="footer-link-item"><Link to="/try-on/classic-trench-coat">Classic Trench Coat</Link></li>
              <li className="footer-link-item"><Link to="/try-on/ski-resort-outfit">Ski Resort Outfit</Link></li>
              <li className="footer-link-item"><Link to="/try-on/edgy-biker-jacket">Edgy Biker Jacket</Link></li>
              <li className="footer-link-item"><Link to="/try-on/sheer-evening-gown">Sheer Evening Gown</Link></li>
              <li className="footer-link-item"><Link to="/try-on/leather-clothes">Leather Clothes</Link></li>
              <li className="footer-link-item"><Link to="/try-on/christmas-outfits">Christmas Outfits</Link></li>
              <li className="footer-link-item"><Link to="/try-on/dating-outfits">Dating Outfits</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="footer-heading">Help &amp; FAQ</h5>
            <ul className="footer-links">
              <li className="footer-link-item"><Link to="/help#generate-ai-photos">Generate AI photos and videos of yourself</Link></li>
              <li className="footer-link-item"><Link to="/help#turn-prompts-into-fashion">Turn prompts into stunning fashion ideas</Link></li>
              <li className="footer-link-item"><Link to="/help#youtube-fashion-ideas">How to create AI fashion ideas for YouTube</Link></li>
              <li className="footer-link-item"><Link to="/help#generate-3d-model">Generate a 3D model from a photo</Link></li>
              <li className="footer-link-item"><Link to="/help#upscale-photos-videos">Upscale your AI fashion photos and videos</Link></li>
              <li className="footer-link-item"><Link to="/help#batch-try-on">Batch Try On Clothes</Link></li>
              <li className="footer-link-item"><Link to="/help#virtual-try-ons-real-models">Generate virtual try ons with real models</Link></li>
              <li className="footer-link-item"><Link to="/help#make-ai-influencers">How to make AI fashion influencers</Link></li>
              <li className="footer-link-item"><Link to="/help#fashion-shoots-videos">How to create fashion shoots AI videos</Link></li>
              <li className="footer-link-item"><Link to="/help#shopify-models">Put clothes on models for Shopify store</Link></li>
              <li className="footer-link-item"><Link to="/help#change-background">How to change background of photos with AI</Link></li>
              <li className="footer-link-item"><Link to="/help#combine-photos">How to combine photos with AI</Link></li>
              <li className="footer-link-item"><Link to="/help#pricing">Pricing and subscription plans</Link></li>
              <li className="footer-link-item"><Link to="/help#payment-refunds">Payment methods and refunds</Link></li>
              <li className="footer-link-item"><Link to="/help#privacy-data">Data deletion and privacy</Link></li>
              <li className="footer-link-item"><Link to="/help#commercial-rights">Commercial usage rights</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="copyright">© 2026 Catwalk.AI Digital Agency</span>
          <div className="social-links">
            <a href="#" className="social-link">Instagram</a>
            <a href="#" className="social-link">TikTok</a>
            <a href="#" className="social-link">X</a>
            <a href="#" className="social-link">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
