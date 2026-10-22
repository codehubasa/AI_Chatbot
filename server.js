const express = require('express');
const dotenv = require('dotenv');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const OpenAI = require('openai');
const { rateLimit } = require('express-rate-limit');

const ENV_FILE = path.join(os.homedir(), '.ai-chatbot.private.env');
dotenv.config({ path: ENV_FILE });

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const HOST = IS_PRODUCTION ? '0.0.0.0' : '127.0.0.1';
const ADMIN_API_TOKEN = (process.env.ADMIN_API_TOKEN || '').trim();
app.set('trust proxy', IS_PRODUCTION ? 1 : false);

app.use((req, res, next) => {
  if (!IS_PRODUCTION && !['localhost', '127.0.0.1'].includes((req.hostname || '').toLowerCase())) {
    return res.status(403).json({ error: 'Local access only.' });
  }

  const origin = req.get('origin');
  if (origin) {
    try {
      const originUrl = new URL(origin);
      const localHosts = ['localhost', '127.0.0.1'];
      const isLocalDevelopmentOrigin = !IS_PRODUCTION
        && localHosts.includes(originUrl.hostname.toLowerCase())
        && localHosts.includes((req.hostname || '').toLowerCase());

      if (!isLocalDevelopmentOrigin && originUrl.host.toLowerCase() !== (req.get('host') || '').toLowerCase()) {
        return res.status(403).json({ error: 'Cross-origin requests are not allowed.' });
      }
    } catch {
      return res.status(403).json({ error: 'Invalid request origin.' });
    }
  }

  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

function requireAdmin(req, res, next) {
  if (!IS_PRODUCTION && !ADMIN_API_TOKEN) return next();

  const providedToken = Buffer.from(req.get('x-admin-token') || '');
  const configuredToken = Buffer.from(ADMIN_API_TOKEN);
  const isAuthorized = configuredToken.length > 0
    && providedToken.length === configuredToken.length
    && crypto.timingSafeEqual(providedToken, configuredToken);

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Admin authentication required.' });
  }

  next();
}

if (IS_PRODUCTION && ADMIN_API_TOKEN.length < 32) {
  throw new Error('Set ADMIN_API_TOKEN to a random value of at least 32 characters in the production environment.');
}

if (IS_PRODUCTION && !['GEMINI_API_KEY', 'GROQ_API_KEY', 'OPENAI_API_KEY'].some((name) => process.env[name]?.trim())) {
  throw new Error('Set a provider API key in the production environment before deploying.');
}

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many chat requests. Please try again later.' },
});

const leadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many contact submissions. Please try again later.' },
});

// Path to data files
const LEADS_FILE = path.join(__dirname, 'leads.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

// Active API configuration
let activeApiKey = (process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || '').trim();
let activeProvider = detectProvider(activeApiKey);

// Helper to determine AI provider from key format
function detectProvider(key) {
  const cleanKey = (key || '').trim().replace(/^["']|["']$/g, '');
  if (!cleanKey) return 'demo';
  if (cleanKey.startsWith('gsk_')) return 'groq';
  if (cleanKey.startsWith('sk-')) return 'openai';
  // AIza..., AQ..., and Google AI Studio keys
  return 'gemini';
}

// Helper to safely read JSON files
const readJsonFile = (filePath, defaultData = []) => {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data || JSON.stringify(defaultData));
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return defaultData;
  }
};

// Helper to safely write JSON files
const writeJsonFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error.message);
    return false;
  }
};

// ==========================================
// AI Calling Utilities (Gemini, Groq, OpenAI)
// ==========================================

