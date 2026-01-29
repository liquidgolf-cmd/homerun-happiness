import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useConversation';
import { useChat } from '@/hooks/useChat';
import { useBaseProgress } from '@/hooks/useBaseProgress';
import ChatInterface from '@/components/chat/ChatInterface';
import ProgressBar from '@/components/progress/ProgressBar';
import SummaryCard from '@/components/progress/SummaryCard';
import { baseProgress, messages as messagesApi, preAssessments } from '@/lib/supabase';
import { downloadConversationPDF } from '@/utils/pdfExport';
import { generateBreakthroughSummary } from '@/lib/anthropic';
import { ArrowDownTrayIcon, EyeIcon } from '@heroicons/react/24/outline';
import LogoutLink from '@/components/auth/LogoutLink';

export default function AtBat() {
  const { user } = useAuth();
  const { conversation, loading: convLoading, saveRootInsight, saveSummary, updateBase } = useConversation(user?.id);
  const [preAssessment, setPreAssessment] = useState<{ biggest_challenge: string; why_matters?: string; what_would_change?: string } | null>(null);
  const { messages, loading: chatLoading, loaded: chatLoaded, whyLevel, isComplete, sendMessage, reload } = useChat({
    conversation,
    baseStage: 'at_bat',
    preAssessment: preAssessment || undefined,
  });
  const { completedStages, isStageCompleted } = useBaseProgress(conversation?.id);
  const navigate = useNavigate();
  const [showCompletion, setShowCompletion] = useState(false);
  const [proceeding, setProceeding] = useState(false);
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [allowContinue, setAllowContinue] = useState(false);

  // Fetch pre-assessment for priming (P2)
  useEffect(() => {
    if (user?.id && conversation) {
      preAssessments.getPreAssessment(user.id)
        .then(({ data, error }) => {
          if (!error && data && data.biggest_challenge) {
            setPreAssessment({
              biggest_challenge: data.biggest_challenge,
              why_matters: (data as any).why_matters,
              what_would_change: (data as any).what_would_change,
            });
          }
        })
        .catch((err) => {
          console.warn('Failed to fetch pre-assessment for priming:', err);
        });
    }
  }, [user?.id, conversation?.id]);

  // Check if this stage is completed and should be in review mode
  useEffect(() => {
    if (conversation) {
      const stageCompleted = isStageCompleted('at_bat');
      const isPastStage = conversation.current_base !== 'at_bat' && 
        ['first_base', 'second_base', 'third_base', 'home_plate', 'completed'].includes(conversation.current_base);
      
      setIsReviewMode(stageCompleted || isPastStage);
    }
  }, [conversation, isStageCompleted]);

  // Send initial message when conversation starts (only if no existing messages)
  useEffect(() => {
    if (conversation && chatLoaded && messages.length === 0 && !initialMessageSent) {
      setInitialMessageSent(true);
      
      const sendInitialMessage = async () => {
        let initialMsg: string;
        
        // Prime initial message with pre-assessment if available (P2)
        if (preAssessment?.biggest_challenge) {
          const challengePart = `You shared that your biggest challenge is ${preAssessment.biggest_challenge}`;
          const whyPart = preAssessment.why_matters ? `, and it matters to you because ${preAssessment.why_matters}` : '';
          initialMsg = `${challengePart}${whyPart}. Let's go deeper on why that drives you. What do you ACTUALLY want? Be specific - don't give me generic answers like "I want to be happy." What do you really want?`;
        } else {
          initialMsg = `Let's get started. We're here to discover your deepest WHY - the real reason behind what you do. Not surface-level answers, but the truth.

Here's my first question: What do you want? Be specific - don't give me generic answers like "I want to be happy." What do you ACTUALLY want?`;
        }

        await messagesApi.addMessage({
          conversation_id: conversation.id,
          role: 'assistant',
          content: initialMsg,
          base_stage: 'at_bat',
          why_level: 1,
        });
        
        reload();
      };
      
      sendInitialMessage();
    }
  }, [conversation, chatLoaded, messages.length, initialMessageSent, reload, preAssessment]);

  useEffect(() => {
    if ((isComplete || whyLevel >= 5) && conversation && !showCompletion) {
      const handleCompletion = async () => {
        // Mark why sequence as complete
        await baseProgress.updateBaseProgress(conversation.id, 'at_bat', {
          why_sequence_complete: true,
        });
        
        // Extract root insight from last assistant message
        const lastAssistantMessage = messages
          .filter(m => m.role === 'assistant')
          .pop();
        
        const rootInsight = lastAssistantMessage?.content || '';
        
        if (rootInsight) {
          // Save root why
          await saveRootInsight('root_why', rootInsight);
        }

        // Generate summary if we don't have one yet
        if (!conversation.at_bat_summary && messages.length > 0) {
          setGeneratingSummary(true);
          try {
            const generatedSummary = await generateBreakthroughSummary(
              messages,
              'at_bat',
              rootInsight
            );
            setSummary(generatedSummary);
            await saveSummary('at_bat', generatedSummary);
          } catch (error) {
            console.error('Error generating summary:', error);
          } finally {
            setGeneratingSummary(false);
          }
        } else if (conversation.at_bat_summary) {
          setSummary(conversation.at_bat_summary);
        }
        
        setShowCompletion(true);
      };

      handleCompletion();
    }
  }, [isComplete, whyLevel, conversation, messages, showCompletion, saveRootInsight, saveSummary]);

  const handleProceedToFirstBase = async () => {
    if (!conversation || proceeding) return;

    setProceeding(true);
    try {
      // Update base progress
      await baseProgress.updateBaseProgress(conversation.id, 'at_bat', {
        completed_at: new Date().toISOString(),
      });

      // Update conversation base
      await updateBase('first_base');
      
      navigate('/first-base');
    } catch (error) {
      console.error('Error proceeding to first base:', error);
    } finally {
      setProceeding(false);
    }
  };

  if (convLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-loam-brown"></div>
          <p className="mt-4 text-gray-600">Loading your conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No active conversation found.</p>
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
    <div className="min-h-screen bg-loam-neutral px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end mb-4">
          <LogoutLink />
        </div>
        {isReviewMode && !allowContinue && (
          <div className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-loam p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <EyeIcon className="w-6 h-6 text-amber-700" />
              <div>
                <h3 className="font-semibold text-amber-900">Reviewing At Bat - This conversation is complete</h3>
                <p className="text-sm text-amber-700">You're viewing your completed conversation. You can review it or continue adding messages.</p>
              </div>
            </div>
            <button
              onClick={() => setAllowContinue(true)}
              className="px-4 py-2 bg-amber-600 text-white rounded-loam font-semibold hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition"
            >
              Continue this conversation
            </button>
          </div>
        )}
        <ProgressBar currentBase="at_bat" completedStages={completedStages} />
        
        {/* Download Button */}
        {messages.length > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => downloadConversationPDF(messages, 'At Bat - Discovering WHY', conversation || undefined)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-loam transition"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Download Conversation
            </button>
          </div>
        )}
        
        <div className="mt-6">
          <ChatInterface
            messages={messages}
            loading={chatLoading}
            onSendMessage={sendMessage}
            disabled={isReviewMode && !allowContinue}
            disabledMessage="This conversation is complete. Click 'Continue Conversation' to add more messages."
          />
        </div>

        {showCompletion && (
          <>
            {(summary || generatingSummary) && (
              <SummaryCard
                summary={summary || ''}
                baseStage="at_bat"
                loading={generatingSummary}
              />
            )}
            <div className="mt-6 bg-white rounded-loam shadow-lg p-8 border-2 border-loam-green">
              <div className="text-center">
                <div className="w-16 h-16 bg-loam-green rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                  ✓
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  You've Discovered Your WHY!
                </h2>
                <p className="text-gray-600 mb-6">
                  You've reached the root and discovered your deepest motivation. Ready to move to First Base and discover WHO you really are?
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <button
                    onClick={handleProceedToFirstBase}
                    disabled={proceeding}
                    className="bg-loam-green text-white px-8 py-4 rounded-loam text-lg font-semibold hover:bg-loam-green/90 focus:outline-none focus:ring-2 focus:ring-loam-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {proceeding ? 'Moving to First Base...' : 'Proceed to First Base'}
                  </button>
                  <button
                    onClick={() => setShowCompletion(false)}
                    className="bg-gray-200 text-gray-700 px-8 py-4 rounded-loam text-lg font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition"
                  >
                    Continue Exploring
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}