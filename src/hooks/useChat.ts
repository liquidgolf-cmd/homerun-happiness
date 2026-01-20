import { useState, useEffect } from 'react';
import { Message, Conversation, BaseStage } from '@/types/conversation';
import { messages as messagesApi } from '@/lib/supabase';
import { generateCoachResponse, CoachingContext } from '@/lib/anthropic';
import { detectVagueAnswer } from '@/lib/vague-detector';

interface UseChatProps {
  conversation: Conversation | null;
  baseStage: BaseStage;
}

// Detect if AI response suggests conversation completion (suggestion, not requirement)
function detectCompletion(response: string, baseStage: BaseStage): boolean {
  const responseLower = response.toLowerCase();
  
  // Softer detection - looks for suggestions, not hard completions
  const suggestionPhrases = [
    'you\'ve discovered your',
    'this is your root',
    'ready to move',
    'ready for the next',
    'ready to discover',
    'ready to explore',
    'ready to map',
    'ready to see',
    'would you like to explore',
    'or would you like',
  ];
  
  const nextBasePhrases: Record<BaseStage, string[]> = {
    at_bat: ['first base', 'discover who', 'who you really are'],
    first_base: ['second base', 'discover what', 'what you want'],
    second_base: ['third base', 'map how', 'how you\'ll make it happen'],
    third_base: ['home plate', 'why it matters', 'explore why it matters'],
    home_plate: ['report', 'complete journey', 'see your complete'],
    completed: [],
  };
  
  const hasSuggestionPhrase = suggestionPhrases.some(phrase => 
    responseLower.includes(phrase)
  );
  
  const hasNextBasePhrase = nextBasePhrases[baseStage]?.some(phrase =>
    responseLower.includes(phrase)
  );
  
  // Detect if AI acknowledges discovery and suggests next step
  const acknowledgesDiscovery = responseLower.includes('discovered') && 
    (responseLower.includes('your why') || 
     responseLower.includes('your who') || 
     responseLower.includes('your what') || 
     responseLower.includes('your how') ||
     responseLower.includes('why it matters'));
  
  // Return true if AI suggests moving forward (but user can still continue)
  return (hasSuggestionPhrase && hasNextBasePhrase) || (acknowledgesDiscovery && hasNextBasePhrase);
}

export function useChat({ conversation, baseStage }: UseChatProps) {
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [whyLevel, setWhyLevel] = useState(1);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (conversation) {
      loadMessages();
    }
  }, [conversation?.id, baseStage]);

  const loadMessages = async () => {
    if (!conversation) return;

    setLoaded(false);
    const { data, error } = await messagesApi.getMessages(conversation.id, baseStage);
    if (error) {
      console.error('Error loading messages:', error);
      setLoaded(true);
      return;
    }

    if (data) {
      setChatMessages(data);
      // Set why level based on last assistant message
      const lastAssistantMessage = data
        .filter(m => m.role === 'assistant')
        .pop();
      if (lastAssistantMessage?.why_level) {
        setWhyLevel(lastAssistantMessage.why_level);
      }
    }
    setLoaded(true);
  };

  const sendMessage = async (content: string) => {
    if (!conversation || loading) return;

    // Save user message
    const userMessage: Omit<Message, 'id' | 'created_at'> = {
      conversation_id: conversation.id,
      role: 'user',
      content,
      base_stage: baseStage,
      why_level: whyLevel,
    };

    const { data: savedUserMessage, error: userError } = await messagesApi.addMessage(userMessage);
    if (userError) {
      console.error('Error saving user message:', userError);
      return;
    }

    if (savedUserMessage) {
      setChatMessages(prev => [...prev, savedUserMessage]);
    }

    // Detect if vague
    const vagueResult = detectVagueAnswer(content);
    
    if (vagueResult.is_vague && vagueResult.challenge) {
      // Save challenge message
      const challengeMessage: Omit<Message, 'id' | 'created_at'> = {
        conversation_id: conversation.id,
        role: 'assistant',
        content: vagueResult.challenge,
        base_stage: baseStage,
        why_level: whyLevel,
        is_vague: true,
        challenged: true,
      };

      const { data: savedChallenge, error: challengeError } = await messagesApi.addMessage(challengeMessage);
      if (!challengeError && savedChallenge) {
        setChatMessages(prev => [...prev, savedChallenge]);
      }
      return;
    }

    // Generate AI response
    setLoading(true);
    try {
      const context: CoachingContext = {
        baseStage,
        whyLevel,
        previousMessages: chatMessages,
        rootInsights: {
          root_why: conversation.root_why,
          root_identity: conversation.root_identity,
          root_desire: conversation.root_desire,
          root_fear: conversation.root_fear,
          root_obstacle: conversation.root_obstacle,
          root_legacy: conversation.root_legacy,
          root_sustainability_threat: conversation.root_sustainability_threat,
        },
      };

      const { response, tokens } = await generateCoachResponse(content, context);

      // Check if AI indicates completion
      const completionDetected = detectCompletion(response, baseStage);
      
      // Determine if we should increment why level
      const nextWhyLevel = whyLevel >= 5 ? 5 : whyLevel + 1;

      // Save assistant message
      const assistantMessage: Omit<Message, 'id' | 'created_at'> = {
        conversation_id: conversation.id,
        role: 'assistant',
        content: response,
        base_stage: baseStage,
        why_level: nextWhyLevel,
        tokens_used: tokens,
      };

      const { data: savedAssistant, error: assistantError } = await messagesApi.addMessage(assistantMessage);
      if (assistantError) {
        console.error('Error saving assistant message:', assistantError);
      } else if (savedAssistant) {
        setChatMessages(prev => [...prev, savedAssistant]);
        setWhyLevel(nextWhyLevel);
        
        // Set completion state if detected
        if (completionDetected || nextWhyLevel >= 5) {
          setIsComplete(true);
        }
      }
    } catch (error) {
      console.error('Error generating response:', error);
      // Save error message
      const errorMessage: Omit<Message, 'id' | 'created_at'> = {
        conversation_id: conversation.id,
        role: 'assistant',
        content: "I'm having trouble processing that right now. Can you try again?",
        base_stage: baseStage,
        why_level: whyLevel,
      };
      const { data: savedError } = await messagesApi.addMessage(errorMessage);
      if (savedError) {
        setChatMessages(prev => [...prev, savedError]);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    messages: chatMessages,
    loading,
    loaded,
    whyLevel,
    isComplete,
    sendMessage,
    reload: loadMessages,
  };
}