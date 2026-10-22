# 🤖 AI Chatbot SaaS Platform (Premium Edition)

A high-performance, full-stack AI Customer Support SaaS chatbot built with **React**, **Tailwind CSS**, **Node.js**, **Express**, and **OpenAI GPT-4o-mini**.

Designed with a sleek ChatGPT / Linear.app modern aesthetic, rich dark mode, real-time lead capture, custom business knowledge base injection, sound synthesis, and 1-click Render.com deployment.

---

## ✨ Key Features

### 1. 🎨 Modern Client Interface (React + Tailwind)
- **Landing Page Header:** "AI Assistant" with live online status badge and quick controls.
- **Center Chat Window:** Fixed 600px height container, rounded-2xl border, shadow-xl, and ambient blur backdrop.
- **Visual Chat Bubbles:**
  - **User:** Right-aligned black/custom primary color bubble with white text and timestamps.
  - **Bot:** Left-aligned soft neutral gray bubble with markdown formatting (bold, lists, code snippets).
- **Interactive Typing Indicator:** Animated 3-dot pulse with *"AI is typing..."*.
- **Rounded-Full Floating Input:** Smooth keyboard shortcuts (`Enter` to send, `Shift+Enter` for newline) with black Send button.
- **Quick Prompt Chips:** Interactive 1-click suggestion chips for instant answers.
- **Premium Actions:**
  - 📋 One-click **Copy Reply** button with animated check tooltip.
  - 🔊 Web Speech API **Text-to-Speech** (Listen) button.
  - 🔄 **Clear Chat** with instant reset.
  - 📥 **Export Chat Transcript** to text file.
  - 🌙 **Dark / Light Mode** theme toggle.
  - 🔔 Web Audio API synthesized soft sound effects on send/receive.

### 2. ⚡ Powerful Backend (Express + OpenAI)
- `POST /api/chat`: Multi-turn conversational support powered by `gpt-4o-mini`.
  - System prompt: `"You are a helpful customer support assistant for {businessName}. Business info: {businessContext}. Answer short, friendly, helpful. If you don't know, say contact support."`
  - Fallback engine: Smart offline context simulation if no API key is set yet.
  - Auto Lead Detection: Automatically extracts emails and phone numbers mentioned in chat and logs them to `leads.json`.
- `POST /api/leads` & `GET /api/leads`: Lead capture API that stores inquiries into `leads.json`.
- `GET /api/settings` & `POST /api/settings`: Persists custom business name, welcome message, primary color, quick prompts, and FAQ knowledge base into `settings.json`.
- `GET /api/health`: Health status & API connection checker.
- **Single-port Deployment:** Serves compiled React frontend from `/client/build` directly.

### 3. 🏢 Business Owner Hub & Admin Panel
- **Branding & Appearance:** Customize bot name, welcome greeting, and primary accent color.
- **Custom Business Knowledge Base:** Paste pricing, FAQs, support hours, and product info (with 1-click industry templates for SaaS, E-Commerce, Agency, Real Estate, and Dental Clinic).
- **Customer Leads Hub:** View all captured leads, delete processed inquiries, or **Export to CSV**.

---

## 📁 Project Structure

```
AI_Chatbot/
├── client/                     # React + Tailwind Frontend
│   ├── build/                  # Production build output
│   ├── src/
│   │   ├── components/         # ChatWindow, ChatMessage, Navbar, SettingsModal, LeadCaptureModal
│   │   ├── utils/              # Sound synthesis and Markdown parser
│   │   ├── App.jsx             # Main Application
│   │   ├── index.css           # Tailwind + Custom Design System
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
├── leads.json                  # Persistent customer inquiries data
├── settings.json               # Persistent business configuration
├── server.js                   # Single Express backend server & static host
├── package.json                # Root scripts (build, start, dev)
├── .env.example                # Environment variables template
├── .env                        # Local environment variables
├── .gitignore
└── README.md                   # Complete Documentation
```

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### 2. Installation
Clone or navigate to the project directory and install dependencies:

