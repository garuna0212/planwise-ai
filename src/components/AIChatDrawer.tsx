import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { PlanWisePlan, ChatMessage, PlanRevisionProposal } from '../types/planwise.ts';
import { parseRevisionProposal, applyPlanRevision } from '../utils/revisionEngine.ts';
import { useFocusTrap } from '../utils/useFocusTrap.ts';

interface AIChatDrawerProps {
  plan: PlanWisePlan;
  onUpdatePlan: (updatedPlan: PlanWisePlan) => void;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  'Reduce catering costs by 15%',
  'Make this event more eco-friendly',
  'Shift ₹20,000 from decor to entertainment',
  'How can I save ₹25,000 without cutting guests?',
  'Recommend rain contingency plan',
  'Draft an RSVP reminder for WhatsApp',
];

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  plan,
  onUpdatePlan,
  isOpen,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus trap with focus restoration and Escape handler
  useFocusTrap(drawerRef, {
    isOpen,
    onClose,
    initialFocusRef: inputRef,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, plan.chatHistory]);

  const handleApplyProposal = (proposal: PlanRevisionProposal) => {
    const updatedPlan = applyPlanRevision(plan, proposal);
    onUpdatePlan(updatedPlan);
  };

  const handleDismissProposal = (proposalId: string) => {
    const updatedHistory = plan.chatHistory.map((m) => {
      if (m.revisionProposal && m.revisionProposal.id === proposalId) {
        const { revisionProposal, ...rest } = m;
        return rest as ChatMessage;
      }
      return m;
    });
    onUpdatePlan({
      ...plan,
      updatedAt: new Date().toISOString(),
      chatHistory: updatedHistory,
    });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...plan.chatHistory, userMessage];
    setInputText('');
    setIsLoading(true);

    const detectedRevision = parseRevisionProposal(text, plan);

    onUpdatePlan({
      ...plan,
      updatedAt: new Date().toISOString(),
      chatHistory: updatedHistory,
    });

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          planContext: plan,
          history: updatedHistory.slice(-6),
        }),
      });

      const data = await res.json();
      let replyText = data.reply || 'I am ready to help refine your celebration details.';

      if (detectedRevision && !replyText.includes('proposal')) {
        replyText = `I have analyzed your request and prepared a mathematically verified plan revision proposal below. You can inspect the exact budget line-item adjustments before choosing to apply them:`;
      }

      const botMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        revisionProposal: detectedRevision || undefined,
      };

      onUpdatePlan({
        ...plan,
        updatedAt: new Date().toISOString(),
        chatHistory: [...updatedHistory, botMessage],
      });
    } catch (e) {
      console.error('Chat error:', e);
      const fallbackReply = detectedRevision
        ? `Here is your verified plan revision proposal based on deterministic business rules:`
        : `I am currently operating in offline deterministic mode. You can fine-tune allocations using the Budget tab or inspect the Planning Advisory tab!`;

      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        revisionProposal: detectedRevision || undefined,
      };
      onUpdatePlan({
        ...plan,
        updatedAt: new Date().toISOString(),
        chatHistory: [...updatedHistory, errorMessage],
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={drawerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-title"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#6D5EF8] text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 id="chat-title" className="text-sm font-bold text-white">
              PlanWise AI Assistant
            </h3>
            <p className="text-[11px] text-slate-400">
              Natural-language revisions, verified math & advice
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close assistant panel"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50"
        role="log"
        aria-live="polite"
        aria-label="Conversation history"
      >
        {plan.chatHistory.map((msg) => {
          const isUser = msg.sender === 'user';
          const proposal = msg.revisionProposal;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
            >
              <div
                className={`flex items-start gap-2.5 max-w-[92%] ${
                  isUser ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                    isUser
                      ? 'bg-[#6D5EF8] text-white'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#6D5EF8] dark:text-[#9B8FF9] shadow-2xs'
                  }`}
                  aria-hidden="true"
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-[#6D5EF8] text-white rounded-tr-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-xs whitespace-pre-wrap'
                  }`}
                >
                  <span className="sr-only">{isUser ? 'You said: ' : 'Assistant replied: '}</span>
                  {msg.text}
                  <div
                    className={`text-[10px] mt-1 text-right ${
                      isUser ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>

              {/* Proposed Plan Revision Card (Before Applying) */}
              {proposal && (
                <div className="w-[92%] ml-9 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-[#6D5EF8]/30 dark:border-[#6D5EF8]/40 shadow-sm space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 rounded-md bg-[#EEECFE] dark:bg-[#6D5EF8]/20 text-[#6D5EF8] dark:text-[#9B8FF9]">
                        <Sliders className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {proposal.title}
                      </span>
                    </div>
                    {proposal.applied ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        Applied
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                        Review Needed
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {proposal.rationale}
                  </p>

                  <div className="bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-1">
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Proposed Adjustments:
                    </div>
                    {proposal.changesSummary.map((change, idx) => (
                      <div key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                        <span className="text-[#6D5EF8] dark:text-[#9B8FF9] font-bold" aria-hidden="true">•</span>
                        <span>{change}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Strict 100% distribution · ₹0 leakage</span>
                    </div>

                    {!proposal.applied ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDismissProposal(proposal.id)}
                          className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleApplyProposal(proposal)}
                          className="px-3 py-1 bg-[#6D5EF8] hover:bg-[#5B4CE6] text-white rounded-lg text-xs font-bold shadow-xs transition focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#6D5EF8]"
                        >
                          Apply Revision
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        Plan blueprint recalculated
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div
            className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit"
            role="status"
          >
            <div className="w-3.5 h-3.5 border-2 border-[#6D5EF8] border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            <span>PlanWise AI is validating proposal and generating advice...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div
        className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-none"
        role="group"
        aria-label="Quick suggested prompts"
      >
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-[#EEECFE] dark:hover:bg-[#6D5EF8]/20 hover:text-[#6D5EF8] dark:hover:text-[#9B8FF9] text-slate-600 dark:text-slate-400 transition shrink-0 border border-slate-200/60 dark:border-slate-700 font-medium focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box with explicit label */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <label htmlFor="chat-user-message-input" className="sr-only">
            Message PlanWise AI Planner
          </label>
          <input
            ref={inputRef}
            id="chat-user-message-input"
            type="text"
            placeholder="e.g. 'Reduce catering costs by 15%' or 'Make it eco-friendly'..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-[#6D5EF8] focus-visible:ring-2 focus-visible:ring-[#6D5EF8]"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            aria-label="Send message"
            className="p-2.5 bg-[#6D5EF8] hover:bg-[#5B4CE6] disabled:opacity-40 text-white rounded-xl transition shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#6D5EF8]"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
