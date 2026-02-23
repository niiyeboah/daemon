import { CodeBlock } from '@/components/shared/CodeBlock'

export function OpenRouterSection() {
  return (
    <section id="openrouter">
      <h2 className="text-3xl font-bold tracking-tight">4. OpenRouter Setup</h2>
      <p className="mt-2 text-muted-foreground">
        This guide walks you through obtaining an OpenRouter API key and configuring
        Daemon to use it for cloud-based inference.
      </p>

      <h3 className="mt-6 text-xl font-semibold">What is OpenRouter?</h3>
      <p className="mt-2 text-muted-foreground">
        <a href="https://openrouter.ai/" className="underline" target="_blank" rel="noopener noreferrer">OpenRouter</a> is a unified API that provides
        access to dozens of different large language models (LLMs) from providers like Google,
        Anthropic, OpenAI, Meta, and others, all through a single interface. Daemon uses
        OpenRouter to dynamically route your requests to the best available cloud model
        based on the complexity of your task.
      </p>

      <h3 className="mt-8 text-xl font-semibold">Get an OpenRouter API Key</h3>
      <ul className="mt-2 list-decimal space-y-1 pl-6 text-muted-foreground">
        <li>
          Go to <a href="https://openrouter.ai/" className="underline" target="_blank" rel="noopener noreferrer">openrouter.ai</a> and sign up or log in.
        </li>
        <li>
          Navigate to the <a href="https://openrouter.ai/keys" className="underline" target="_blank" rel="noopener noreferrer">Keys</a> page.
        </li>
        <li>
          Click <strong>Create Key</strong>. Give it a memorable name, like "Daemon Desktop".
        </li>
        <li>
          Copy the generated API key (<code className="rounded bg-muted px-1.5 py-0.5">sk-or-v1-...</code>). Keep this
          secret! You won't be able to see it again once you close the window.
        </li>
      </ul>

      <h3 className="mt-8 text-xl font-semibold">Configure Daemon</h3>
      <p className="mt-2 text-muted-foreground">
        Depending on how you are running Daemon, there are a few ways to provide
        your API key.
      </p>

      <h4 className="mt-4 text-lg font-medium">In the Daemon Desktop App (Recommended)</h4>
      <p className="mt-2 text-muted-foreground">
        When you first launch the Daemon Desktop application, it will prompt you to
        enter your OpenRouter API key.
      </p>
      <ul className="mt-2 list-decimal space-y-1 pl-6 text-muted-foreground">
        <li>Open <strong>Daemon Desktop</strong>.</li>
        <li>Paste your OpenRouter API Key into the settings input when prompted.</li>
        <li>
          You're ready to start chatting! The app will securely store your key locally
          and use it for all future requests.
        </li>
      </ul>
      <p className="mt-2 text-sm text-muted-foreground">
        You can update or change your API key at any time by navigating to
        <strong> Settings (⚙️) -&gt; Configuration</strong> inside the app.
      </p>

      <h4 className="mt-6 text-lg font-medium">Using the Python CLI Script</h4>
      <p className="mt-2 text-muted-foreground">
        If you're using Daemon via a custom script, you'll need to provide the key as
        an environment variable or edit the script configuration.
      </p>
      <CodeBlock
        language="bash"
        code={`export OPENROUTER_API_KEY="sk-or-v1-..."\npython3 daemon.py`}
      />

      <h3 className="mt-8 text-xl font-semibold">Model Routing</h3>
      <p className="mt-2 text-muted-foreground">
        Daemon is designed to handle different types of tasks by offloading simple questions
        to faster, cheaper models, while reserving heavy lifting for more capable (but slower) reasoners.
      </p>
      <p className="mt-4 text-muted-foreground">By default, Daemon uses:</p>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
        <li>
          <strong>Simple Tasks</strong>: <code className="rounded bg-muted px-1.5 py-0.5">google/gemini-2.5-flash</code> -
          blazingly fast and excellent for general questions, drafting text, and summarization.
        </li>
        <li>
          <strong>Complex Tasks</strong>: <code className="rounded bg-muted px-1.5 py-0.5">anthropic/claude-3.5-sonnet</code> -
          incredibly capable for complex reasoning, coding, and deep analysis.
        </li>
      </ul>
      <p className="mt-4 text-muted-foreground">
        You can explicitly choose the complexity level when chatting using the interface toggles
        in the desktop app.
      </p>
    </section>
  )
}
