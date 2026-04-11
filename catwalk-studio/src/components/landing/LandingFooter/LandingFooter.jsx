import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

export function LandingFooter() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLanguage();

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
            {t('footer.description')}
          </p>
        </div>

        {/* Expand Button - Only on mobile/tablet */}
        <button
          className="footer-expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <span className="footer-expand-text">{isExpanded ? t('common.showLess') : t('common.showMore')}</span>
          <span className={`material-symbols-outlined footer-expand-icon ${isExpanded ? 'open' : ''}`}>
            expand_more
          </span>
        </button>

        {/* Collapsible Footer Grid */}
        <div className={`footer-grid ${isExpanded ? 'open' : ''}`}>
          <div>
            <h5 className="footer-heading">{t('footer.pages')}</h5>
            <ul className="footer-links">
              <li className="footer-link-item"><Link to="/free-ai-fashion-designer">{t('footer.freeAiFashionDesigner')}</Link></li>
              <li className="footer-link-item"><Link to="/ai-fashion-models">{t('footer.aiFashionModels')}</Link></li>
              <li className="footer-link-item"><Link to="/ai-virtual-try-on">{t('footer.aiVirtualTryOn')}</Link></li>
              <li className="footer-link-item"><Link to="/ai-clothes-changer">{t('footer.aiClothesChanger')}</Link></li>
              <li className="footer-link-item"><Link to="/ai-fashion-stylist">{t('footer.aiFashionStylist')}</Link></li>
              <li className="footer-link-item"><Link to="/models/register/">{t('footer.becomeAiModel')}</Link></li>
              <li className="footer-link-item"><Link to="/hire-fashion-models">{t('footer.hireFashionModels')}</Link></li>
              <li className="footer-link-item"><Link to="/ai-model-photoshoot-shopify">{t('footer.aiModelPhotoshootShopify')}</Link></li>
              <li className="footer-link-item"><Link to="/ai-content-generation-for-brands">{t('footer.aiContentGeneration')}</Link></li>
              <li className="footer-link-item"><Link to="/fashion-photoshoot-vs-ai-models">{t('footer.fashionPhotoshootVsAi')}</Link></li>
              <li className="footer-link-item"><Link to="/models">{t('footer.fashionModels')}</Link></li>
              <li className="footer-link-item"><Link to="/gallery">{t('footer.galleryLink')}</Link></li>
              <li className="footer-link-item"><Link to="/app">{t('footer.downloadApp')}</Link></li>
              <li className="footer-link-item"><Link to="/help">{t('footer.faq')}</Link></li>
              <li className="footer-link-item"><Link to="/terms">{t('footer.legal')}</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="footer-heading">{t('footer.companyLegal')}</h5>
            <ul className="footer-links">
              <li className="footer-link-item"><Link to="/about">{t('footer.about')}</Link></li>
              <li className="footer-link-item"><Link to="/team">{t('footer.team')}</Link></li>
              <li className="footer-link-item"><Link to="/contact">{t('footer.contact')}</Link></li>
              <li className="footer-link-item"><Link to="/privacy">{t('footer.privacy')}</Link></li>
              <li className="footer-link-item"><Link to="/terms">{t('footer.terms')}</Link></li>
              <li className="footer-link-item"><Link to="/credits">{t('footer.credits')}</Link></li>
              <li className="footer-link-item"><Link to="/refund-policy">{t('footer.refundPolicy')}</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="footer-heading">{t('footer.fashionTryOnStyles')}</h5>
            <ul className="footer-links">
              <li className="footer-link-item"><Link to="/try-on/cocktail-dress">{t('footer.cocktailDress')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/old-money-outfit">{t('footer.oldMoneyOutfit')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/cyberpunk-leather-jacket">{t('footer.cyberpunkLeatherJacket')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/business-casual-office-outfit">{t('footer.businessCasualOffice')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/retro-90s-denim-look">{t('footer.retro90sDenim')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/punk-plaid-skirt">{t('footer.punkPlaidSkirt')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/bohemian-maxi-dress">{t('footer.bohemianMaxiDress')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/elegant-gown">{t('footer.elegantGown')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/oversized-streetwear-hoodie">{t('footer.oversizedStreetHoodie')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/futuristic-metallic-outfit">{t('footer.futuristicMetallic')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/chic-parisian-style-look">{t('footer.chicParisianStyle')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/white-wedding-dress">{t('footer.whiteWeddingDress')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/wedding-guest-dress">{t('footer.weddingGuestDress')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/luxury-fur-coat">{t('footer.luxuryFurCoat')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/hip-hop-oversized-tracksuit">{t('footer.hipHopTracksuit')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/evening-dinner-outfit">{t('footer.eveningDinnerOutfit')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/sequin-party-dress">{t('footer.sequinPartyDress')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/classic-trench-coat">{t('footer.classicTrenchCoat')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/ski-resort-outfit">{t('footer.skiResortOutfit')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/edgy-biker-jacket">{t('footer.edgyBikerJacket')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/sheer-evening-gown">{t('footer.sheerEveningGown')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/leather-clothes">{t('footer.leatherClothes')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/christmas-outfits">{t('footer.christmasOutfits')}</Link></li>
              <li className="footer-link-item"><Link to="/try-on/dating-outfits">{t('footer.datingOutfits')}</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="footer-heading">{t('footer.helpFaq')}</h5>
            <ul className="footer-links">
              <li className="footer-link-item"><Link to="/help#generate-ai-photos">{t('footer.helpGenerateAiPhotos')}</Link></li>
              <li className="footer-link-item"><Link to="/help#turn-prompts-into-fashion">{t('footer.helpTurnPrompts')}</Link></li>
              <li className="footer-link-item"><Link to="/help#youtube-fashion-ideas">{t('footer.helpYoutubeFashion')}</Link></li>
              <li className="footer-link-item"><Link to="/help#generate-3d-model">{t('footer.helpGenerate3d')}</Link></li>
              <li className="footer-link-item"><Link to="/help#upscale-photos-videos">{t('footer.helpUpscalePhotos')}</Link></li>
              <li className="footer-link-item"><Link to="/help#batch-try-on">{t('footer.helpBatchTryOn')}</Link></li>
              <li className="footer-link-item"><Link to="/help#virtual-try-ons-real-models">{t('footer.helpVirtualTryOns')}</Link></li>
              <li className="footer-link-item"><Link to="/help#make-ai-influencers">{t('footer.helpMakeAiInfluencers')}</Link></li>
              <li className="footer-link-item"><Link to="/help#fashion-shoots-videos">{t('footer.helpFashionShootsVideos')}</Link></li>
              <li className="footer-link-item"><Link to="/help#shopify-models">{t('footer.helpShopifyModels')}</Link></li>
              <li className="footer-link-item"><Link to="/help#change-background">{t('footer.helpChangeBackground')}</Link></li>
              <li className="footer-link-item"><Link to="/help#combine-photos">{t('footer.helpCombinePhotos')}</Link></li>
              <li className="footer-link-item"><Link to="/help#pricing">{t('footer.helpPricing')}</Link></li>
              <li className="footer-link-item"><Link to="/help#payment-refunds">{t('footer.helpPaymentRefunds')}</Link></li>
              <li className="footer-link-item"><Link to="/help#privacy-data">{t('footer.helpPrivacyData')}</Link></li>
              <li className="footer-link-item"><Link to="/help#commercial-rights">{t('footer.helpCommercialRights')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="copyright">{t('footer.copyright')}</span>
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
