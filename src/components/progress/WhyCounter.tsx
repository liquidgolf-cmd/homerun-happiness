interface WhyCounterProps {
  currentLevel: number;
}

export default function WhyCounter({ currentLevel }: WhyCounterProps) {
  const totalLevels = 5;
  const levels = Array.from({ length: totalLevels }, (_, i) => i + 1);

  const getProgressText = () => {
    const remaining = totalLevels - currentLevel;
    if (remaining === 0) {
      return 'Root insight discovered!';
    }
    if (remaining === 1) {
      return 'Reaching the root now...';
    }
    return `${remaining} more levels to go...`;
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">The 5 Whys</h3>
        <p className="text-sm text-gray-600">{getProgressText()}</p>
      </div>
      
      <div className="flex items-center gap-3">
        {levels.map((level) => {
          const isCompleted = level <= currentLevel;
          const isCurrent = level === currentLevel;
          
          return (
            <div key={level} className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  isCompleted
                    ? 'bg-loam-brown text-white shadow-md'
                    : 'bg-gray-200 text-gray-500'
                } ${
                  isCurrent ? 'ring-4 ring-loam-brown ring-opacity-30 scale-110' : ''
                }`}
              >
                {level}
              </div>
              {isCurrent && (
                <div className="mt-2 w-2 h-2 bg-loam-brown rounded-full animate-pulse"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}