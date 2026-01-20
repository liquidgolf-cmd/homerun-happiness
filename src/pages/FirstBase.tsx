import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConversation } from '@/hooks/useConversation';
import { useChat } from '@/hooks/useChat';
import ChatInterface from '@/components/chat/ChatInterface';
import ProgressBar from '@/components/progress/ProgressBar';
import WhyCounter from '@/components/progress/WhyCounter';
import { baseProgress, messages as messagesApi } from '@/lib/supabase';
import { downloadConversationPDF } from '@/utils/pdfExport';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function FirstBase() {
  const { user } = useAuth();
  const { conversation, loading: convLoading, saveRootInsight, updateBase } = useConversation(user?.id);
  const { messages, loading: chatLoading, loaded: chatLoaded, whyLevel, isComplete, sendMessage, reload } = useChat({
    conversation,
    baseStage: 'first_base',
  });
  const navigate = useNavigate();
  const [showCompletion, setShowCompletion] = useState(false);
  const [proceeding, setProceeding] = useState(false);
  const [initialMessageSent, setInitialMessageSent] = useState(false);

  // Send initial message when conversation starts (only if no existing messages)
  useEffect(() => {
    if (conversation && chatLoaded && messages.length === 0 && !initialMessageSent) {
      setInitialMessageSent(true);
      
      const sendInitialMessage = async () => {
        const initialMsg = `You've discovered your WHY. Now let's discover WHO you really are.

Here's my question: When you strip away your job title, your roles, and what others expect of you - who are you at your core? What makes you uniquely YOU? Be specific. Don't give me labels or roles.`;

        await messagesApi.addMessage({
          conversation_id: conversation.id,
          role: 'assistant',
          content: initialMsg,
          base_stage: 'first_base',
          why_level: 1,
        });
        
        reload();
      };
      
      sendInitialMessage();
    }
  }, [conversation, chatLoaded, messages.length, initialMessageSent, reload]);

  useEffect(() => {
    if ((isComplete || whyLevel >= 5) && conversation && !showCompletion) {
      // Mark why sequence as complete
      baseProgress.updateBaseProgress(conversation.id, 'first_base', {
        why_sequence_complete: true,
      });
      
      // Extract root insight from last assistant message
      const lastAssistantMessage = messages
        .filter(m => m.role === 'assistant')
        .pop();
      
      if (lastAssistantMessage?.content) {
        // Save root identity
        saveRootInsight('root_identity', lastAssistantMessage.content);
      }
      
      setShowCompletion(true);
    }
  }, [isComplete, whyLevel, conversation, messages, showCompletion, saveRootInsight]);

  const handleProceedToSecondBase = async () => {
    if (!conversation || proceeding) return;

    setProceeding(true);
    try {
      // Update base progress
      await baseProgress.updateBaseProgress(conversation.id, 'first_base', {
        completed_at: new Date().toISOString(),
      });

      // Update conversation base
      await updateBase('second_base');
      
      navigate('/second-base');
    } catch (error) {
      console.error('Error proceeding to second base:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-loam-neutral to-loam-neutral px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <ProgressBar currentBase="first_base" />
        <WhyCounter currentLevel={whyLevel} />
        
        {/* Download Button */}
        {messages.length > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => downloadConversationPDF(messages, 'First Base - Discovering WHO', conversation || undefined)}
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
          />
        </div>

        {showCompletion && (
          <div className="mt-6 bg-white rounded-loam shadow-lg p-8 border-2 border-loam-green">
            <div className="text-center">
              <div className="w-16 h-16 bg-loam-green rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                You've Discovered WHO You Really Are!
              </h2>
              <p className="text-gray-600 mb-6">
                You've completed the 5 Whys and discovered your authentic identity. Ready to move to Second Base and discover WHAT you truly want and what's stopping you?
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={handleProceedToSecondBase}
                  disabled={proceeding}
                  className="bg-loam-green text-white px-8 py-4 rounded-loam text-lg font-semibold hover:bg-loam-green/90 focus:outline-none focus:ring-2 focus:ring-loam-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {proceeding ? 'Moving to Second Base...' : 'Proceed to Second Base'}
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
        )}
      </div>
    </div>
  );
}