import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Settings,
  Mail,
  Globe,
  ChevronDown,
  Check,
  ShieldCheck,
} from 'lucide-react';

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
  { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
];

export default function Navbar({
  businessName,
  botName,
  darkMode,
  onToggleDarkMode,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
  onOpenLeadModal,
  leadsCount = 0,
  selectedLanguage = 'en',
  onSelectLanguage,
}) {
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full border-b border-white/10 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-40 transition-all shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Left */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 transform transition-transform group-hover:scale-105 group-hover:rotate-3 flex-shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-2xl blur-sm opacity-30 group-hover:opacity-60 transition duration-300 -z-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display tracking-tight leading-none">
                AI Assistant
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live 3D AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px] sm:max-w-xs mt-0.5">
              Powered by {businessName || 'Business AI'}
            </p>
          </div>
        </div>

        {/* Action Controls Right */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Multilingual Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setLangDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-xl transition-all shadow-sm"
              title="Select Language"
            >
              <span className="text-sm">{currentLang.flag}</span>
              <span className="hidden sm:inline">{currentLang.native}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 max-h-64 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 animate-fade-in backdrop-blur-xl">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Global Languages
                </div>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      if (onSelectLanguage) onSelectLanguage(lang.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      selectedLanguage === lang.code
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{lang.flag}</span>
                      <span>{lang.native}</span>
                      <span className="text-[10px] text-slate-400">({lang.name})</span>
                    </span>
                    {selectedLanguage === lang.code && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Contact / Lead Capture Button */}
          <button
            onClick={onOpenLeadModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-xl transition-all shadow-sm"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Human</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-slate-700 dark:text-slate-200" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Business Owner Settings & Customization Button */}
          <button
            onClick={onOpenSettings}
            className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all ml-1 border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
            title="Bot Settings & Business Control Panel"
          >
            <Settings className="w-4 h-4" />
            {leadsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shadow">
                {leadsCount > 9 ? '9+' : leadsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
