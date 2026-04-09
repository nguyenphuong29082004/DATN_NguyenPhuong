import './WizardLayout.css';
import Header from '../Header';
import Footer from '../Footer';
import { ProgressBar } from '../../common';

export function WizardLayout({ 
  children,
  currentStep = 1,
  totalSteps = 5,
  progressLabel = 'Onboarding Progress',
  user,
  onBack,
  onNext,
  onSkip,
  backLabel,
  nextLabel,
  skipLabel,
  footerHint,
  showBack = true,
  nextDisabled = false,
}) {
  const progressPercent = Math.round((currentStep / totalSteps) * 100);
  
  return (
    <div className="wizard-layout">
      <Header 
        currentStep={currentStep}
        totalSteps={totalSteps}
        user={user}
      />
      
      <main className="wizard-layout__main">
        <div className="wizard-layout__container">
          <div className="wizard-layout__progress">
            <ProgressBar 
              value={progressPercent}
              label={progressLabel}
              size="xs"
            />
          </div>
          
          <div className="wizard-layout__content">
            {children}
          </div>
        </div>
      </main>
      
      <Footer 
        onBack={onBack}
        onNext={onNext}
        onSkip={onSkip}
        backLabel={backLabel}
        nextLabel={nextLabel}
        skipLabel={skipLabel}
        hint={footerHint}
        showBack={showBack}
        nextDisabled={nextDisabled}
      />
    </div>
  );
}

export default WizardLayout;
