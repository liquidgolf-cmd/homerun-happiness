import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useConversation';
import { JourneyType } from '@/types/conversation';
import { getRedirectPath } from '@/utils/routing';

export default function PathSelection() {
  const { user, loading: authLoading } = useAuth();
  const { startNewConversation, conversation, loading: convLoading } = useConversation(user?.id);
  const navigate = useNavigate();
  const location = useLocation();
  
  const assessmentData = location.state || {};
  const { recommendedPath } = assessmentData;
  
  const [selectedPath, setSelectedPath] = useState<JourneyType | null>(
    recommendedPath || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingProgress, setCheckingProgress] = useState(true);

  // Auto-redirect if user has already started a conversation
  useEffect(() => {
    const checkProgress = async () => {
      if (authLoading || convLoading || !user?.id) {
        setCheckingProgress(false);
        return;
      }

      // If conversation already exists, redirect to current base
      if (conversation) {
        try {
          const redirectPath = await getRedirectPath(user.id);
          // If redirect path is not path-selection, user has already started
          if (redirectPath !== '/path-selection') {
            navigate(redirectPath, { replace: true });
            return;
          }
        } catch (err) {
          console.error('Error checking progress:', err);
          // Continue to show path selection if check fails
        }
      }
      
      setCheckingProgress(false);
    };

    checkProgress();
  }, [user?.id, authLoading, convLoading, conversation, navigate]);

  const handlePathSelect = async (path: JourneyType) => {
    setSelectedPath(path);
    setError(null);

    if (!user?.id) {
      setError('Please sign in to continue');
      return;
    }

    setLoading(true);
    try {
      // Try to start conversation, but continue even if it fails (duplicate conversation)
      await startNewConversation(path);
      
      // Always navigate to At Bat regardless of save status
      navigate('/at-bat');
    } catch (err) {
      // Even if conversation creation fails, try to continue
      console.warn('Conversation creation warning:', err);
      navigate('/at-bat');
    }
  };

  // Show loading state while checking progress
  if (checkingProgress || authLoading || convLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-loam-brown"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-loam-neutral to-loam-neutral px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Path</h1>
          <p className="text-gray-600">
            Based on your assessment, we recommend the <strong className="text-loam-brown">
              {recommendedPath === 'business' ? 'Business Journey' : 'Personal Life Journey'}
            </strong>
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-loam text-sm">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Business Path */}
          <div
            className={`bg-white rounded-2xl shadow-lg p-8 border-2 cursor-pointer transition-all ${
              selectedPath === 'business'
                ? 'border-loam-brown ring-4 ring-blue-200 ring-opacity-50'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !loading && handlePathSelect('business')}
          >
            <div className="text-center mb-6">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 ${
                  selectedPath === 'business'
                    ? 'bg-loam-brown text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                💼
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Journey</h2>
              <p className="text-gray-600">
                Discover your WHY in your professional life
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-loam-brown text-xl">✓</div>
                <p className="text-sm text-gray-700">
                  Find your authentic leadership style
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-loam-brown text-xl">✓</div>
                <p className="text-sm text-gray-700">
                  Discover your core business values
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-loam-brown text-xl">✓</div>
                <p className="text-sm text-gray-700">
                  Build a career aligned with purpose
                </p>
              </div>
            </div>
          </div>

          {/* Personal Path */}
          <div
            className={`bg-white rounded-2xl shadow-lg p-8 border-2 cursor-pointer transition-all ${
              selectedPath === 'personal'
                ? 'border-loam-brown ring-4 ring-blue-200 ring-opacity-50'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !loading && handlePathSelect('personal')}
          >
            <div className="text-center mb-6">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 ${
                  selectedPath === 'personal'
                    ? 'bg-loam-brown text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                🌟
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Life Journey</h2>
              <p className="text-gray-600">
                Discover your WHY in your personal life
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-loam-brown text-xl">✓</div>
                <p className="text-sm text-gray-700">
                  Understand your authentic self
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-loam-brown text-xl">✓</div>
                <p className="text-sm text-gray-700">
                  Discover your deepest values
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-loam-brown text-xl">✓</div>
                <p className="text-sm text-gray-700">
                  Build a life that truly fulfills you
                </p>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center mt-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-loam-brown"></div>
            <p className="mt-2 text-gray-600">Starting your journey...</p>
          </div>
        )}
      </div>
    </div>
  );
}