```bash
# In project root
npm install

# Build the client
npm run build
```

### 3. Configure Your OpenAI API Key
Create or edit your `.env` file in the root directory:

```env
PORT=5000
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

> **How to get your API Key:**
> 1. Sign up or log in at [platform.openai.com](https://platform.openai.com/).
> 2. Navigate to **API Keys** &rarr; click **Create new secret key**.
> 3. Copy the key (starts with `sk-...`) and paste it into `.env`.

### 4. Start the Application
```bash
npm start
```
Open your browser and visit: **`http://localhost:5000`**

---

## ☁️ How to Deploy on Render.com

Render is the recommended zero-config hosting platform for this full-stack app.

### Step 1: Push Code to GitHub
Push this repository to your GitHub account:
```bash
git init
git add .
git commit -m "Initial commit - Full-stack AI Chatbot SaaS"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-chatbot-saas.git
git push -u origin main
```

### Step 2: Create a Web Service on Render
1. Go to [dashboard.render.com](https://dashboard.render.com/) and click **New +** &rarr; **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name:** `ai-chatbot-saas`
   - **Environment:** `Node`
   - **Region:** Closest to your users (e.g., `Oregon (US West)` or `Frankfurt`)
   - **Branch:** `main`
   - **Build Command:**
     ```bash
     npm run build
     ```
   - **Start Command:**
     ```bash
     npm start
     ```
   - **Plan Type:** `Free`

### Step 3: Add Environment Variables
Scroll down to **Environment Variables** and add:
- One provider key: `GEMINI_API_KEY`, `GROQ_API_KEY`, or `OPENAI_API_KEY`
- `ADMIN_API_TOKEN` : a unique random string of at least 32 characters
- `NODE_ENV` : `production`

Generate the owner token locally with Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Add the output as `ADMIN_API_TOKEN` in Render. Do not put it in the client, commit it, or share it with the client. The owner enters it in **Settings → API & Deploy Guide** to access leads and change settings. Provider keys are also server-only and must be set in Render, not in the browser. Render supplies `PORT` automatically.

### Step 4: Deploy
Click **Deploy Web Service**. Render will run `npm run build` and launch `server.js`. The public chat is available at `https://your-service-name.onrender.com`; settings writes, lead access, and API-key management require the owner token.

Render's local filesystem may be reset during deploys or restarts. Use a persistent disk or a database before relying on `leads.json` or `settings.json` for production data.

---

## 📡 API Reference

### 1. `POST /api/chat`
Sends user message and context to GPT-4o-mini.

**Request Body:**
```json
{
  "message": "What are your pricing plans?",
  "conversationHistory": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello! How can I help?" }
  ],
  "businessName": "Apex Technologies",
  "businessContext": "Pricing: Starter $49/mo, Pro $149/mo..."
}
```

**Response:**
```json
{
  "reply": "We offer two main pricing plans...",
  "model": "gpt-4o-mini",
  "timestamp": "2026-10-05T15:30:00.000Z"
}
```

### 2. `POST /api/leads`
Saves customer contact info.

**Request Body:**
```json
{
  "name": "Sarah Jenkins",
  "email": "sarah@example.com",
  "phone": "+1 555-0199",
  "message": "Interested in enterprise rollout."
}
```

### 3. `GET /api/leads`
Retrieves all captured customer leads.

### 4. `GET /api/settings` & `POST /api/settings`
Retrieves or updates bot configuration and knowledge base.

---

## 🔒 Security & Best Practices
- Provider API keys are server-side environment variables and are never returned to the client.
- Production requires a private `ADMIN_API_TOKEN` for settings changes and lead management; public chat remains accessible to visitors.
- Chat and contact submissions have per-IP rate limits. Configure provider usage limits as an additional safeguard.
- Do not deploy `.ai-chatbot.private.env` or share its provider key with the client.
- Strict system prompt guardrails instruct the bot to answer only within business context.
- Error fallback handling keeps chat responses available during provider failures.

---

## 📄 License
MIT License. Free for commercial and personal use.
