import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Trash2,
  Download,
  Sparkles,
  Bot,
  RotateCcw,
  ArrowDown,
  Mic,
  MicOff,
  Zap,
  CheckCircle2,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

export default function ChatWindow({
  messages,
  onSendMessage,
  onClearChat,
  isTyping,
  settings,
  onPromptClick,
  onOpenLeadModal,
}) {
  const [input, setInput] = useState('');
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check Web Speech Recognition support
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isTyping]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 120;
    setShowScrollBottom(isFarFromBottom);
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;

    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExportChat = () => {
    if (!messages || messages.length === 0) return;
    const transcript = messages
      .map((m) => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat_transcript_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col relative transition-all duration-300">
      {/* 600px Height Chat Card with 3D glassmorphic styling */}
      <div className="h-[600px] glass-panel-3d rounded-2xl flex flex-col overflow-hidden relative transition-all">
        {/* Chat Window Top Bar */}
        <div className="px-5 py-3.5 border-b border-white/10 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 font-bold text-xs">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 animate-pulse"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {settings.botName || 'AI Assistant'}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-mono font-semibold border border-indigo-500/20">
                  Google Gemini Live
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Official Assistant for {settings.businessName || 'our business'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {/* Export transcript */}
            {messages.length > 1 && (
              <button
                onClick={handleExportChat}
                title="Export chat transcript"
                className="px-2.5 py-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Export</span>
              </button>
            )}

            {/* Clear Chat Button */}
            <button
              onClick={onClearChat}
              title="Clear conversation"
              className="px-2.5 py-1 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors text-xs flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Clear</span>
            </button>
          </div>
        </div>

        {/* Message Stream Area */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-1 relative"
        >
          {messages.map((msg, index) => (
            <ChatMessage
              key={msg.id || index}
              message={msg}
              botName={settings.botName}
              primaryColor={settings.primaryColor}
            />
          ))}

          {/* Typing indicator */}
          {isTyping && <TypingIndicator botName={settings.botName} />}

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll To Bottom Floating Button */}
        {showScrollBottom && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-28 right-6 p-2 bg-slate-900/90 dark:bg-indigo-600 text-white rounded-full shadow-lg hover:scale-105 transition-all text-xs z-10 animate-fade-in"
            title="Scroll to latest message"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}

        {/* Quick Prompts Chips Area */}
        {settings.quickPrompts && settings.quickPrompts.length > 0 && messages.length <= 4 && (
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 overflow-x-auto flex items-center gap-1.5 flex-shrink-0 no-scrollbar">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 flex-shrink-0 mr-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Quick:
            </span>
            {settings.quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => onPromptClick(prompt)}
                disabled={isTyping}
                className="whitespace-nowrap px-3 py-1 text-xs rounded-full bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-all flex-shrink-0 font-medium active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Box Area with rounded-full design and black send button */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0d131f] flex-shrink-0">
          <form
            onSubmit={handleSend}
            className="relative flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-full border border-slate-200/80 dark:border-slate-700/80 shadow-inner px-2 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all"
          >
            <input
              ref={textareaRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Listening to your voice...' : `Ask ${settings.botName || 'AI Assistant'} anything...`}
              disabled={isTyping}
              className="flex-1 bg-transparent px-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none disabled:opacity-50"
            />

            {/* Microphone Voice Input Button */}
            {speechSupported && (
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                title={isListening ? 'Stop listening' : 'Speak your question'}
                className={`p-2 rounded-full transition-all flex-shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {/* Black Send Button with rounded-full design */}
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 rounded-full bg-black hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white flex items-center justify-center transition-all shadow-md disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 ml-1 active:scale-95"
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>

          {/* Micro Footer Notice */}
          <div className="flex items-center justify-between mt-2 px-3 text-[10px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              Press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono">Enter</kbd> to send
            </span>
            <button
              type="button"
              onClick={onOpenLeadModal}
              className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 font-medium"
            >
              <Zap className="w-3 h-3 text-amber-500" />
              Need a specialist? Contact sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
