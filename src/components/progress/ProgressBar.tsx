import { useNavigate } from 'react-router-dom';
import { BaseStage } from '@/types/conversation';
import { BASE_STAGES, PROGRESS_STEPS } from '@/utils/constants';
import { CheckIcon } from '@heroicons/react/24/outline';
import { CompletedStages } from '@/hooks/useBaseProgress';

interface ProgressBarProps {
  currentBase: BaseStage;
  completedStages?: CompletedStages;
  onStageClick?: (stage: BaseStage) => void;
}

const BASE_STAGE_ROUTES: Record<BaseStage, string> = {
  at_bat: '/at-bat',
  first_base: '/first-base',
  second_base: '/second-base',
  third_base: '/third-base',
  home_plate: '/home-plate',
  completed: '/report',
};

export default function ProgressBar({ currentBase, completedStages, onStageClick }: ProgressBarProps) {
  const navigate = useNavigate();
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
          <span className="text-sm font-medium text-loam-brown">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-loam-neutral rounded-full h-2">
          <div
            className="bg-gradient-to-r from-loam-brown to-loam-green h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-6">
        {BASE_STAGES.slice(0, 5).map((stage, index) => {
          const isCompleted = completedStages 
            ? completedStages[stage.key as keyof CompletedStages] || false
            : index < currentIndex;
          const isCurrent = stage.key === currentBase;
          const isClickable = isCompleted && !isCurrent;
          const route = BASE_STAGE_ROUTES[stage.key];

          const handleClick = () => {
            if (isClickable && route) {
              if (onStageClick) {
                onStageClick(stage.key);
              }
              navigate(route);
            }
          };

          return (
            <div
              key={stage.key}
              onClick={handleClick}
              className={`relative p-4 rounded-loam border-2 transition-all ${
                isCurrent
                  ? 'border-loam-brown bg-loam-neutral ring-4 ring-loam-brown ring-opacity-20'
                  : isCompleted
                  ? 'border-loam-green bg-loam-highlight bg-opacity-10'
                  : 'border-gray-200 bg-loam-neutral bg-opacity-30'
              } ${
                isClickable 
                  ? 'cursor-pointer hover:shadow-md hover:scale-105 hover:border-loam-green/50' 
                  : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isCompleted
                      ? 'bg-loam-green text-white'
                      : isCurrent
                      ? 'bg-loam-brown text-white'
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
                  <div className="w-2 h-2 bg-loam-brown rounded-full animate-pulse"></div>
                )}
              </div>
              <div>
                <h4
                  className={`text-sm font-semibold mb-1 ${
                    isCurrent ? 'text-loam-brown' : isCompleted ? 'text-loam-charcoal' : 'text-gray-500'
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