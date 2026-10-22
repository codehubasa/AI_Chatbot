import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Bot,
  Palette,
  FileText,
  Users,
  Key,
  Save,
  Trash2,
  Download,
  Plus,
  Check,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import {
  clearAdminToken,
  getAdminHeaders,
  getAdminToken,
  setAdminToken,
} from '../utils/adminAuth';

const COLOR_PRESETS = [
  { name: 'Midnight Plum / Sunset Coral', value: '#67264f', preview: 'bg-gradient-to-r from-indigo-800 to-rose-600' },
  { name: 'Indigo Electric', value: '#4f46e5', preview: 'bg-indigo-600' },
  { name: 'Violet AI', value: '#7c3aed', preview: 'bg-violet-600' },
  { name: 'Emerald Trust', value: '#059669', preview: 'bg-emerald-600' },
  { name: 'Rose Premium', value: '#e11d48', preview: 'bg-rose-600' },
  { name: 'Ocean Cyan', value: '#0284c7', preview: 'bg-sky-600' },
  { name: 'Midnight Black', value: '#000000', preview: 'bg-black' },
];

const KNOWLEDGE_TEMPLATES = {
  saas: {
    name: 'SaaS / AI Software',
    content: `Company: CloudFlow AI
Services: Automated workflow automation, webhook connectors, AI text processing, 99.9% uptime SLA.
Pricing:
- Starter: $29/mo (5,000 tasks/mo, email support)
- Growth: $89/mo (50,000 tasks/mo, priority chat support, custom webhooks)
- Enterprise: $299/mo (unlimited tasks, dedicated TAM, SOC2 compliance)
Support Contact: support@cloudflow.io | +1 (800) 555-4321
Operating Hours: 24/7 AI assistance, Human agents available 8am-8pm EST.`,
  },
  ecommerce: {
    name: 'E-Commerce Store',
    content: `Store: Lumina Goods
Products: Premium minimal desk accessories, ergonomic mechanical keyboards, vegan leather desk pads.
Shipping Policy: Free worldwide standard shipping on orders over $50. Express shipping $9.99 (2-3 days).
Return Policy: 30-day hassle-free money back guarantee. Returns are completely free.
Support Contact: help@luminagoods.com | Tracking: luminagoods.com/track`,
  },
  agency: {
    name: 'Digital Agency / Freelancer',
    content: `Agency: Velocity Digital
Services: Web Development, React & Next.js builds, UI/UX Design in Figma, SEO Optimization & Full-Stack AI Chatbot integrations.
Pricing: Custom project quotes starting from $1,500. Retainer packages from $2,000/mo.
Turnaround Time: Standard web apps delivered in 2 to 4 weeks.
Consultation: Free 30-minute discovery call available. Email: hello@velocitydigital.dev`,
  },
  clinic: {
    name: 'Healthcare / Dental Clinic',
    content: `Practice: Horizon Wellness Dental
Services: Routine cleanings, cosmetic teeth whitening, dental implants, Invisalign, pediatric dentistry, and emergency tooth care.
Office Hours: Mon-Fri 8:00 AM - 5:00 PM, Sat 9:00 AM - 2:00 PM.
Insurance Accepted: Delta Dental, Cigna, MetLife, Aetna, and flexible CareCredit financing.
Location: 450 Medical Plaza, Suite 200 | Phone: (555) 789-1000 | Email: frontdesk@horizondental.com`,
  },
};

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  leads = [],
  onDeleteLead,
  onRefreshLeads,
}) {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'knowledge' | 'leads' | 'api'
  const [formData, setFormData] = useState(settings);
  const [newPrompt, setNewPrompt] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [apiStatus, setApiStatus] = useState(null);
  const [checkingApi, setCheckingApi] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminTokenInput, setAdminTokenInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);

  // API Key input & verification states
  const [inputApiKey, setInputApiKey] = useState('');
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [keyVerifySuccess, setKeyVerifySuccess] = useState('');
  const [keyVerifyError, setKeyVerifyError] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  useEffect(() => {
    if (isOpen) {
      checkServerHealth();
    }
  }, [isOpen]);

  const checkServerHealth = async () => {
    setCheckingApi(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setApiStatus(data);
      if (data.adminAuthRequired) {
        await checkAdminSession();
      } else {
        setAdminAuthenticated(true);
        if (onRefreshLeads) onRefreshLeads();
      }
    } catch (e) {
      setApiStatus({ status: 'offline', hasApiKey: false });
    } finally {
      setCheckingApi(false);
    }
  };

  const checkAdminSession = async () => {
    const token = getAdminToken();
    if (!token) {
      setAdminAuthenticated(false);
      return;
    }

    try {
      const res = await fetch('/api/leads', { headers: { 'x-admin-token': token } });
      if (res.ok) {
        setAdminAuthenticated(true);
        if (onRefreshLeads) onRefreshLeads();
      } else {
        clearAdminToken();
        setAdminAuthenticated(false);
      }
    } catch {
      setAdminAuthenticated(false);
    }
  };

  const handleAdminLogin = async () => {
    const token = adminTokenInput.trim();
    if (!token) return;

    setIsCheckingAdmin(true);
    setAdminAuthError('');
    try {
      const res = await fetch('/api/leads', { headers: { 'x-admin-token': token } });
      if (!res.ok) {
        setAdminAuthError('Owner token was not accepted.');
        return;
      }

      setAdminToken(token);
      setAdminAuthenticated(true);
      setAdminTokenInput('');
      if (onRefreshLeads) onRefreshLeads();
    } catch {
      setAdminAuthError('Could not reach the server.');
    } finally {
      setIsCheckingAdmin(false);
    }
  };

  const handleAdminLogout = () => {
    clearAdminToken();
    setAdminAuthenticated(false);
    if (onRefreshLeads) onRefreshLeads();
  };

  const handleVerifyAndSaveKey = async () => {
    if (!inputApiKey.trim()) return;
    setIsVerifyingKey(true);
    setKeyVerifyError('');
    setKeyVerifySuccess('');

    try {
      const res = await fetch('/api/verify-key', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ apiKey: inputApiKey.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setKeyVerifySuccess(data.message || 'API Key connected successfully!');
        setInputApiKey('');
        checkServerHealth();
      } else {
        setKeyVerifyError(data.error || 'Failed to verify OpenAI API Key.');
      }
    } catch (err) {
      setKeyVerifyError('Network error connecting to verification endpoint.');
    } finally {
      setIsVerifyingKey(false);
    }
  };

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddPrompt = () => {
    if (!newPrompt.trim()) return;
    const current = formData.quickPrompts || [];
    setFormData((prev) => ({
      ...prev,
      quickPrompts: [...current, newPrompt.trim()],
    }));
    setNewPrompt('');
  };

  const handleRemovePrompt = (index) => {
    const updated = (formData.quickPrompts || []).filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, quickPrompts: updated }));
  };

  const handleApplyTemplate = (key) => {
    const template = KNOWLEDGE_TEMPLATES[key];
    if (template) {
      setFormData((prev) => ({
        ...prev,
        businessContext: template.content,
        businessName: template.name.split('/')[0].trim(),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const saved = await onSaveSettings(formData);
    if (!saved) {
      setSavedSuccess(false);
      setSaveError('Could not save settings. Check owner access and try again.');
      return;
    }
    setSaveError('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportLeadsCSV = () => {
    if (!leads || leads.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Message', 'Created At'];
    const rows = leads.map((l) => [
      l.id,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.message || '').replace(/"/g, '""')}"`,
      `"${l.createdAt || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_${formData.businessName || 'export'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transition-all animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Business & AI Control Panel
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customize appearance, AI knowledge base, and view captured leads
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/40 px-6 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4" />
            Bot & Branding
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'knowledge'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Business Knowledge (FAQ)
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'leads'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Customer Leads
            {leads.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 rounded-full text-[10px] font-bold">
                {leads.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'api'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            API & Deploy Guide
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: GENERAL BOT SETTINGS */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={formData.businessName || ''}
                    onChange={(e) => handleChange('businessName', e.target.value)}
                    placeholder="e.g. Apex Technologies"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bot Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.botName || ''}
                    onChange={(e) => handleChange('botName', e.target.value)}
                    placeholder="e.g. Nova AI Assistant"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Welcome Greeting Message
                </label>
                <textarea
                  rows={2}
                  value={formData.welcomeMessage || ''}
                  onChange={(e) => handleChange('welcomeMessage', e.target.value)}
                  placeholder="The first greeting message displayed in the chat..."
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none resize-none"
                />
              </div>

              {/* Primary Color Palette */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-500" />
                  Primary User Bubble Color
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handleChange('primaryColor', preset.value)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left border text-xs transition-all ${
                        formData.primaryColor === preset.value
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-slate-900 dark:text-white font-semibold'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${preset.preview} border border-white/20`} />
                      <span className="truncate">{preset.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Prompts Chips Editor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    Quick Suggestion Chips
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Shown above chat input
                  </span>
                </label>

                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPrompt())}
                    placeholder="Add a new suggestion question..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddPrompt}
                    className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(formData.quickPrompts || []).map((prompt, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      {prompt}
                      <button
                        type="button"
                        onClick={() => handleRemovePrompt(idx)}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KNOWLEDGE BASE / BUSINESS CONTEXT */}
          {activeTab === 'knowledge' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Business Knowledge & FAQ Context
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Fed directly into GPT-4o-mini system prompt
                  </span>
                </div>

                {/* 1-Click Industry Templates */}
                <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                    💡 1-Click Knowledge Templates:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(KNOWLEDGE_TEMPLATES).map(([key, item]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleApplyTemplate(key)}
                        className="px-2.5 py-1 text-xs bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 transition-all font-medium"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={9}
                  value={formData.businessContext || ''}
                  onChange={(e) => handleChange('businessContext', e.target.value)}
                  placeholder="Paste all information about your business: pricing plans, product features, return policy, support hours, FAQ answers, phone numbers, etc..."
                  className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none leading-relaxed"
                />
              </div>

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Guardrails:</strong> The AI will prioritize this knowledge base. If asked something not in this text, it is instructed to be short, friendly, and advise the user to reach out to human support.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMER LEADS VIEWER */}
          {activeTab === 'leads' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Collected Customer Leads ({leads.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Saved in server's <code>leads.json</code> when visitors leave contact info
                  </p>
                </div>

                {leads.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportLeadsCSV}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                )}
              </div>

              {leads.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No leads captured yet.</p>
                  <p className="text-xs mt-1">
                    When visitors enter their email or phone in chat, they will appear here in real-time.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {lead.name || 'Anonymous Visitor'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ''}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600 dark:text-slate-300">
                          {lead.email && <span>📧 {lead.email}</span>}
                          {lead.phone && <span>📞 {lead.phone}</span>}
                        </div>

                        {lead.message && (
                          <p className="text-slate-700 dark:text-slate-200 italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800 mt-1.5">
                            "{lead.message}"
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteLead && onDeleteLead(lead.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Delete lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: API STATUS & DEPLOYMENT GUIDE */}
          {activeTab === 'api' && (
            <div className="space-y-4 animate-fade-in text-xs">
              {apiStatus?.adminAuthRequired && (
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">Owner access</h3>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {adminAuthenticated ? 'Admin controls are unlocked for this browser tab.' : 'Enter the private ADMIN_API_TOKEN configured in Render.'}
                      </p>
                    </div>
                    {adminAuthenticated && (
                      <button type="button" onClick={handleAdminLogout} className="text-indigo-600 dark:text-indigo-400 font-semibold">
                        Sign out
                      </button>
                    )}
                  </div>
                  {!adminAuthenticated && (
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={adminTokenInput}
                        onChange={(event) => setAdminTokenInput(event.target.value)}
                        onKeyDown={(event) => event.key === 'Enter' && handleAdminLogin()}
                        placeholder="Owner token"
                        autoComplete="off"
                        className="flex-1 min-w-0 px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none"
                      />
                      <button
                        type="button"
                        disabled={isCheckingAdmin || !adminTokenInput.trim()}
                        onClick={handleAdminLogin}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold"
                      >
                        {isCheckingAdmin ? 'Checking...' : 'Unlock'}
                      </button>
                    </div>
                  )}
                  {adminAuthError && <p className="text-rose-600 dark:text-rose-400">{adminAuthError}</p>}
                </div>
              )}

              {/* API Key Configuration Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      AI Provider & API Key Configuration
                    </span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    apiStatus?.hasApiKey
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${apiStatus?.hasApiKey ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    {apiStatus?.hasApiKey ? `Live AI: ${apiStatus.model}` : 'Offline Demo Engine'}
                  </span>
                </div>

                {apiStatus?.keyManagedByEnvironment ? (
                  <p className="text-slate-600 dark:text-slate-300 text-xs">
                    The provider key is server-only. Set <code>GEMINI_API_KEY</code>, <code>GROQ_API_KEY</code>, or <code>OPENAI_API_KEY</code> in Render Environment settings; never enter it in the public app.
                  </p>
                ) : (
                  <>
                    <p className="text-slate-600 dark:text-slate-300 text-xs">
                      Connect <strong>Google Gemini (100% Free)</strong>, <strong>Groq Free</strong>, or <strong>OpenAI</strong>. Enter your key below:
                    </p>

                    <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={inputApiKey}
                      onChange={(e) => {
                        setInputApiKey(e.target.value);
                        setKeyVerifyError('');
                        setKeyVerifySuccess('');
                      }}
                      placeholder="Paste key: AIza... or AQ... (Gemini Free) or gsk_... (Groq) or sk-... (OpenAI)"
                      className="flex-1 px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white outline-none"
                    />
                    <button
                      type="button"
                      disabled={isVerifyingKey || !inputApiKey.trim()}
                      onClick={handleVerifyAndSaveKey}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm flex-shrink-0"
                    >
                      {isVerifyingKey ? (
                        <span>Verifying...</span>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Connect Live AI</span>
                        </>
                      )}
                    </button>
                  </div>

                  {keyVerifySuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{keyVerifySuccess}</span>
                    </div>
                  )}

                  {keyVerifyError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-fade-in">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{keyVerifyError}</span>
                    </div>
                  )}
                    </div>
                  </>
                )}
              </div>

              {/* Free Google Gemini Guide (RECOMMENDED) */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-900 text-slate-200 border border-blue-800/50 space-y-2.5 shadow-md">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    Google Gemini API (100% Free - Instant with Gmail)
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase">
                    Recommended
                  </span>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed text-slate-300">
                  <li>Visit 👉 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 font-semibold underline hover:text-blue-300">aistudio.google.com/app/apikey</a> and sign in with your regular Google account.</li>
                  <li>Click <strong>"Create API Key"</strong> &rarr; select <strong>"Create in new project"</strong>.</li>
                  <li>Copy your key (starts with <code className="text-blue-300 font-mono">AIzaSy...</code> or <code className="text-blue-300 font-mono">AQ...</code>).</li>
                  <li>Paste into the box above and click <strong>"Connect Live AI"</strong>!</li>
                </ol>
              </div>

              {/* Free Groq Guide */}
              <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Groq Cloud API (100% Free - Llama 3.3)
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                    Free
                  </span>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed text-slate-300">
                  <li>Visit <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-emerald-400 font-semibold underline hover:text-emerald-300">console.groq.com/keys</a>.</li>
                  <li>Create API key starting with <code className="text-emerald-300 font-mono">gsk_...</code> and paste above.</li>
                </ol>
              </div>

              {/* OpenAI Guide */}
              <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 space-y-2.5">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-indigo-400" />
                  OpenAI (GPT-4o-mini)
                </h4>
                <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed text-slate-300">
                  <li>Requires $5 credit balance at <a href="https://platform.openai.com/settings/organization/billing/overview" target="_blank" rel="noreferrer" className="text-indigo-400 underline">OpenAI Billing</a>.</li>
                  <li>Create key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-indigo-400 underline">platform.openai.com/api-keys</a> (<code className="text-indigo-300 font-mono">sk-proj-...</code>).</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 space-y-2.5">
                <h4 className="font-bold text-white text-sm">
                  🚀 1-Click Render.com Deployment Steps
                </h4>
                <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed text-slate-300">
                  <li>Push this repository to your GitHub account.</li>
                  <li>Go to <strong>Render.com</strong> &rarr; Click <strong>New +</strong> &rarr; <strong>Web Service</strong>.</li>
                  <li>Select your repo and configure:
                    <ul className="list-disc pl-4 mt-1 space-y-0.5 text-slate-400 font-mono text-[11px]">
                      <li>Build Command: <code>npm run build</code></li>
                      <li>Start Command: <code>npm start</code></li>
                    </ul>
                  </li>
                  <li>In <strong>Environment Variables</strong>, add:
                    <ul className="list-disc pl-4 mt-1 space-y-0.5 text-indigo-300 font-mono text-[11px]">
                      <li><code>OPENAI_API_KEY</code> = <code>sk-proj-...</code></li>
                      <li><code>PORT</code> = <code>5000</code></li>
                    </ul>
                  </li>
                  <li>Click <strong>Deploy Web Service</strong>! Your single full-stack app is live.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {saveError && (
              <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{saveError}</span>
            )}
            {savedSuccess && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 animate-fade-in">
                <Check className="w-3.5 h-3.5" />
                Settings saved successfully!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-semibold bg-slate-900 hover:bg-black dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
