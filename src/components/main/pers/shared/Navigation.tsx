'use client';

interface NavigationProps {
  currentStep: number;
  totalSteps: number;
  isLoading?: boolean;
  canGoBack?: boolean;
  canSkip?: boolean;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  backLabel?: string;
  skipLabel?: string;
  t: (key: string) => string;
}

export default function Navigation({
  currentStep,
  totalSteps,
  isLoading = false,
  canGoBack = true,
  canSkip = false,
  onNext,
  onBack,
  onSkip,
  nextLabel,
  backLabel,
  skipLabel,
  t
}: NavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  const getNextLabel = () => {
    if (nextLabel) return nextLabel;
    if (isLastStep) return t('form.finalize') || 'Finalizar';
    return t('form.nextStep') || 'Próximo';
  };

  const getBackLabel = () => {
    if (backLabel) return backLabel;
    return t('form.previous') || 'Anterior';
  };

  const getSkipLabel = () => {
    if (skipLabel) return skipLabel;
    return t('form.skip') || 'Pular';
  };

  return (
    <div className="flex justify-between items-center mb-10">
      {/* Back button */}
      <div className="flex-1">
        {!isFirstStep && canGoBack && onBack && (
          <button
            onClick={onBack}
            disabled={isLoading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← {getBackLabel()}
          </button>
        )}
      </div>

      {/* Skip button (center) */}
      <div className="flex-1 flex justify-center">
        {canSkip && onSkip && (
          <button
            onClick={onSkip}
            disabled={isLoading}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors underline"
          >
            {getSkipLabel()}
          </button>
        )}
      </div>

      {/* Next button */}
      <div className="flex-1 flex justify-end">
        <button
          onClick={() => {
            console.log('🔘 Botão Finalizar clicado no Navigation');
            console.log('🔘 onNext function:', onNext);
            if (onNext) {
              console.log('🔘 Chamando onNext...');
              onNext();
            } else {
              console.log('❌ onNext não está definido!');
            }
          }}
          disabled={isLoading || !onNext}
          className="px-4 py-3 bg-red-600 font-fertigo text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('form.loading') || 'Carregando...'}
            </>
          ) : (
            <>
              {getNextLabel()}
              <span className="text-white text-sm ml-2">
                {currentStep}/{totalSteps}
              </span>
              {!isLastStep && <span>→</span>}
            </>
          )}
        </button>
      </div>
    </div>
  );
}