import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { preAssessments } from '@/lib/supabase';

export default function Assessment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [happinessScore, setHappinessScore] = useState(5);
  const [clarityScore, setClarityScore] = useState(5);
  const [readinessScore, setReadinessScore] = useState(5);
  const [biggestChallenge, setBiggestChallenge] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateRecommendedPath = () => {
    const totalScore = happinessScore + clarityScore + readinessScore;
    // Lower scores indicate more need for business path
    // Higher scores indicate personal path readiness
    return totalScore < 15 ? 'business' : 'personal';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!biggestChallenge.trim()) {
      setError('Please describe your biggest challenge');
      setLoading(false);
      return;
    }

    try {
      const recommendedPath = calculateRecommendedPath();
      
      // Try to save assessment, but continue even if it fails
      await preAssessments.createPreAssessment({
        user_id: user?.id,
        email: user?.email || '',
        happiness_score: happinessScore,
        clarity_score: clarityScore,
        readiness_score: readinessScore,
        biggest_challenge: biggestChallenge,
        recommended_path: recommendedPath,
      });

      // Always navigate to path selection regardless of save status
      navigate('/path-selection', {
        state: {
          happinessScore,
          clarityScore,
          readinessScore,
          biggestChallenge,
          recommendedPath,
        },
      });
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pre-Assessment</h1>
            <p className="text-gray-600">
              Help us understand where you're at so we can guide your journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Happiness Score */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-lg font-semibold text-gray-900">
                  On a scale of 1-10, how happy are you right now?
                </label>
                <span className="text-2xl font-bold text-homerun-blue">{happinessScore}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={happinessScore}
                onChange={(e) => setHappinessScore(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-homerun-blue"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Not happy</span>
                <span>Very happy</span>
              </div>
            </div>

            {/* Clarity Score */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-lg font-semibold text-gray-900">
                  How clear are you on your goals?
                </label>
                <span className="text-2xl font-bold text-homerun-blue">{clarityScore}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={clarityScore}
                onChange={(e) => setClarityScore(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-homerun-blue"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Unclear</span>
                <span>Very clear</span>
              </div>
            </div>

            {/* Readiness Score */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-lg font-semibold text-gray-900">
                  How ready are you to make changes?
                </label>
                <span className="text-2xl font-bold text-homerun-blue">{readinessScore}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={readinessScore}
                onChange={(e) => setReadinessScore(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-homerun-blue"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Not ready</span>
                <span>Very ready</span>
              </div>
            </div>

            {/* Biggest Challenge */}
            <div>
              <label htmlFor="challenge" className="block text-lg font-semibold text-gray-900 mb-3">
                What's your biggest challenge right now?
              </label>
              <textarea
                id="challenge"
                value={biggestChallenge}
                onChange={(e) => setBiggestChallenge(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-homerun-blue focus:border-transparent resize-none"
                rows={5}
                placeholder="Tell us what's holding you back or what you're struggling with most..."
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-homerun-blue text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-homerun-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Saving...' : 'Continue to Path Selection'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}