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

export default function SecondBase() {
  const { user } = useAuth();
  const { conversation, loading: convLoading, saveRootInsight, updateBase } = useConversation(user?.id);
  const { messages, loading: chatLoading, loaded: chatLoaded, whyLevel, sendMessage, reload } = useChat({
    conversation,
    baseStage: 'second_base',
  });
  const navigate = useNavigate();
  const [showCompletion, setShowCompletion] = useState(false);
  const [proceeding, setProceeding] = useState(false);
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const [whySequence, setWhySequence] = useState<1 | 2>(1); // 1 = desires, 2 = fears
  const [desireComplete, setDesireComplete] = useState(false);
  const [fearComplete, setFearComplete] = useState(false);
  const [transitionSent, setTransitionSent] = useState(false);

  // Determine current sequence based on why level and completion state
  useEffect(() => {
    if (whyLevel >= 5 && !desireComplete) {
      setDesireComplete(true);
      setWhySequence(2);
    } else if (whyLevel >= 5 && desireComplete && !fearComplete) {
      setFearComplete(true);
    }
  }, [whyLevel, desireComplete, fearComplete]);

  // Send initial message when conversation starts (only if no existing messages)
  useEffect(() => {
    if (conversation && chatLoaded && messages.length === 0 && !initialMessageSent) {
      setInitialMessageSent(true);
      
      const sendInitialMessage = async () => {
        const initialMsg = `You've discovered your WHY and WHO. Now let's dig into WHAT you truly want and what's stopping you.

First, let's explore your desires. What do you REALLY want? Not what you think you should want, not what others expect - what do YOU actually want?`;

        await messagesApi.addMessage({
          conversation_id: conversation.id,
          role: 'assistant',
          content: initialMsg,
          base_stage: 'second_base',
          why_level: 1,
        });
        
        reload();
      };
      
      sendInitialMessage();
    }
  }, [conversation, chatLoaded, messages.length, initialMessageSent, reload]);

  // Transition to fears sequence after desires complete
  useEffect(() => {
    if (desireComplete && !fearComplete && !transitionSent && conversation && messages.length > 0 && chatLoaded) {
      const lastMessage = messages[messages.length - 1];
      // Only send transition if last message was from assistant and we haven't sent transition yet
      if (lastMessage.role === 'assistant' && lastMessage.why_level === 5) {
        setTransitionSent(true);
        const transitionMessage = async () => {
          const transitionMsg = `Good. You've discovered what you truly want. Now let's explore what's stopping you.

What are you afraid of? What obstacles stand in your way? What fears hold you back from pursuing what you really want?`;

          await messagesApi.addMessage({
            conversation_id: conversation.id,
            role: 'assistant',
            content: transitionMsg,
            base_stage: 'second_base',
            why_level: 1, // Reset to 1 for second sequence
          });
          
          reload();
        };
        
        transitionMessage();
      }
    }
  }, [desireComplete, fearComplete, transitionSent, conversation, messages, chatLoaded, reload]);

  // Save root_desire after first sequence completes
  useEffect(() => {
    if (desireComplete && !fearComplete && conversation && messages.length > 0) {
      // Find the last assistant message from the first sequence (before transition)
      const desireMessages = messages.filter(m => {
        const transitionIndex = messages.findIndex(msg => 
          msg.content.includes('What are you afraid of')
        );
        if (transitionIndex === -1) return m.role === 'assistant';
        return messages.indexOf(m) < transitionIndex && m.role === 'assistant';
      });
      
      const lastDesireMessage = desireMessages
        .filter(m => m.why_level === 5)
        .pop();
      
      if (lastDesireMessage?.content && !conversation.root_desire) {
        saveRootInsight('root_desire', lastDesireMessage.content);
      }
    }
  }, [desireComplete, fearComplete, conversation, messages, saveRootInsight]);

  // Save root_fear and mark complete after second sequence completes
  useEffect(() => {
    if (fearComplete && conversation && !showCompletion) {
      // Mark why sequence as complete
      baseProgress.updateBaseProgress(conversation.id, 'second_base', {
        why_sequence_complete: true,
      });
      
      // Extract root fear from last assistant message of second sequence
      const transitionIndex = messages.findIndex(m => 
        m.content.includes('What are you afraid of')
      );
      const fearMessages = transitionIndex >= 0 
        ? messages.slice(transitionIndex).filter(m => m.role === 'assistant')
        : [];
      const lastFearMessage = fearMessages
        .filter(m => m.why_level === 5)
        .pop();
      
      if (lastFearMessage?.content) {
        saveRootInsight('root_fear', lastFearMessage.content);
      }
      
      setShowCompletion(true);
    }
  }, [fearComplete, conversation, messages, showCompletion, saveRootInsight]);

  const handleProceedToThirdBase = async () => {
    if (!conversation || proceeding) return;

    setProceeding(true);
    try {
      // Update base progress
      await baseProgress.updateBaseProgress(conversation.id, 'second_base', {
        completed_at: new Date().toISOString(),
      });

      // Update conversation base
      await updateBase('third_base');
      
      navigate('/third-base');
    } catch (error) {
      console.error('Error proceeding to third base:', error);
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

  // Calculate display why level (reset for second sequence)
  const displayWhyLevel = desireComplete ? whyLevel : whyLevel;
  const sequenceLabel = desireComplete ? 'Fears' : 'Desires';

  return (
    <div className="min-h-screen bg-gradient-to-br from-loam-neutral to-loam-neutral px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <ProgressBar currentBase="second_base" />
        <div className="flex items-center gap-4 mb-4">
          <WhyCounter currentLevel={displayWhyLevel} />
          <div className="text-sm text-gray-600 font-medium">
            Sequence {whySequence}/2: {sequenceLabel}
          </div>
        </div>
        
        {/* Download Button */}
        {messages.length > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => downloadConversationPDF(messages, 'Second Base - Discovering WHAT', conversation || undefined)}
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
                You've Discovered WHAT You Want and What's Stopping You!
              </h2>
              <p className="text-gray-600 mb-6">
                You've completed both 5 Whys sequences and discovered your deepest desires and fears. Ready to move to Third Base and map out HOW you'll make it happen?
              </p>
              <button
                onClick={handleProceedToThirdBase}
                disabled={proceeding}
                className="bg-loam-green text-white px-8 py-4 rounded-loam text-lg font-semibold hover:bg-loam-green/90 focus:outline-none focus:ring-2 focus:ring-loam-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {proceeding ? 'Moving to Third Base...' : 'Proceed to Third Base'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
