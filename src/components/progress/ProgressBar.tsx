import { BaseStage } from '@/types/conversation';
import { BASE_STAGES, PROGRESS_STEPS } from '@/utils/constants';
import { CheckIcon } from '@heroicons/react/24/outline';

interface ProgressBarProps {
  currentBase: BaseStage;
}

export default function ProgressBar({ currentBase }: ProgressBarProps) {
  const progressPercentage = PROGRESS_STEPS[currentBase] || 0;

  const getBaseIndex = (base: BaseStage) => {
    const index = BASE_STAGES.findIndex(b => b.key === base);
    return index >= 0 ? index : 0;
  };

  const currentIndex = getBaseIndex(currentBase);

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Your Journey</h3>
          <span className="text-sm font-medium text-homerun-blue">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-homerun-blue to-homerun-green h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-6">
        {BASE_STAGES.slice(0, 5).map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = stage.key === currentBase;

          return (
            <div
              key={stage.key}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                isCurrent
                  ? 'border-homerun-blue bg-blue-50 ring-4 ring-blue-200 ring-opacity-50'
                  : isCompleted
                  ? 'border-homerun-green bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isCompleted
                      ? 'bg-homerun-green text-white'
                      : isCurrent
                      ? 'bg-homerun-blue text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {isCurrent && (
                  <div className="w-2 h-2 bg-homerun-blue rounded-full animate-pulse"></div>
                )}
              </div>
              <div>
                <h4
                  className={`text-sm font-semibold mb-1 ${
                    isCurrent ? 'text-homerun-blue' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {stage.label}
                </h4>
                <p
                  className={`text-xs ${
                    isCurrent ? 'text-gray-700' : isCompleted ? 'text-gray-600' : 'text-gray-400'
                  }`}
                >
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}