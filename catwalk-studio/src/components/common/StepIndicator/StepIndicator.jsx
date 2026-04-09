import './StepIndicator.css';

export function StepIndicator({ 
  currentStep = 1, 
  totalSteps = 5,
  className = '' 
}) {
  return (
    <div className={`step-indicator ${className}`}>
      <span className="step-indicator__text">
        Step {currentStep} of {totalSteps}
      </span>
    </div>
  );
}

export default StepIndicator;
