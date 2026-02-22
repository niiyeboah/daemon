import { Card, CardContent } from '@/components/ui/card'
import { CodeBlock } from '@/components/shared/CodeBlock'

const ideas = [
  {
    title: 'OpenClaw & automation',
    description:
      'Make Daemon your personal employee: add OpenClaw for channels, skills, and scheduled jobs so it can work for you 24/7.',
    link: null,
    sectionAnchor: '#openclaw',
  },
  {
    title: 'Voice Input with Whisper',
    description:
      'Add speech-to-text so you can talk to Daemon. Whisper.cpp is a lightweight C++ port that runs on CPU.',
    link: 'https://github.com/ggerganov/whisper.cpp',
  },
  {
    title: 'Text-to-Speech (TTS)',
    description:
      'Make Daemon speak its answers. Piper is a fast local TTS engine with many voice models.',
    link: 'https://github.com/rhasspy/piper',
  },
  {
    title: 'Web UI',
    description:
      'Expose Daemon through a browser. Open WebUI is a self-hosted ChatGPT-style interface for Ollama.',
    link: 'https://github.com/open-webui/open-webui',
  },
  {
    title: 'Scheduled Tasks',
    description:
      'Use cron jobs or Home Assistant to call the Ollama API on a schedule for summaries, briefings, or automations.',
  },
  {
    title: 'Multiple Models',
    description:
      'Ollama can host several models. Browse the Ollama library to find alternatives for your hardware and use case.',
  },
  {
    title: 'RAG (Retrieval-Augmented Generation)',
    description:
      'Give Daemon access to your documents. Use LangChain or LlamaIndex with ChromaDB for local embeddings.',
  },
  {
    title: 'GPU Acceleration',
    description:
      'Add an eGPU or upgrade to a machine with NVIDIA GPU. Ollama auto-detects CUDA for dramatically faster inference.',
  },
]

const links = [
  { name: 'Ollama', url: 'https://ollama.com/' },
  { name: 'Ollama GitHub', url: 'https://github.com/ollama/ollama' },
  { name: 'Qwen2.5-Coder Model', url: 'https://ollama.com/library/qwen2.5-coder' },
  { name: 'Open WebUI', url: 'https://github.com/open-webui/open-webui' },
  { name: 'Whisper.cpp', url: 'https://github.com/ggerganov/whisper.cpp' },
  { name: 'Piper TTS', url: 'https://github.com/rhasspy/piper' },
]

export function NextStepsSection() {
  return (
    <section id="next-steps">
      <h2 className="text-3xl font-bold tracking-tight">8. Next Steps</h2>
      <p className="mt-2 text-muted-foreground">
        Daemon is up and running. Here are ideas to extend your personal
        assistant.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {ideas.map(({ title, description, link, sectionAnchor }) => (
          <Card key={title}>
            <CardContent className="p-4">
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              {sectionAnchor && (
                <a href={sectionAnchor} className="mt-2 inline-block text-sm underline">
                  Go to section
                </a>
              )}
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm underline"
                >
                  Learn more
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <h3 className="mt-8 text-xl font-semibold">Web UI Quick Start</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Install Open WebUI with Docker to chat from any device on your LAN:
      </p>
      <CodeBlock
        language="bash"
        code={`sudo apt install -y docker.io
sudo docker run -d --network=host \\
  -e OLLAMA_BASE_URL=http://localhost:11434 \\
  -v open-webui:/app/backend/data \\
  --name open-webui --restart always \\
  ghcr.io/open-webui/open-webui:main`}
      />
      <p className="text-sm text-muted-foreground">
        Then open <code className="rounded bg-muted px-1.5 py-0.5">http://your-ip:8080</code> from
        any device on your network.
      </p>

      <h3 className="mt-8 text-xl font-semibold">Useful Links</h3>
      <ul className="mt-3 space-y-1">
        {links.map(({ name, url }) => (
          <li key={name}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline"
            >
              {name}
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-12 rounded-lg border border-border bg-muted/30 p-6 text-center">
        <p className="text-lg font-medium">
          You now have a complete, self-hosted personal assistant.
        </p>
        <p className="mt-1 text-muted-foreground">
          Daemon runs on your hardware, respects your privacy, and can be
          extended in any direction you choose.
        </p>
      </div>
    </section>
  )
}
