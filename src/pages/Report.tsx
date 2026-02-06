import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useConversation';
import { usePreAssessment } from '@/hooks/usePreAssessment';
import LogoutLink from '@/components/auth/LogoutLink';
import { messages as messagesApi } from '@/lib/supabase';
import { downloadFullJourneyPDF } from '@/utils/pdfExport';
import { generateReportConclusion, type ReportConclusion } from '@/lib/anthropic';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Message } from '@/types/conversation';

export default function Report() {
  const { user } = useAuth();
  const { conversation, loading } = useConversation(user?.id);
  const preAssessment = usePreAssessment(user?.id);
  const navigate = useNavigate();
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conclusion, setConclusion] = useState<ReportConclusion | null>(null);
  const [loadingConclusion, setLoadingConclusion] = useState(false);

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

  useEffect(() => {
    const focus = preAssessment?.focusStatement ?? preAssessment?.biggest_challenge;
    if (!conversation || !focus) return;
    setLoadingConclusion(true);
    generateReportConclusion({
      focusStatement: focus,
      rootWhy: conversation.root_why,
      rootIdentity: conversation.root_identity,
      rootDesire: conversation.root_desire,
      rootFear: conversation.root_fear,
      rootObstacle: conversation.root_obstacle,
      rootLegacy: conversation.root_legacy,
      atBatSummary: conversation.at_bat_summary,
      firstBaseSummary: conversation.first_base_summary,
      secondBaseSummary: conversation.second_base_summary,
      thirdBaseSummary: conversation.third_base_summary,
      homePlateSummary: conversation.home_plate_summary,
    })
      .then((result) => {
        setConclusion(result ?? null);
      })
      .catch(() => setConclusion(null))
      .finally(() => setLoadingConclusion(false));
  }, [conversation, preAssessment?.focusStatement, preAssessment?.biggest_challenge]);

  const loadAllMessages = async () => {
    if (!conversation) return;
    
    setLoadingMessages(true);
    const { data } = await messagesApi.getMessages(conversation.id);
    if (data) {
      setAllMessages(data);
    }
    setLoadingMessages(false);
  };

  const focusStatement = preAssessment?.focusStatement ?? preAssessment?.biggest_challenge;

  const handleDownloadJourney = () => {
    if (conversation && allMessages.length > 0) {
      downloadFullJourneyPDF(conversation, allMessages);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-loam-brown"></div>
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
            className="bg-loam-brown text-white px-6 py-3 rounded-loam hover:bg-loam-brown/90 transition"
          >
            Start New Journey
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-loam-neutral to-loam-neutral px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Insights Report</h1>
            <p className="text-gray-600">
              Here&apos;s what you&apos;ve discovered on your journey
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* 1. Original focus – what they set out to work on */}
          {focusStatement && (
            <div className="bg-white rounded-loam shadow-md p-6 border-l-4 border-loam-brown">
              <h2 className="text-lg font-semibold text-gray-500 uppercase tracking-wide mb-2">What you set out to work on</h2>
              <p className="text-xl text-gray-900 font-medium">{focusStatement}</p>
            </div>
          )}

          {/* 2. Discovery modules – summaries in order */}
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-2">Your discoveries</h2>
          <p className="text-gray-600 mb-4">A summary of what you uncovered at each stage of your HomeRun journey.</p>

          {/* At Bat – WHY */}
          {(conversation.root_why || conversation.at_bat_summary) && (
            <div className="bg-white rounded-loam shadow-md p-6 border-l-4 border-loam-brown">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🏠</span>
                <h3 className="text-xl font-bold text-gray-900">At Bat – Your WHY</h3>
              </div>
              {conversation.at_bat_summary ? (
                <p className="text-gray-700 whitespace-pre-wrap">{conversation.at_bat_summary}</p>
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">{conversation.root_why}</p>
              )}
              {conversation.at_bat_summary && conversation.root_why && (
                <p className="text-gray-600 text-sm mt-3 italic">Root insight: {conversation.root_why}</p>
              )}
            </div>
          )}

          {/* First Base – WHO */}
          {(conversation.root_identity || conversation.first_base_summary) && (
            <div className="bg-white rounded-loam shadow-md p-6 border-l-4 border-loam-green">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">👤</span>
                <h3 className="text-xl font-bold text-gray-900">First Base – Your WHO</h3>
              </div>
              {conversation.first_base_summary ? (
                <p className="text-gray-700 whitespace-pre-wrap">{conversation.first_base_summary}</p>
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">{conversation.root_identity}</p>
              )}
              {conversation.first_base_summary && conversation.root_identity && (
                <p className="text-gray-600 text-sm mt-3 italic">Root insight: {conversation.root_identity}</p>
              )}
            </div>
          )}

          {/* Second Base – WHAT */}
          {(conversation.root_desire || conversation.root_fear || conversation.second_base_summary) && (
            <div className="bg-white rounded-loam shadow-md p-6 border-l-4 border-yellow-500">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💫</span>
                <h3 className="text-xl font-bold text-gray-900">Second Base – Your WHAT</h3>
              </div>
              {conversation.second_base_summary ? (
                <p className="text-gray-700 whitespace-pre-wrap">{conversation.second_base_summary}</p>
              ) : (
                <>
                  {conversation.root_desire && <p className="text-gray-700 whitespace-pre-wrap"><strong>Desires:</strong> {conversation.root_desire}</p>}
                  {conversation.root_fear && <p className="text-gray-700 whitespace-pre-wrap mt-2"><strong>Fears & obstacles:</strong> {conversation.root_fear}</p>}
                </>
              )}
              {(conversation.root_desire || conversation.root_fear) && conversation.second_base_summary && (
                <p className="text-gray-600 text-sm mt-3 italic">
                  Root insights: {[conversation.root_desire, conversation.root_fear].filter(Boolean).join(' • ')}
                </p>
              )}
            </div>
          )}

          {/* Third Base – HOW */}
          {(conversation.root_obstacle || conversation.third_base_summary) && (
            <div className="bg-white rounded-loam shadow-md p-6 border-l-4 border-loam-clay">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🛤️</span>
                <h3 className="text-xl font-bold text-gray-900">Third Base – Your HOW</h3>
              </div>
              {conversation.third_base_summary ? (
                <p className="text-gray-700 whitespace-pre-wrap">{conversation.third_base_summary}</p>
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">{conversation.root_obstacle}</p>
              )}
              {conversation.third_base_summary && conversation.root_obstacle && (
                <p className="text-gray-600 text-sm mt-3 italic">Root insight: {conversation.root_obstacle}</p>
              )}
            </div>
          )}

          {/* Home Plate – Why it MATTERS */}
          {(conversation.root_legacy || conversation.root_sustainability_threat || conversation.home_plate_summary) && (
            <div className="bg-white rounded-loam shadow-md p-6 border-l-4 border-loam-base">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🌟</span>
                <h3 className="text-xl font-bold text-gray-900">Home Plate – Why it MATTERS</h3>
              </div>
              {conversation.home_plate_summary ? (
                <p className="text-gray-700 whitespace-pre-wrap">{conversation.home_plate_summary}</p>
              ) : (
                <>
                  {conversation.root_legacy && <p className="text-gray-700 whitespace-pre-wrap">{conversation.root_legacy}</p>}
                  {conversation.root_sustainability_threat && <p className="text-gray-700 whitespace-pre-wrap mt-2"><strong>Sustainability:</strong> {conversation.root_sustainability_threat}</p>}
                </>
              )}
              {conversation.home_plate_summary && (conversation.root_legacy || conversation.root_sustainability_threat) && (
                <p className="text-gray-600 text-sm mt-3 italic">
                  Root insights: {[conversation.root_legacy, conversation.root_sustainability_threat].filter(Boolean).join(' • ')}
                </p>
              )}
            </div>
          )}

          {/* 3. Concluding section – restate problem, synthesis, plan, overall summary */}
          <div className="bg-white rounded-loam shadow-md p-6 border-2 border-loam-brown mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Conclusion – Your path forward</h2>
            {loadingConclusion ? (
              <div className="flex items-center gap-3 text-gray-500 py-6">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-loam-brown border-t-transparent" />
                <span>Creating your personalized conclusion…</span>
              </div>
            ) : conclusion ? (
              <div className="space-y-6">
                {conclusion.restatement && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Restating your focus</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{conclusion.restatement}</p>
                  </section>
                )}
                {conclusion.synthesis && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">How it all connects</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{conclusion.synthesis}</p>
                  </section>
                )}
                {conclusion.plan && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Your plan</h3>
                    <div className="text-gray-700 whitespace-pre-wrap">{conclusion.plan}</div>
                  </section>
                )}
                {conclusion.overallSummary && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Overall summary</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{conclusion.overallSummary}</p>
                  </section>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">Complete more of your journey to generate a personalized conclusion.</p>
            )}
          </div>

          {/* Journey Progress Visual */}
          <div className="bg-white rounded-loam shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Your HomeRun Journey</h2>
            <div className="flex items-center justify-center">
              <div className="relative">
                {/* Baseball Diamond */}
                <svg width="300" height="300" viewBox="0 0 300 300" className="mx-auto">
                  {/* Diamond outline */}
                  <polygon
                    points="150,50 250,150 150,250 50,150"
                    fill="none"
                    stroke={conversation.root_why ? '#5A7247' : '#E8DCC4'}
                    strokeWidth="3"
                  />
                  {/* Bases */}
                  <circle cx="150" cy="50" r="15" fill={conversation.root_why ? '#4A3728' : '#d1d5db'} />
                  <circle cx="250" cy="150" r="15" fill={conversation.root_identity ? '#5A7247' : '#d1d5db'} />
                  <circle cx="150" cy="250" r="15" fill={conversation.root_desire && conversation.root_fear ? '#5A7247' : '#d1d5db'} />
                  <circle cx="50" cy="150" r="15" fill={conversation.root_obstacle ? '#5A7247' : '#d1d5db'} />
                  <circle cx="150" cy="150" r="20" fill={conversation.root_legacy ? '#5A7247' : '#d1d5db'} />
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

          {/* Journey Info */}
          <div className="bg-white rounded-loam shadow-md p-6">
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
            <div className="bg-white rounded-loam shadow-md p-6 text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Download Your Complete Journey</h2>
              <p className="text-gray-600 mb-4">
                Get a PDF with all your conversations, insights, and progress
              </p>
              <button
                onClick={handleDownloadJourney}
                disabled={loadingMessages}
                className="inline-flex items-center gap-2 bg-loam-brown text-white px-6 py-3 rounded-loam font-semibold hover:bg-loam-brown/90 transition disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Download Complete Journey
              </button>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-gradient-to-r from-loam-brown to-loam-green rounded-loam shadow-lg p-8 text-white text-center">
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
                      className="bg-white text-loam-brown px-6 py-3 rounded-loam font-semibold hover:bg-gray-100 transition"
                    >
                      Continue to First Base
                    </button>
                  )}
                  {conversation.current_base === 'first_base' && (
                    <button
                      onClick={() => navigate('/second-base')}
                      className="bg-white text-loam-brown px-6 py-3 rounded-loam font-semibold hover:bg-gray-100 transition"
                    >
                      Continue to Second Base
                    </button>
                  )}
                  {conversation.current_base === 'second_base' && (
                    <button
                      onClick={() => navigate('/third-base')}
                      className="bg-white text-loam-brown px-6 py-3 rounded-loam font-semibold hover:bg-gray-100 transition"
                    >
                      Continue to Third Base
                    </button>
                  )}
                  {conversation.current_base === 'third_base' && (
                    <button
                      onClick={() => navigate('/home-plate')}
                      className="bg-white text-loam-brown px-6 py-3 rounded-loam font-semibold hover:bg-gray-100 transition"
                    >
                      Continue to Home Plate
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => navigate('/path-selection')}
                className="bg-white/20 text-white px-6 py-3 rounded-loam font-semibold hover:bg-white/30 transition border border-white/30"
              >
                Start New Journey
              </button>
            </div>
          </div>

          {/* Logout – sends user to pre-assessment so they can take it again */}
          <div className="text-center">
            <LogoutLink label="Log out" />
          </div>
        </div>
      </div>
    </div>
  );
}