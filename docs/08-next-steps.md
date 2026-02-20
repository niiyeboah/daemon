# 8 -- Next Steps

Daemon is up and running. Here are ideas to extend and improve your personal assistant.

---

## OpenClaw & automation

Turn Daemon into a **personal employee** that works on your behalf: add [OpenClaw](09-openclaw-automation.md) to give it messaging channels (Telegram, Discord, Slack), automation skills from ClawHub, and scheduled jobs. Daemon stays the brain (your local LLM); OpenClaw is the layer that lets it act — reply on your channels, run workflows, and execute tasks 24/7. See [OpenClaw & automation](09-openclaw-automation.md) for setup and how to start automating.

---

## Voice Input with Whisper

Add speech-to-text so you can talk to Daemon instead of typing.

- **[Whisper.cpp](https://github.com/ggerganov/whisper.cpp)** -- A lightweight C++ port of OpenAI's Whisper model that runs on CPU. The `tiny` or `base` models are fast enough for the N100/N150.
- **Workflow:** Microphone -> Whisper (speech-to-text) -> Daemon (LLM) -> Text response (optionally piped to a TTS engine).

---

## Text-to-Speech (TTS)

Make Daemon speak its answers out loud.

- **[Piper](https://github.com/rhasspy/piper)** -- A fast, local TTS engine with many voice models. Runs well on CPU.
- **espeak-ng** -- Lightweight and available via `apt install espeak-ng`. Lower quality but zero setup.

---

## Web UI

Expose Daemon through a browser so you can chat from your phone or laptop.

- **[Open WebUI](https://github.com/open-webui/open-webui)** -- A self-hosted ChatGPT-style interface that connects directly to Ollama. Install with Docker:

```bash
sudo apt install -y docker.io
sudo docker run -d --network=host -e OLLAMA_BASE_URL=http://localhost:11434 \
  -v open-webui:/app/backend/data --name open-webui \
  --restart always ghcr.io/open-webui/open-webui:main
```

  Then open `http://192.168.1.100:8080` from any device on your LAN.

- **Custom Flask/FastAPI app** -- Build a minimal chat page tailored to your needs. The Python script from [Option B](05-daemon-bot.md#option-b----python-api-script) is a good starting point; add a `/chat` HTTP endpoint and a simple HTML frontend.

---

## Scheduled Tasks and Automations

Turn Daemon into a proactive assistant that does things on a schedule.

- **Cron jobs** that call the Ollama API to summarise daily news, generate a morning briefing, or process files.
- **Home Assistant integration** -- If you run Home Assistant, you can call Ollama's API from automations to generate natural-language notifications or control summaries.

---

## Multiple Models

Ollama can host several models simultaneously. Consider:

| Model | Use Case |
|-------|----------|
| `llama3.2:8b` | General assistant (Daemon default) |
| `codellama:7b` | Code generation and review (if you have RAM) |
| `mistral:7b` | Alternative general-purpose model (needs 8+ GB free RAM) |

Switch models in the Modelfile or Python script by changing the model name.

---

## RAG (Retrieval-Augmented Generation)

Give Daemon access to your own documents (notes, PDFs, bookmarks) so it can answer questions grounded in your data.

- **[LangChain](https://python.langchain.com/)** or **[LlamaIndex](https://www.llamaindex.ai/)** can index local files and inject relevant chunks into the prompt before sending it to Ollama.
- Store embeddings in a lightweight vector database like **[ChromaDB](https://www.trychroma.com/)** (runs locally, no external services).

---

## GPU Acceleration (Future Upgrade)

If you later add an eGPU enclosure or move to a machine with a discrete NVIDIA GPU:

1. Install NVIDIA drivers and the CUDA toolkit.
2. Reinstall Ollama (it auto-detects CUDA).
3. Inference speed will jump dramatically -- 50--100+ tokens/second on a mid-range GPU with the 8B model.

---

## Useful Links

| Resource | URL |
|----------|-----|
| Ollama documentation | <https://ollama.com/> |
| Ollama GitHub | <https://github.com/ollama/ollama> |
| Llama 3.2 model card | <https://ollama.com/library/llama3.2> |
| Ubuntu Server docs | <https://ubuntu.com/server/docs> |
| Beelink official site | <https://www.bee-link.com/> |
| Open WebUI | <https://github.com/open-webui/open-webui> |
| Whisper.cpp | <https://github.com/ggerganov/whisper.cpp> |
| Piper TTS | <https://github.com/rhasspy/piper> |

---

You now have a complete, self-hosted personal assistant. Daemon runs on your hardware, respects your privacy, and can be extended in any direction you choose. Enjoy building.