async function callGemini(apiKey, systemPrompt, messages, maxTokens = 800) {
  const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '');
  const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'];
  
  // Format conversation contents for Gemini
  const contents = [];
  for (const m of messages) {
    if (m.role === 'system') continue;
    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }]
    });
  }

  const payload = {
    contents,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: maxTokens
    }
  };

  if (systemPrompt) {
    payload.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  let lastError = null;
  for (const modelName of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok && data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return {
          reply: data.candidates[0].content.parts[0].text,
          model: modelName,
          provider: 'gemini'
        };
      } else if (data.error) {
        lastError = new Error(data.error.message || `Gemini API error (${data.error.code})`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to generate response from Google Gemini API.');
}

async function callOpenAICompatible(apiKey, provider, systemPrompt, messages, modelOverride) {
  const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '');
  const baseURL = provider === 'groq' ? 'https://api.groq.com/openai/v1' : undefined;
  const defaultModel = provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';
  const modelToUse = modelOverride || defaultModel;

  const client = new OpenAI({
    apiKey: cleanKey,
    baseURL
  });

  const fullMessages = [];
  if (systemPrompt) {
    fullMessages.push({ role: 'system', content: systemPrompt });
  }
  for (const m of messages) {
    if (m.role === 'system') continue;
    fullMessages.push({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    });
  }

  const completion = await client.chat.completions.create({
    model: modelToUse,
    messages: fullMessages,
    temperature: 0.2,
    max_tokens: 800
  });

  return {
    reply: completion.choices[0]?.message?.content || '',
    model: modelToUse,
    provider
  };
}

// Unified AI Dispatcher
async function generateAIResponse(apiKey, systemPrompt, messages, modelOverride) {
  const provider = detectProvider(apiKey);
  if (provider === 'gemini') {
    return await callGemini(apiKey, systemPrompt, messages);
  } else {
    return await callOpenAICompatible(apiKey, provider, systemPrompt, messages, modelOverride);
  }
}

// ==========================================
// 1. Health & Status Route
// ==========================================
app.get('/api/health', (req, res) => {
  const currentKey = activeApiKey || process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || '';
  const hasKey = Boolean(currentKey && currentKey.trim().length > 5);
  
  let provider = detectProvider(currentKey);
  let model = 'Offline Demo Engine';

  if (provider === 'gemini') {
    model = 'Google Gemini 100% Free (gemini-3.5-flash-lite)';
  } else if (provider === 'groq') {
    model = 'Groq Free (llama-3.3-70b-versatile)';
  } else if (provider === 'openai') {
    model = 'OpenAI (gpt-4o-mini)';
  }

  res.json({
    status: 'online',
    port: PORT,
    hasApiKey: hasKey,
    adminAuthRequired: IS_PRODUCTION || Boolean(ADMIN_API_TOKEN),
    keyManagedByEnvironment: IS_PRODUCTION,
    provider,
    model,
    serverTime: new Date().toISOString()
  });
});

// ==========================================
// 2. AI Key Verification & Save Endpoint
// ==========================================
app.post('/api/verify-key', requireAdmin, async (req, res) => {
  if (IS_PRODUCTION) {
    return res.status(403).json({ error: 'Set the provider key in the hosting environment variables.' });
  }

  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return res.status(400).json({ success: false, error: 'Please enter a valid API key.' });
  }

  const cleanKey = apiKey.trim().replace(/^["']|["']$/g, '');
  const provider = detectProvider(cleanKey);

  try {
    let verifiedModel = '';
    if (provider === 'gemini') {
      const result = await callGemini(cleanKey, '', [{ role: 'user', content: 'Say "Connected successfully!"' }], 20);
      verifiedModel = result.model;
    } else {
      const result = await callOpenAICompatible(cleanKey, provider, '', [{ role: 'user', content: 'Say "Connected successfully!"' }]);
      verifiedModel = result.model;
    }

    // Save active key & provider
    activeApiKey = cleanKey;
    activeProvider = provider;

    if (provider === 'gemini') {
      process.env.GEMINI_API_KEY = cleanKey;
      process.env.OPENAI_API_KEY = cleanKey;
    } else if (provider === 'groq') {
      process.env.GROQ_API_KEY = cleanKey;
    } else {
      process.env.OPENAI_API_KEY = cleanKey;
    }

    // Persist to .env
    try {
      let envContent = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf-8') : '';
      if (provider === 'gemini') {
        if (envContent.includes('GEMINI_API_KEY=')) {
          envContent = envContent.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${cleanKey}`);
        } else {
          envContent += `\nGEMINI_API_KEY=${cleanKey}\n`;
        }
        if (envContent.includes('OPENAI_API_KEY=')) {
          envContent = envContent.replace(/OPENAI_API_KEY=.*/g, `OPENAI_API_KEY=${cleanKey}`);
        } else {
          envContent += `\nOPENAI_API_KEY=${cleanKey}\n`;
        }
      } else if (provider === 'groq') {
        if (envContent.includes('GROQ_API_KEY=')) {
          envContent = envContent.replace(/GROQ_API_KEY=.*/g, `GROQ_API_KEY=${cleanKey}`);
        } else {
          envContent += `\nGROQ_API_KEY=${cleanKey}\n`;
        }
      } else {
        if (envContent.includes('OPENAI_API_KEY=')) {
          envContent = envContent.replace(/OPENAI_API_KEY=.*/g, `OPENAI_API_KEY=${cleanKey}`);
        } else {
          envContent += `\nOPENAI_API_KEY=${cleanKey}\n`;
        }
      }
      fs.writeFileSync(ENV_FILE, envContent, 'utf-8');
    } catch (e) {
      console.warn('Could not write to .env:', e.message);
    }

    const providerNames = {
      gemini: 'Google Gemini (100% Free Tier)',
      groq: 'Groq Cloud (Llama 3.3 Free)',
      openai: 'OpenAI (GPT-4o-mini)'
    };

    return res.json({
      success: true,
      message: `Successfully connected to ${providerNames[provider] || provider}! Live AI is active.`,
      provider,
      model: verifiedModel
    });
  } catch (error) {
    console.error('API Key verification error:', error.message);
    return res.status(401).json({
      success: false,
      error: `Verification failed: ${error.message}`
    });
  }
});

// ==========================================
// 3. Settings Endpoints
// ==========================================
app.get('/api/settings', (req, res) => {
  const defaultSettings = {
    businessName: 'Cypher Chatbot',
    botName: 'Cypher Chatbot',
    welcomeMessage: "Hi! I'm Cypher Chatbot. Ask me anything, and I'll do my best to help.",
    primaryColor: '#67264f',
    themeAccent: 'plum-coral',
    businessContext: '',
    quickPrompts: [
      'Explain a difficult concept simply',
      'Help me solve a math problem',
      'Help me write or improve some text',
      'Tell me something interesting about science'
    ],
    enableSound: true
  };

  const settings = readJsonFile(SETTINGS_FILE, defaultSettings);
  res.json(settings);
});

app.post('/api/settings', requireAdmin, (req, res) => {
  try {
    const updatedSettings = req.body;
    writeJsonFile(SETTINGS_FILE, updatedSettings);
    res.json({ success: true, settings: updatedSettings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 4. AI Chat Completion Endpoint
// ==========================================
app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const {
      message,
      conversationHistory = [],
      businessName: reqBusinessName,
      businessContext: reqBusinessContext,
      apiKeyOverride = null,
      model = null,
      language = null
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'A valid message string is required.' });
    }

    // Load saved settings for default context if not provided in payload
    const savedSettings = readJsonFile(SETTINGS_FILE, {});
    const businessName = reqBusinessName || savedSettings.businessName || 'Apex Technologies';
    const businessContext = reqBusinessContext || savedSettings.businessContext || '';

    // Determine API Key: use body override, in-memory key, or environment variable
    const apiKey = (apiKeyOverride && apiKeyOverride.trim()) || activeApiKey || process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

    // Check if the user is asking to be contacted or providing contact details
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const emailMatch = message.match(emailRegex);
    const phoneMatch = message.match(phoneRegex);

    if (emailMatch || phoneMatch) {
      // Auto-save lead in background if contact info is detected
      const leads = readJsonFile(LEADS_FILE, []);
      const newLead = {
        id: 'lead-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: 'Website Visitor',
        email: emailMatch ? emailMatch[0] : '',
        phone: phoneMatch ? phoneMatch[0] : '',
        message: message,
        createdAt: new Date().toISOString(),
        status: 'auto-captured'
      };
      leads.unshift(newLead);
      writeJsonFile(LEADS_FILE, leads);
    }

    const systemPrompt = `You are a helpful, capable, general-purpose AI assistant. Answer questions across topics including general knowledge, coding, science, mathematics, writing, reasoning, and everyday problem-solving. Respond directly to the user's actual question; do not steer unrelated questions toward a business or customer support.

  Optional business context for relevant questions about "${businessName}":
  """
  ${businessContext || 'No custom business context has been provided.'}
  """

  Use provided business context only when it is relevant, and never invent business-specific facts. If the user asks for information that is not in that context, be clear about what is unknown. Respond naturally in the language the user uses${language ? ` (Target response language preference: ${language})` : ''}. Use clear formatting when it helps.`;

    // Build the messages payload
    const messages = [];

    // Append recent conversational context (last 8 turns)
    if (Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-8);
      for (const turn of recentHistory) {
        if (turn.role && turn.content && turn.content.trim()) {
          messages.push({
            role: turn.role === 'user' ? 'user' : 'assistant',
            content: turn.content.trim()
          });
        }
      }
    }

    // Only append current message if not already the last item in conversationHistory
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== message.trim()) {
      messages.push({ role: 'user', content: message.trim() });
    }

    // If API Key is available, call AI Provider
    if (apiKey && apiKey.trim().length > 5) {
      try {
        const result = await generateAIResponse(apiKey, systemPrompt, messages, model);

        return res.json({
          reply: result.reply,
          model: result.model,
          provider: result.provider,
          timestamp: new Date().toISOString(),
          isLiveAI: true
        });
      } catch (aiErr) {
        console.error('AI Provider Error:', aiErr.message);

        // If error occurs, fall back to smart contextual response
        const fallback = generateSmartFallbackReply(message, businessName, businessContext);
        return res.json({
          reply: fallback + `\n\n*(Note: AI Provider issue: ${aiErr.message}. Showing contextual response. You can update your key in Settings ⚙️)*`,
          timestamp: new Date().toISOString(),
          isFallback: true
        });
      }
    } else {
      // High-grade offline NLP reasoning engine that analyzes the question against all sections of the knowledge base
      const reply = generateSmartFallbackReply(message, businessName, businessContext);
      return res.json({
        reply,
        timestamp: new Date().toISOString(),
        isDemo: true
      });
    }

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'An internal server error occurred while processing the chat.',
      details: error.message
    });
  }
});

// Comprehensive Semantic Knowledge Parser & NLP Engine (for offline demo mode)
function generateSmartFallbackReply(message, businessName, businessContext = '') {
  const query = message.toLowerCase().trim();
  const context = businessContext || '';

  // 1. Pricing and Plans inquiries
  if (query.includes('price') || query.includes('pricing') || query.includes('cost') || query.includes('plan') || query.includes('tier') || query.includes('subscription') || query.includes('charge') || query.includes('rate')) {
    const pricingSection = extractContextSection(context, ['pricing', 'plan', 'cost', 'starter', 'pro', 'enterprise']);
    if (pricingSection) {
      return `Here are the available plans and pricing for **${businessName}**:\n\n${pricingSection}\n\n✨ *All paid plans include 24/7 automated AI resolution and priority support. Would you like to get started or request a live product walkthrough?*`;
    }
    return `We offer flexible and scalable pricing plans tailored to your organization's workload. Contact our sales department at **support@${sanitizeDomain(businessName)}.com** for a customized quote!`;
  }

  // 2. Contact and Support inquiries
  if (query.includes('contact') || query.includes('email') || query.includes('phone') || query.includes('support') || query.includes('call') || query.includes('human') || query.includes('reach') || query.includes('talk to someone') || query.includes('representative')) {
    const contactSection = extractContextSection(context, ['contact', 'email', 'phone', 'support', 'hours', 'location', 'address']);
    if (contactSection) {
      return `You can connect with the **${businessName}** team through any of the following channels:\n\n${contactSection}\n\n💬 *You can also click the **"Contact Human"** button in the header or type your email/phone right here, and our team will get in touch!*`;
    }
    return `You can reach the **${businessName}** support desk at **support@${sanitizeDomain(businessName)}.com** or leave your contact details here for our team.`;
  }

  // 3. Services, Capabilities & Features
  if (query.includes('service') || query.includes('feature') || query.includes('offer') || query.includes('what do you do') || query.includes('what can you do') || query.includes('capabilities') || query.includes('product') || query.includes('solutions') || query.includes('integration') || query.includes('api')) {
    const servicesSection = extractContextSection(context, ['service', 'capabilities', 'product', 'integration', 'solution', 'features']);
    if (servicesSection) {
      return `Here is an overview of what **${businessName}** offers:\n\n${servicesSection}\n\n🚀 *Would you like more technical details on any of these features?*`;
    }
    return `**${businessName}** specializes in cutting-edge intelligent software solutions, seamless integrations, and 24/7 automated support.`;
  }

  // 4. Trial, Demo & Booking inquiries
  if (query.includes('demo') || query.includes('trial') || query.includes('schedule') || query.includes('test') || query.includes('book') || query.includes('try')) {
    const trialSection = extractContextSection(context, ['trial', 'demo', 'discovery', 'free']);
    if (trialSection) {
      return `Here is information on trying or demoing **${businessName}**:\n\n${trialSection}\n\n📅 *Would you like us to arrange a 1-on-1 meeting for you? Just let us know your preferred date or email!*`;
    }
    return `We offer a 14-day free trial and personalized 1-on-1 demo sessions! Please submit your email via the **"Contact Human"** modal or reply here to schedule.`;
  }

  // 5. Office Hours and Location
  if (query.includes('hour') || query.includes('time') || query.includes('open') || query.includes('location') || query.includes('address') || query.includes('where')) {
    const hoursSection = extractContextSection(context, ['hours', 'location', 'address', 'monday', 'operating']);
    if (hoursSection) {
      return `Here are our hours and location details for **${businessName}**:\n\n${hoursSection}`;
    }
  }

  // 6. Greetings & Intro
  if (query === 'hi' || query === 'hello' || query === 'hey' || query.startsWith('hello ') || query.startsWith('hi ') || query.startsWith('hey ') || query === 'good morning' || query === 'good evening') {
    return `Hello! 👋 I'm your dedicated AI Assistant for **${businessName}**.\n\nI can help you with:\n• 💰 **Pricing & Subscription Plans**\n• 🚀 **Product Features & Integrations**\n• 📅 **Scheduling a Live Demo**\n• 📞 **Contacting Support & Sales**\n\nWhat would you like to know today?`;
  }

  // 7. Dynamic Paragraph Matching from Knowledge Base
  if (context) {
    const paragraphs = context.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const words = query.split(/\s+/).filter(w => w.length > 3);

    let bestParagraph = null;
    let maxMatches = 0;

    for (const p of paragraphs) {
      const pLower = p.toLowerCase();
      let matchCount = 0;
      for (const w of words) {
        if (pLower.includes(w)) matchCount++;
      }
      if (matchCount > maxMatches) {
        maxMatches = matchCount;
        bestParagraph = p;
      }
    }

    if (bestParagraph && maxMatches > 0) {
      return `Regarding **${businessName}**:\n\n${bestParagraph}\n\n*If you need further assistance, please let me know or contact our support team!*`;
    }
  }

  // 8. General AI / Conceptual inquiries
  if (query.includes('who are you') || query.includes('what are you')) {
    return `I am the official **${businessName}** AI Assistant, engineered to provide instant 24/7 customer service, technical explanations, and product guidance!`;
  }

  // Default friendly fallback
  return `Thank you for reaching out to **${businessName}**!\n\nI'm here to assist you with our services, plans, and technical inquiries. Could you please specify what information you're looking for, or would you like to speak directly with our human support team?`;
}

// Helper to extract sections from unstructured text
function extractContextSection(context, keywords) {
  if (!context) return null;
  const lines = context.split('\n');
  const matchedLines = [];
  let capturing = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();

    const isHeaderMatch = keywords.some(k => lineLower.includes(k) && (line.includes(':') || line.startsWith('#') || line.toUpperCase() === line || line.length < 40));

    if (isHeaderMatch) {
      capturing = true;
      matchedLines.push(line);
      continue;
    }

    if (capturing) {
      if (line.trim() === '' && matchedLines.length > 1 && i < lines.length - 1 && lines[i + 1].includes(':')) {
        break;
      }
      if (line.trim() !== '') {
        matchedLines.push(line);
      }
    }
  }

  if (matchedLines.length > 0) {
    return matchedLines.join('\n');
  }

  // Fallback: search for paragraphs containing keywords
  const paragraphs = context.split(/\n\s*\n/);
  for (const p of paragraphs) {
    if (keywords.some(k => p.toLowerCase().includes(k))) {
      return p;
    }
  }

  return null;
}

function sanitizeDomain(name) {
  return (name || 'business').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ==========================================
// 5. Leads Management Endpoints
// ==========================================
app.post('/api/leads', leadLimiter, (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: 'Please provide either an email address or phone number.' });
    }

    const leads = readJsonFile(LEADS_FILE, []);
    const newLead = {
      id: 'lead-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      name: (name && name.trim()) || 'Prospective Client',
      email: (email && email.trim()) || '',
      phone: (phone && phone.trim()) || '',
      message: (message && message.trim()) || 'Requested follow up from chat assistant',
      createdAt: new Date().toISOString(),
      status: 'new'
    };

    leads.unshift(newLead);
    writeJsonFile(LEADS_FILE, leads);

    res.status(201).json({
      success: true,
      message: 'Thank you! Your contact information has been recorded. Our team will reach out shortly.',
      lead: newLead
    });
  } catch (error) {
    console.error('Error saving lead:', error);
    res.status(500).json({ error: 'Failed to record contact request.' });
  }
});

app.get('/api/leads', requireAdmin, (req, res) => {
  try {
    const leads = readJsonFile(LEADS_FILE, []);
    res.json({ leads, count: leads.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve leads.' });
  }
});

app.delete('/api/leads/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    let leads = readJsonFile(LEADS_FILE, []);
    const initialLength = leads.length;
    leads = leads.filter(l => l.id !== id);

    if (leads.length === initialLength) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    writeJsonFile(LEADS_FILE, leads);
    res.json({ success: true, message: 'Lead deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete lead.' });
  }
});

// ==========================================
// 6. Serve React Client Static Build
// ==========================================
const clientBuildPath = path.join(__dirname, 'client', 'build');
const clientDistPath = path.join(__dirname, 'client', 'dist');

if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientBuildPath, 'index.html'));
    }
    next();
  });
} else if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
} else {
  app.get('/', (req, res) => {
    res.send(`<h2>🤖 AI Chatbot SaaS Backend running on Port ${PORT}</h2>`);
  });
}

// Start Server
app.listen(PORT, HOST, () => {
  console.log(`===========================================`);
  console.log(`🚀 AI Chatbot SaaS Server running on http://localhost:${PORT}`);
  console.log(`🤖 Active Provider: ${activeProvider}`);
  console.log(`🔑 Active Key: ${activeApiKey ? 'Configured' : 'Demo Fallback Mode Active'}`);
  console.log(`===========================================`);
});
