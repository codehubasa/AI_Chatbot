import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

export default function TypingIndicator({ botName = 'AI Assistant' }) {
  return (
    <div className="flex items-start gap-3 my-3 animate-fade-in">
      {/* Bot Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md flex-shrink-0 mt-0.5">
        <Sparkles className="w-4 h-4" />
      </div>

      {/* Bubble with Typing text and animated bouncing dots */}
      <div className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          AI is typing
        </span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full dot-1"></span>
          <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full dot-2"></span>
          <span className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full dot-3"></span>
        </div>
      </div>
    </div>
  );
}
