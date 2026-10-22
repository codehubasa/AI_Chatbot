# 🤖 Gemini AI Chatbot

A simple, conversational AI chatbot built with Python and the **Google Gemini API**. It remembers the context of your conversation and responds in real time.

![Python](https://img.shields.io/badge/Python-3.9%2B-blue)
![Gemini API](https://img.shields.io/badge/Powered%20by-Gemini%20API-orange)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📖 Table of Contents

- [Features](#-features)
- [Demo](#-demo)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

- 💬 Natural, multi-turn conversations with memory of earlier messages
- ⚡ Fast responses powered by Google Gemini
- 🔐 API key kept safe in a `.env` file (never committed to Git)
- 🛠️ Easy to customize: change the model, system prompt, or interface
- 🧩 Clean, beginner-friendly code

---

## 🎬 Demo

> Add a screenshot or GIF of your chatbot here.

```
You: What is machine learning?
Bot: Machine learning is a branch of AI where computers learn patterns from data...

You: Give me a simple example.
Bot: Sure! Think of an email spam filter...
```

---

## 🧰 Tech Stack

| Component | Technology |
|-----------|------------|
| Language  | Python 3.9+ |
| AI Model  | Google Gemini (via `google-genai` SDK) |
| Config    | `python-dotenv` |
| Interface | Command line (easily extendable to Streamlit / Flask) |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9 or higher
- A Gemini API key (free to create at [Google AI Studio](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```

2. **Create a virtual environment (recommended)**

   ```bash
   python -m venv venv

   # macOS / Linux
   source venv/bin/activate

   # Windows
   venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Add your API key**

   Create a `.env` file in the project root:

   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

   > ⚠️ **Never share or commit your API key.** Make sure `.env` is listed in `.gitignore`.

---

## ▶️ Usage

Run the chatbot:

```bash
python chatbot.py
```

Type your message and press **Enter**. Type `exit` or `quit` to end the chat.

### Example code (`chatbot.py`)

```python
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

chat = client.chats.create(model=MODEL)

print("Gemini Chatbot (type 'exit' to quit)\n")

while True:
    user_input = input("You: ").strip()
    if user_input.lower() in {"exit", "quit"}:
        print("Goodbye! 👋")
        break
    if not user_input:
        continue

    response = chat.send_message(user_input)
    print(f"Bot: {response.text}\n")
```

---

## 📁 Project Structure

```
.
├── chatbot.py          # Main chatbot script
├── requirements.txt    # Python dependencies
├── .env                # Your API key (not committed)
├── .gitignore          # Files Git should ignore
└── README.md           # You are here
```

**`requirements.txt`**

```
google-genai
python-dotenv
```

**`.gitignore`**

```
.env
venv/
__pycache__/
```

---

## ⚙️ Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Google Gemini API key (required) | — |
| `GEMINI_MODEL` | Gemini model to use (optional) | `gemini-2.5-flash` |

Available models change over time, so check the [official Gemini docs](https://ai.google.dev/gemini-api/docs/models) for the latest model names.

### Customizing the bot's personality

Give the chatbot a role with a system instruction:

```python
from google.genai import types

chat = client.chats.create(
    model=MODEL,
    config=types.GenerateContentConfig(
        system_instruction="You are a friendly assistant that explains things simply."
    ),
)
```

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| `API key not valid` | Re-check the key in your `.env` file and make sure there are no extra spaces or quotes. |
| `ModuleNotFoundError` | Activate your virtual environment and run `pip install -r requirements.txt`. |
| `429 Resource exhausted` | You hit the rate limit. Wait a moment and try again, or check your quota in Google AI Studio. |
| `404 model not found` | The model name may be outdated. Update `GEMINI_MODEL` to a currently available model. |

---

## 🔮 Future Improvements

- [ ] Web interface with Streamlit or Flask
- [ ] Save and load chat history
- [ ] Streaming responses
- [ ] Image and file input support
- [ ] Deploy online

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙌 Acknowledgements

- [Google Gemini API](https://ai.google.dev/)
- [python-dotenv](https://pypi.org/project/python-dotenv/)

---

⭐ If you found this project helpful, please give it a star!
