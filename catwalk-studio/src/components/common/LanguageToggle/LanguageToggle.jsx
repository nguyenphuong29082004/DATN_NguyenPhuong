import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageToggle.css';

const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('en') ? 'vi' : 'en';
    i18n.changeLanguage(newLang);
  };

  const currentLang = i18n.language.startsWith('en') ? 'EN' : 'VI';

  return (
    <button 
      className="language-toggle" 
      onClick={toggleLanguage}
      aria-label="Toggle language"
    >
      <div className={`language-toggle__pill ${currentLang.toLowerCase()}`}>
        <span className={currentLang === 'EN' ? 'active' : ''}>EN</span>
        <span className={currentLang === 'VI' ? 'active' : ''}>VI</span>
      </div>
    </button>
  );
};

export default LanguageToggle;
