import React, { useState, useEffect, useRef } from 'react';
import Navbar, { LANGUAGES } from './components/Navbar';
import ChatWindow from './components/ChatWindow';
import SettingsModal from './components/SettingsModal';
import LeadCaptureModal from './components/LeadCaptureModal';
import { getAdminHeaders } from './utils/adminAuth';
import { playSendSound, playReceiveSound } from './utils/sound';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Headphones,
  Mail,
  ArrowRight,
  CheckCircle2,
  Lock,
  Globe,
  Layers,
} from 'lucide-react';

const DEFAULT_SETTINGS = {
  businessName: 'Cypher Chatbot',
  botName: 'Cypher Chatbot',
  welcomeMessage:
    "Hi! I'm Cypher Chatbot. Ask me anything, and I'll do my best to help.",
  primaryColor: '#67264f',
  themeAccent: 'plum-coral',
  businessContext: '',
  quickPrompts: [
    'Explain a difficult concept simply',
    'Help me solve a math problem',
    'Help me write or improve some text',
    'Tell me something interesting about science',
  ],
  enableSound: true,
};

export default function App() {
  // Theme state (Dark/Light mode)
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('ai_chat_theme');
      if (savedTheme) return savedTheme === 'dark';
      return true; // Default to dark luxury theme
    }
    return true;
  });

  // Multilingual Language state
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ai_chat_lang') || 'en';
    }
    return 'en';
  });

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_chat_sound');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  // Business settings state
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Messages state
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // Leads list state
  const [leads, setLeads] = useState([]);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  // 3D Parallax state
  const [tiltStyle, setTiltStyle] = useState({});
  const cardContainerRef = useRef(null);

  // Apply dark mode class to root document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ai_chat_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ai_chat_theme', 'light');
    }
  }, [darkMode]);

  // Load initial settings and leads on mount
  useEffect(() => {
    fetchSettings();
    fetchLeads();
  }, []);

  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode);
    localStorage.setItem('ai_chat_lang', langCode);
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        // Initialize welcome message with fetched greeting
        if (messages.length === 0) {
          setMessages([
            {
              id: 'welcome-msg',
              role: 'assistant',
              content: data.welcomeMessage || DEFAULT_SETTINGS.welcomeMessage,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      }
    } catch (e) {
      console.warn('Using default settings fallback:', e.message);
      if (messages.length === 0) {
        setMessages([
          {
            id: 'welcome-msg',
            role: 'assistant',
            content: DEFAULT_SETTINGS.welcomeMessage,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads', { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      } else if (res.status === 401) {
        setLeads([]);
      }
    } catch (e) {
      console.error('Error fetching leads:', e);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('ai_chat_sound', String(next));
  };

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleSaveSettings = async (newSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(newSettings),
      });
      if (!res.ok) return false;

      setSettings(newSettings);
      if (messages.length <= 1) {
        setMessages([
          {
            id: 'welcome-msg',
            role: 'assistant',
            content: newSettings.welcomeMessage || DEFAULT_SETTINGS.welcomeMessage,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
      return true;
    } catch (err) {
      console.error('Failed to save settings:', err);
      return false;
    }
  };

  const handleDeleteLead = async (leadId) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
      }
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsTyping(true);
    playSendSound(soundEnabled);

    try {
      // Build conversation history from PRIOR turns (excluding new message)
      const historyForApi = messages
        .filter((m) => m.id !== 'welcome-msg')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const activeLangObj = LANGUAGES.find((l) => l.code === selectedLanguage);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: historyForApi,
          businessName: settings.businessName,
          businessContext: settings.businessContext,
          language: activeLangObj ? activeLangObj.name : null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.reply) {
        const botMessage = {
          id: 'bot-' + Date.now(),
          role: 'assistant',
          content: data.reply,
          timestamp: data.timestamp || new Date().toISOString(),
          isDemo: data.isDemo || false,
        };
        setMessages((prev) => [...prev, botMessage]);
        playReceiveSound(soundEnabled);
      } else {
        const errorMessage = {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content:
            data.error ||
            'I experienced a brief connection hiccup. Please try again or contact support.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }

      fetchLeads();
    } catch (err) {
      const errorMessage = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content:
          'Unable to reach the assistant server. Please check your internet connection or server logs.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the conversation?')) {
      setMessages([
        {
          id: 'welcome-' + Date.now(),
          role: 'assistant',
          content: settings.welcomeMessage || DEFAULT_SETTINGS.welcomeMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  // Subtle 3D Card Tilt Handler
  const handleMouseMove = (e) => {
    if (!cardContainerRef.current) return;
    const rect = cardContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = (-y / rect.height) * 3; // subtle 3deg max
    const rotateY = (x / rect.width) * 3;
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`,
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fff8fa] dark:bg-[#120b16] text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden font-sans transition-colors duration-200">
      <div className="scene-backdrop" aria-hidden="true" />

      {/* Top Navigation */}
      <Navbar
        businessName={settings.businessName}
        botName={settings.botName}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLeadModal={() => setIsLeadModalOpen(true)}
        leadsCount={leads.length}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={handleLanguageChange}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center justify-center relative z-10">
        {/* Landing Page Hero Header */}
        <div className="text-center max-w-xl mx-auto mb-6 space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-md backdrop-blur-md animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
            <span>Multilingual 3D Enterprise AI Suite</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-slate-900 dark:text-white drop-shadow-sm">
            {settings.businessName || 'Apex Technologies'}{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-800 via-purple-700 to-rose-700 dark:from-indigo-300 dark:via-purple-300 dark:to-pink-300">
              AI Support
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
            Instant 24/7 answers to pricing, custom solutions, and general inquiries in <strong>10+ languages</strong>. Powered by Google Gemini & Groq.
          </p>
        </div>

        {/* 3D Tilt Wrapper for Chat Window */}
        <div 
          ref={cardContainerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={tiltStyle}
          className="w-full max-w-2xl transition-transform duration-200 ease-out"
        >
          <ChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            isTyping={isTyping}
            settings={settings}
            onPromptClick={handleSendMessage}
            onOpenLeadModal={() => setIsLeadModalOpen(true)}
          />
        </div>

        {/* 3D Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-2xl w-full mt-6">
          <div className="p-3.5 rounded-2xl glass-panel-3d flex items-start gap-3 shadow-md hover:scale-[1.02] transition-all">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 flex-shrink-0 shadow-inner">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                Multilingual AI
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Fluently speaks English, Spanish, French, Hindi, Japanese & more.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-panel-3d flex items-start gap-3 shadow-md hover:scale-[1.02] transition-all">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20 flex-shrink-0 shadow-inner">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                Lead Auto-Capture
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Emails and phones left in chat are securely stored to leads.json.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-panel-3d flex items-start gap-3 shadow-md hover:scale-[1.02] transition-all">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex-shrink-0 shadow-inner">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                Admin Control Hub
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Customize bot persona, knowledge base, voice chimes & API keys.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer: "Powered by [Business Name]" */}
      <footer className="w-full border-t border-white/10 dark:border-slate-800/80 bg-white/40 dark:bg-slate-950/60 backdrop-blur-xl py-4 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Powered by <strong>{settings.businessName || 'Business Name'}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <Lock className="w-3 h-3 text-emerald-500" />
              100% Secure & Encrypted
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-indigo-500 transition-colors"
            >
              Business Settings
            </button>
            <button
              onClick={() => setIsLeadModalOpen(true)}
              className="hover:text-indigo-500 transition-colors"
            >
              Contact Team
            </button>
            <span>v1.0.0 (Production)</span>
          </div>
        </div>
      </footer>

      {/* Business Owner Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        leads={leads}
        onDeleteLead={handleDeleteLead}
        onRefreshLeads={fetchLeads}
      />

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        businessName={settings.businessName}
        onLeadSubmitted={(newLead) => setLeads((prev) => [newLead, ...prev])}
      />
    </div>
  );
}
