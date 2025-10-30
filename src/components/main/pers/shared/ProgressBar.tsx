'use client';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  t: (key: string) => string;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div 
          className="bg-red-600 h-1 transition-all duration-300 ease-in-out" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}