import './Header.css';
import Logo from '../Logo';
import { StepIndicator, Avatar } from '../../common';

export function Header({ 
  currentStep,
  totalSteps,
  user,
  showStepIndicator = true,
  className = '' 
}) {
  return (
    <header className={`header ${className}`}>
      <div className="header__container">
        <Logo />
        
        <div className="header__right">
          {showStepIndicator && currentStep && (
            <StepIndicator 
              currentStep={currentStep} 
              totalSteps={totalSteps} 
              className="header__step-indicator"
            />
          )}
          
          {user && (
            <>
              <div className="header__divider" />
              <div className="header__user">
                <div className="header__user-info">
                  <span className="header__user-name">{user.name}</span>
                  <span className="header__user-role">{user.role}</span>
                </div>
                <Avatar 
                  src={user.avatar} 
                  alt={user.name} 
                  size="md"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
