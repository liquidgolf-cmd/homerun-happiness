interface WhyCounterProps {
  currentLevel: number;
}

const DEPTH_STEPS = 5; // HomeRun Method depth – not shown to user

export default function WhyCounter({ currentLevel }: WhyCounterProps) {
  const steps = Array.from({ length: DEPTH_STEPS }, (_, i) => i + 1);

  const getProgressText = () => {
    const remaining = DEPTH_STEPS - currentLevel;
    if (remaining === 0) {
      return 'Root insight discovered!';
    }
    if (remaining === 1) {
      return 'Reaching the root...';
    }
    return 'Going deeper...';
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">HomeRun depth</h3>
        <p className="text-sm text-gray-600">{getProgressText()}</p>
      </div>
      
      <div className="flex items-center gap-3">
        {steps.map((step) => {
          const isCompleted = step <= currentLevel;
          const isCurrent = step === currentLevel;
          
          return (
            <div key={step} className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-loam-brown shadow-md'
                    : 'bg-gray-200'
                } ${
                  isCurrent ? 'ring-4 ring-loam-brown ring-opacity-30 scale-110' : ''
                }`}
                aria-hidden
              />
              {isCurrent && (
                <div className="mt-2 w-2 h-2 bg-loam-brown rounded-full animate-pulse" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}