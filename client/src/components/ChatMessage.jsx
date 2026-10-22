import React, { useState } from 'react';
import { Copy, Check, Volume2, VolumeX, Sparkles, User } from 'lucide-react';
import { FormattedMarkdown } from '../utils/markdown';

export default function ChatMessage({ message, botName, primaryColor }) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isUser = message.role === 'user';

  const formatTime = (dateStr) => {
    try {
      const date = dateStr ? new Date(dateStr) : new Date();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleCopy = async () => {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      className={`flex items-end gap-2.5 my-3 animate-fade-in group ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-1 shadow-sm text-xs font-semibold ${
          isUser
            ? 'bg-slate-900 text-white dark:bg-slate-700'
            : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white'
        }`}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
      </div>

      {/* Bubble Container */}
      <div className={`flex flex-col max-w-[82%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Author Label */}
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1 px-1 flex items-center gap-1.5">
          {isUser ? 'You' : botName || 'AI Assistant'}
          <span className="text-[10px] text-slate-400 opacity-70">
            • {formatTime(message.timestamp)}
          </span>
        </span>

        {/* Bubble */}
        <div
          style={isUser && primaryColor ? { backgroundColor: primaryColor } : undefined}
          className={`px-4 py-3 rounded-2xl relative shadow-sm transition-all ${
            isUser
              ? 'bg-black text-white rounded-br-sm dark:bg-slate-900 dark:text-white dark:border dark:border-slate-800'
              : 'bg-gray-100 text-gray-900 rounded-bl-sm dark:bg-slate-800/90 dark:text-slate-100 border border-gray-200/80 dark:border-slate-700/60'
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <FormattedMarkdown content={message.content} />
          )}

          {/* Fallback or demo badge note if active */}
          {message.isDemo && (
            <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between text-[11px] text-indigo-500 dark:text-indigo-400">
              <span className="font-mono">Demo mode (add OPENAI_API_KEY for live gpt-4o-mini)</span>
            </div>
          )}
        </div>

        {/* Action Controls underneath Bot Bubble */}
        {!isUser && (
          <div className="flex items-center gap-1 mt-1.5 px-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-opacity">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              title="Copy response"
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Read Aloud Button */}
            {typeof window !== 'undefined' && 'speechSynthesis' in window && (
              <button
                onClick={handleSpeak}
                title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3 h-3 text-indigo-500" />
                    <span className="text-indigo-500">Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3 h-3" />
                    <span>Listen</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
