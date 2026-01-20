import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useConversation';
import { messages as messagesApi } from '@/lib/supabase';
import { downloadFullJourneyPDF } from '@/utils/pdfExport';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Message } from '@/types/conversation';

export default function Report() {
  const { user, logout } = useAuth();
  const { conversation, loading } = useConversation(user?.id);
  const navigate = useNavigate();
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (conversation) {
      loadAllMessages();
    }
  }, [conversation]);

  const loadAllMessages = async () => {
    if (!conversation) return;
    
    setLoadingMessages(true);
    const { data } = await messagesApi.getMessages(conversation.id);
    if (data) {
      setAllMessages(data);
    }
    setLoadingMessages(false);
  };

  const handleDownloadJourney = () => {
    if (conversation && allMessages.length > 0) {
      downloadFullJourneyPDF(conversation, allMessages);
    }
  };

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
          {/* Journey Progress Visual */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Your HomeRun Journey</h2>
            <div className="flex items-center justify-center">
              <div className="relative">
                {/* Baseball Diamond */}
                <svg width="300" height="300" viewBox="0 0 300 300" className="mx-auto">
                  {/* Diamond outline */}
                  <polygon
                    points="150,50 250,150 150,250 50,150"
                    fill="none"
                    stroke={conversation.root_why ? '#10b981' : '#e5e7eb'}
                    strokeWidth="3"
                  />
                  {/* Bases */}
                  <circle cx="150" cy="50" r="15" fill={conversation.root_why ? '#2563eb' : '#d1d5db'} />
                  <circle cx="250" cy="150" r="15" fill={conversation.root_identity ? '#10b981' : '#d1d5db'} />
                  <circle cx="150" cy="250" r="15" fill={conversation.root_desire && conversation.root_fear ? '#10b981' : '#d1d5db'} />
                  <circle cx="50" cy="150" r="15" fill={conversation.root_obstacle ? '#10b981' : '#d1d5db'} />
                  <circle cx="150" cy="150" r="20" fill={conversation.root_legacy ? '#10b981' : '#d1d5db'} />
                  {/* Labels */}
                  <text x="150" y="35" textAnchor="middle" className="text-xs font-semibold fill-gray-700">At Bat</text>
                  <text x="270" y="155" textAnchor="middle" className="text-xs font-semibold fill-gray-700">First</text>
                  <text x="150" y="275" textAnchor="middle" className="text-xs font-semibold fill-gray-700">Second</text>
                  <text x="30" y="155" textAnchor="middle" className="text-xs font-semibold fill-gray-700">Third</text>
                  <text x="150" y="150" textAnchor="middle" className="text-xs font-semibold fill-white">Home</text>
                </svg>
              </div>
            </div>
          </div>

          {/* Root WHY */}
          {conversation.root_why && (
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-homerun-blue">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🏠</span>
                <h2 className="text-2xl font-bold text-gray-900">Your WHY</h2>
                <span className="text-sm text-gray-500">(At Bat)</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{conversation.root_why}</p>
            </div>
          )}

          {/* Root Identity */}
          {conversation.root_identity && (
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-homerun-green">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">👤</span>
                <h2 className="text-2xl font-bold text-gray-900">Your WHO</h2>
                <span className="text-sm text-gray-500">(First Base)</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{conversation.root_identity}</p>
            </div>
          )}

          {/* Root Desire */}
          {conversation.root_desire && (
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💫</span>
                <h2 className="text-2xl font-bold text-gray-900">Your WHAT - Desires</h2>
                <span className="text-sm text-gray-500">(Second Base)</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{conversation.root_desire}</p>
            </div>
          )}

          {/* Root Fear */}
          {conversation.root_fear && (
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⚠️</span>
                <h2 className="text-2xl font-bold text-gray-900">Your WHAT - Fears & Obstacles</h2>
                <span className="text-sm text-gray-500">(Second Base)</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{conversation.root_fear}</p>
            </div>
          )}

          {/* Root Obstacle */}
          {conversation.root_obstacle && (
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🛤️</span>
                <h2 className="text-2xl font-bold text-gray-900">Your HOW</h2>
                <span className="text-sm text-gray-500">(Third Base)</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{conversation.root_obstacle}</p>
            </div>
          )}

          {/* Root Legacy */}
          {conversation.root_legacy && (
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🌟</span>
                <h2 className="text-2xl font-bold text-gray-900">Your Legacy</h2>
                <span className="text-sm text-gray-500">(Home Plate)</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{conversation.root_legacy}</p>
            </div>
          )}

          {/* Root Sustainability */}
          {conversation.root_sustainability_threat && (
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-500">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">♻️</span>
                <h2 className="text-2xl font-bold text-gray-900">Sustainability & Long-term Impact</h2>
                <span className="text-sm text-gray-500">(Home Plate)</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{conversation.root_sustainability_threat}</p>
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

          {/* Download Full Journey */}
          {allMessages.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Download Your Complete Journey</h2>
              <p className="text-gray-600 mb-4">
                Get a PDF with all your conversations, insights, and progress
              </p>
              <button
                onClick={handleDownloadJourney}
                disabled={loadingMessages}
                className="inline-flex items-center gap-2 bg-homerun-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Download Complete Journey
              </button>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-gradient-to-r from-homerun-blue to-homerun-green rounded-lg shadow-lg p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">
              {conversation.current_base === 'completed' 
                ? '🎉 Journey Complete! 🎉' 
                : 'Continue Your Journey'}
            </h2>
            <p className="mb-6 opacity-90">
              {conversation.current_base === 'completed'
                ? 'You\'ve completed the full HomeRun to Happiness journey! You now have a complete understanding of your WHY, WHO, WHAT, HOW, and why it MATTERS.'
                : 'You\'ve made great progress! Continue to discover more about yourself and build a clear path forward.'}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              {conversation.current_base !== 'completed' && (
                <>
                  {conversation.current_base === 'at_bat' && (
                    <button
                      onClick={() => navigate('/first-base')}
                      className="bg-white text-homerun-blue px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                    >
                      Continue to First Base
                    </button>
                  )}
                  {conversation.current_base === 'first_base' && (
                    <button
                      onClick={() => navigate('/second-base')}
                      className="bg-white text-homerun-blue px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                    >
                      Continue to Second Base
                    </button>
                  )}
                  {conversation.current_base === 'second_base' && (
                    <button
                      onClick={() => navigate('/third-base')}
                      className="bg-white text-homerun-blue px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                    >
                      Continue to Third Base
                    </button>
                  )}
                  {conversation.current_base === 'third_base' && (
                    <button
                      onClick={() => navigate('/home-plate')}
                      className="bg-white text-homerun-blue px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                    >
                      Continue to Home Plate
                    </button>
                  )}
                </>
              )}
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