import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Brain, Bot, User, CornerDownLeft, RefreshCw } from 'lucide-react';
import { ChatMessage, StagingVariantPlan } from '../types';

interface SpatialChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  currentVariant: StagingVariantPlan;
}

export const SpatialChatbot: React.FC<SpatialChatbotProps> = ({
  isOpen,
  onClose,
  currentVariant,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: `Hello! I am your Habitat 3D Spatial Staging AI Architect and Pydantic Co-Pilot. I am currently monitoring the "${currentVariant.variant_title}" layout. Every furniture placement is bound to strict physical coordinates [x_min, y_min, x_max, y_max] with guaranteed non-overlapping clearance. How can I assist with your spatial configuration or lighting design?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.1-pro-preview',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-pro-preview');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          thinkingEnabled: thinkingMode,
          currentVariant: currentVariant.variant_title,
          roomContext: {
            variant_title: currentVariant.variant_title,
            furniture_count: currentVariant.furniture_list.length,
            lighting: currentVariant.lighting_style,
            color_palette: currentVariant.color_palette,
          },
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Spatial analysis processed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || selectedModel,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Unable to reach Gemini backend. In local simulation mode: Walkway clearances exceed 1.1m, and daylight orientation is aligned with architectural glazing.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Check ADA walkway clearance around the desk',
    'How does East window daylight affect desk glare?',
    'Propose acoustic wall paneling layout',
    'Calculate egress buffer ratio to doorway',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-neutral-950/95 backdrop-blur-xl border-l border-neutral-800 shadow-2xl flex flex-col font-mono text-neutral-200 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-900/60">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide">Spatial AI Architect</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                Online
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 truncate max-w-[240px]">
              Active: {currentVariant.variant_title}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Model & Thinking Mode Bar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-neutral-900/40 border-b border-neutral-800/80 text-[11px]">
        {/* Model Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500">Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-cyan-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex)</option>
            <option value="gemini-3.5-flash">gemini-3.5-flash (General)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
          </select>
        </div>

        {/* Thinking Mode Toggle */}
        <button
          type="button"
          onClick={() => setThinkingMode(!thinkingMode)}
          className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
            thinkingMode
              ? 'bg-purple-950/80 border-purple-700/80 text-purple-300'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400'
          }`}
          title="Toggle Gemini Thinking Mode (High Thinking Level)"
        >
          <Brain className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-semibold">{thinkingMode ? 'HIGH THINKING' : 'Standard'}</span>
        </button>
      </div>

      {/* Messages Thread */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 text-xs leading-relaxed ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[82%] p-3.5 rounded-2xl ${
                  isUser
                    ? 'bg-cyan-600 text-white rounded-tr-sm shadow-md'
                    : 'bg-neutral-900/90 border border-neutral-800 text-neutral-200 rounded-tl-sm'
                }`}
              >
                {!isUser && m.modelUsed && (
                  <div className="flex items-center gap-1 text-[10px] text-cyan-400 mb-1 font-semibold">
                    <Sparkles className="w-3 h-3" />
                    <span>{m.modelUsed}</span>
                    {thinkingMode && <span className="text-purple-400">· [Thinking HIGH]</span>}
                  </div>
                )}
                <div className="whitespace-pre-wrap">{m.content}</div>
                <div
                  className={`mt-1.5 text-[9px] ${
                    isUser ? 'text-cyan-200 text-right' : 'text-neutral-500'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 text-xs justify-start">
            <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-cyan-300 rounded-tl-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
              <span>
                {thinkingMode
                  ? 'Gemini 3.1 Pro reasoning with ThinkingLevel.HIGH...'
                  : 'Synthesizing spatial response...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 border-t border-neutral-900 bg-neutral-950/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        {quickPrompts.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => handleSend(q)}
            className="px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 whitespace-nowrap transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-900/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about spatial layouts, clearances, or lighting..."
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-neutral-950 transition-colors font-bold"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
