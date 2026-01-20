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

export default function AtBat() {
  const { user } = useAuth();
  const { conversation, loading: convLoading, saveRootInsight, updateBase } = useConversation(user?.id);
  const { messages, loading: chatLoading, loaded: chatLoaded, whyLevel, sendMessage, reload } = useChat({
    conversation,
    baseStage: 'at_bat',
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
        const initialMsg = `Let's get started. We're here to discover your deepest WHY - the real reason behind what you do. Not surface-level answers, but the truth.

Here's my first question: What do you want? Be specific - don't give me generic answers like "I want to be happy." What do you ACTUALLY want?`;

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
  }, [conversation, chatLoaded, messages.length, initialMessageSent, reload]);

  useEffect(() => {
    if (whyLevel >= 5 && conversation && !showCompletion) {
      // Mark why sequence as complete
      baseProgress.updateBaseProgress(conversation.id, 'at_bat', {
        why_sequence_complete: true,
      });
      
      // Extract root insight from last assistant message
      const lastAssistantMessage = messages
        .filter(m => m.role === 'assistant')
        .pop();
      
      if (lastAssistantMessage?.content) {
        // Save root why (in a real app, we'd extract this better from AI response)
        saveRootInsight('root_why', lastAssistantMessage.content);
      }
      
      setShowCompletion(true);
    }
  }, [whyLevel, conversation, messages, showCompletion, saveRootInsight]);

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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-homerun-blue"></div>
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
            className="bg-homerun-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Start New Journey
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <ProgressBar currentBase="at_bat" />
        <WhyCounter currentLevel={whyLevel} />
        
        {/* Download Button */}
        {messages.length > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => downloadConversationPDF(messages, 'At Bat - Discovering WHY', conversation || undefined)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
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
          <div className="mt-6 bg-white rounded-lg shadow-lg p-8 border-2 border-homerun-green">
            <div className="text-center">
              <div className="w-16 h-16 bg-homerun-green rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                You've Discovered Your WHY!
              </h2>
              <p className="text-gray-600 mb-6">
                You've completed the 5 Whys and discovered your deepest motivation. Ready to move to First Base and discover WHO you really are?
              </p>
              <button
                onClick={handleProceedToFirstBase}
                disabled={proceeding}
                className="bg-homerun-green text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-homerun-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {proceeding ? 'Moving to First Base...' : 'Proceed to First Base'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}