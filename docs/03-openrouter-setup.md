# 3 -- OpenRouter Setup

This guide walks you through obtaining an OpenRouter API key and configuring Daemon to use it for cloud-based inference.

---

## What is OpenRouter?

[OpenRouter](https://openrouter.ai/) is a unified API that provides access to dozens of different large language models (LLMs) from providers like Google, Anthropic, OpenAI, Meta, and others, all through a single interface. Daemon uses OpenRouter to dynamically route your requests to the best available cloud model based on the complexity of your task.

---

## Get an OpenRouter API Key

1. Go to [openrouter.ai](https://openrouter.ai/) and sign up or log in.
2. Navigate to the **[Keys](https://openrouter.ai/keys)** page.
3. Click **Create Key**. Give it a memorable name, like "Daemon Desktop".
4. Copy the generated API key (`sk-or-v1-...`). Keep this secret! You won't be able to see it again once you close the window.

---

## Configure Daemon

Depending on how you are running Daemon, there are a few ways to provide your API key. 

### In the Daemon Desktop App (Recommended)

When you first launch the Daemon Desktop application, it will prompt you to enter your OpenRouter API key.

1. Open **Daemon Desktop**.
2. Paste your OpenRouter API Key into the settings input when prompted.
3. You're ready to start chatting! The app will securely store your key locally and use it for all future requests.

You can update or change your API key at any time by navigating to **Settings (⚙️) -> Configuration** inside the app.

### Using the Python CLI Script

If you're using Daemon via a custom script, you'll need to provide the key as an environment variable or edit the script configuration.

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
python3 daemon.py
```

---

## Model Routing

Daemon is designed to handle different types of tasks by offloading simple questions to faster, cheaper models, while reserving heavy lifting for more capable (but slower) reasoners.

By default, Daemon uses:

- **Simple Tasks**: `google/gemini-2.5-flash` - blazingly fast and excellent for general questions, drafting text, and summarization.
- **Complex Tasks**: `anthropic/claude-3.5-sonnet` - incredibly capable for complex reasoning, coding, and deep analysis.

You can explicitly choose the complexity level when chatting using the interface toggles in the desktop app.

---

Next: [Security](04-security.md)
