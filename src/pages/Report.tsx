import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useConversation';

export default function Report() {
  const { user, logout } = useAuth();
  const { conversation, loading } = useConversation(user?.id);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-homerun-blue"></div>
          <p className="mt-4 text-gray-600">Loading your report...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No conversation found.</p>
          <button
            onClick={() => navigate('/path-selection')}
            className="bg-homerun-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Start New Journey
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Insights Report</h1>
            <p className="text-gray-600">
              Here's what you've discovered on your journey
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Root WHY */}
          {conversation.root_why && (
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-homerun-blue">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Your WHY</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{conversation.root_why}</p>
            </div>
          )}

          {/* Root Identity */}
          {conversation.root_identity && (
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-homerun-green">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Identity</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{conversation.root_identity}</p>
            </div>
          )}

          {/* Journey Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Journey Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Journey Type</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {conversation.journey_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Current Stage</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {conversation.current_base.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Messages</p>
                <p className="font-semibold text-gray-900">
                  {conversation.total_messages}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Progress</p>
                <p className="font-semibold text-gray-900">
                  {conversation.completion_percentage}%
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gradient-to-r from-homerun-blue to-homerun-green rounded-lg shadow-lg p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Continue Your Journey</h2>
            <p className="mb-6 opacity-90">
              You've made great progress! Continue to discover more about yourself and build a clear path forward.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/first-base')}
                className="bg-white text-homerun-blue px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Continue Journey
              </button>
              <button
                onClick={() => navigate('/path-selection')}
                className="bg-white/20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition border border-white/30"
              >
                Start New Journey
              </button>
            </div>
          </div>

          {/* Logout */}
          <div className="text-center">
            <button
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="text-gray-600 hover:text-gray-900 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}