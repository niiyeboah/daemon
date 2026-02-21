# Daemon Desktop App -- Specification

## 1. Overview

A cross-platform desktop application that replaces the manual setup process with a guided, point-and-click experience. The app automates Daemon setup, provides live diagnostics, connects WhatsApp via OpenClaw, and includes a built-in chat view for interacting with the local LLM.

### Goals

- **Zero-terminal setup** -- users should not need to open a terminal to get Daemon running.
- **Live diagnostics** -- real-time health checks for Ollama, the Daemon model, and OpenClaw.
- **WhatsApp integration** -- guided flow for connecting WhatsApp as an OpenClaw channel.
- **Built-in chat** -- send and receive messages through the local Ollama API directly in the app.
- **Cross-platform** -- Windows 10/11, Ubuntu Desktop 24.04+, macOS 13+.

### Non-goals

- Mobile apps (Tauri v2 supports mobile, but it is out of scope for v1).
- Replacing the existing web guide (the guide remains for users who prefer reading docs).
- Cloud features or accounts.

---

## 2. Framework: Tauri v2

### Why Tauri over Electron

| Factor | Tauri | Electron |
|--------|-------|----------|
| **Bundle size** | ~3-6 MB (uses OS WebView) | ~80-120 MB (bundles Chromium) |
| **Memory at idle** | ~30-50 MB | ~150-300 MB |
| **RAM matters** | The app runs alongside Ollama + the LLM on constrained hardware (16 GB N100). Every MB the shell saves is a MB available for inference. | |
| **Security** | Principle of least privilege. Shell commands must be explicitly whitelisted in capability files. An XSS in the chat UI cannot escalate to arbitrary code execution. | Full Node.js access from main process; must be manually restricted. |
| **Go sidecar support** | First-class `externalBin` system with automatic target-triple naming. Built for bundling CLI tools like `daemon-setup`. | `extraResources` works but requires manual path resolution and ASAR exclusion. |
| **Frontend reuse** | The existing React 19 + Vite 7 + Tailwind 4 + Radix UI frontend works as-is. | Same -- but the weight penalty is not justified. |
| **Startup time** | < 500 ms (native binary, no runtime bootstrap) | 1-2 seconds (Chromium + Node.js init) |

**Decision: Tauri v2.** The resource constraints of the target hardware, the first-class sidecar support for Go binaries, and the security model make it the clear choice.

### Technology stack

| Layer | Technology |
|-------|-----------|
| App shell | Tauri v2 (Rust backend, OS-native WebView) |
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 4, Radix UI |
| State management | Jotai (already used in the web app) |
| Icons | Lucide React (already used) |
| Bundled sidecars | `daemon-setup` (Go CLI), `ollama` (optional, or detect system install) |
| IPC | Tauri commands (Rust) + `@tauri-apps/plugin-shell` for sidecar invocation |
| Persistence | `@tauri-apps/plugin-store` (encrypted local key-value store) |

---

## 3. Architecture

```
┌──────────────────────────────────────────────────┐
│                 Tauri Window                      │
│  ┌────────────────────────────────────────────┐  │
│  │           React Frontend (WebView)          │  │
│  │                                             │  │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────────┐ │  │
│  │  │  Setup   │ │  Diag-  │ │   WhatsApp   │ │  │
│  │  │  Wizard  │ │ nostics │ │   Connect    │ │  │
│  │  └─────────┘ └─────────┘ └──────────────┘ │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │           Chat View                   │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └──────────┬─────────────────────────────────┘  │
│             │ Tauri IPC (invoke / events)         │
│  ┌──────────▼─────────────────────────────────┐  │
│  │           Rust Backend                      │  │
│  │                                             │  │
│  │  ┌───────────┐ ┌────────────┐ ┌─────────┐ │  │
│  │  │  Ollama   │ │  Sidecar   │ │  Config  │ │  │
│  │  │  Client   │ │  Manager   │ │  Store   │ │  │
│  │  └───────────┘ └────────────┘ └─────────┘ │  │
│  └──────────┬─────────────────────────────────┘  │
│             │ shell / HTTP / filesystem           │
│  ┌──────────▼─────────────────────────────────┐  │
│  │           System Layer                      │  │
│  │                                             │  │
│  │  ┌────────┐ ┌──────────────┐ ┌──────────┐ │  │
│  │  │ Ollama │ │ daemon-setup │ │ OpenClaw │ │  │
│  │  │ (API)  │ │  (sidecar)   │ │  (CLI)   │ │  │
│  │  └────────┘ └──────────────┘ └──────────┘ │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

### Rust backend responsibilities

The Rust layer is thin. It handles:

1. **Tauri commands** -- typed IPC functions callable from the frontend.
2. **Process management** -- spawn, monitor, and kill sidecars via `@tauri-apps/plugin-shell`.
3. **HTTP client** -- call the Ollama REST API (`/api/tags`, `/api/chat`, `/api/ps`).
4. **Filesystem** -- read/write config files (`~/.openclaw/openclaw.json`, `~/Modelfile`).
5. **Event streaming** -- push diagnostic updates and chat tokens to the frontend via Tauri events.

### Sidecar binaries

| Binary | Purpose | Bundled? |
|--------|---------|----------|
| `daemon-setup` | Automated bot setup (check, init, alias) | Yes -- compiled per target triple and embedded via `externalBin` |
| `ollama` | LLM runtime | No -- detected on the system. Setup wizard installs it if missing. |
| `openclaw` | Automation gateway | No -- detected or installed by the WhatsApp connect flow. |

### Tauri capability configuration

```json
{
  "identifier": "daemon-desktop",
  "permissions": [
    "shell:allow-spawn",
    "shell:allow-execute",
    "fs:allow-read",
    "fs:allow-write",
    "http:allow-fetch",
    "store:allow-get",
    "store:allow-set",
    "notification:default",
    "dialog:default"
  ],
  "scope": {
    "shell": {
      "execute": ["daemon-setup", "ollama", "openclaw"]
    },
    "fs": {
      "scope": ["$HOME/Modelfile", "$HOME/.openclaw/**", "$CONFIG/**"]
    },
    "http": {
      "scope": ["http://localhost:11434/**", "http://127.0.0.1:11434/**", "http://127.0.0.1:18789/**"]
    }
  }
}
```

---

## 4. Features

### 4.1 Setup Wizard

A step-by-step guided flow that replaces the manual docs. Each step shows progress, logs, and a retry button on failure.

#### Steps

| # | Step | What it does | How |
|---|------|-------------|-----|
| 1 | **Detect OS** | Auto-detect Windows/Ubuntu/macOS. Display platform badge. | `std::env::consts::OS` in Rust |
| 2 | **Check Ollama** | Verify Ollama is installed and the API is reachable. | Run `daemon-setup check --skip-api` then `GET http://localhost:11434/api/tags` |
| 3 | **Install Ollama** (if missing) | Guide user to install Ollama. Show platform-specific instructions and a "Check again" button. On Ubuntu, offer to run the installer script with user confirmation. | Open `https://ollama.com` in browser or run `curl -fsSL https://ollama.com/install.sh \| sh` via shell plugin |
| 4 | **Pull model** | Download `llama3.2:8b`. Show progress bar with download percentage. | Run `ollama pull llama3.2:8b`, parse progress lines from stdout |
| 5 | **Create Daemon model** | Write Modelfile and run `ollama create daemon`. | Run `daemon-setup init --yes` sidecar |
| 6 | **Test inference** | Send a test prompt and display the response. | `POST http://localhost:11434/api/chat` with `{"model":"daemon","messages":[{"role":"user","content":"Hello, who are you?"}],"stream":false}` |
| 7 | **Add shell alias** (optional) | Offer to add the `daemon` alias. | Run `daemon-setup alias` sidecar |
| 8 | **Done** | Show success screen with links to Chat view and Diagnostics. | Frontend navigation |

#### UI

- Vertical stepper component (similar to a checkout flow).
- Each step has three states: `pending`, `running` (with spinner/progress), `done` (green check), `error` (red X with retry).
- A log drawer at the bottom shows raw command output for debugging.
- Users can skip optional steps (alias, test inference) but cannot skip required ones.

### 4.2 Diagnostics Dashboard

A real-time health overview of the entire Daemon stack. Auto-refreshes every 10 seconds with manual refresh button.

#### Checks

| Check | Method | Healthy | Unhealthy |
|-------|--------|---------|-----------|
| **Ollama installed** | `which ollama` or `where ollama` | Binary found in PATH | Not found -- show install link |
| **Ollama API running** | `GET http://localhost:11434/` | 200 OK | Connection refused -- show "start Ollama" instructions |
| **Base model available** | `GET http://localhost:11434/api/tags`, check for `llama3.2:8b` | Present | Missing -- offer "Pull model" button |
| **Daemon model available** | Same endpoint, check for `daemon` | Present | Missing -- offer "Create model" button |
| **Model loaded in memory** | `GET http://localhost:11434/api/ps` | `daemon` or `llama3.2:8b` listed | Not loaded (normal if idle > 5 min) |
| **Inference working** | Timed test prompt to `/api/chat` | Response received, latency shown | Timeout or error -- show troubleshooting tips |
| **Inference speed** | Parse `eval_count` and `eval_duration` from chat response | Show tokens/sec (e.g., "18 tok/s") | Below threshold -- suggest reducing context |
| **System RAM** | `sysinfo` crate in Rust | Show total/available/used | Warning if < 2 GB available |
| **Disk space** | `sysinfo` crate | Show free space on model directory | Warning if < 5 GB free |
| **OpenClaw installed** | `which openclaw` | Binary found | Not found -- show install link |
| **OpenClaw gateway** | `GET http://127.0.0.1:18789/` or `openclaw gateway status` | Running | Not running -- offer start button |

#### UI

- Card grid layout. Each card shows:
  - Service name and icon
  - Status badge (green/yellow/red)
  - Key metric (e.g., "18 tok/s", "12.4 GB free")
  - Action button when unhealthy (e.g., "Pull model", "Start Ollama")
- Top banner shows overall status: "All systems operational" or "2 issues found".
- Auto-refresh indicator with countdown timer.
- Expandable details section for each card with raw command output.

### 4.3 WhatsApp Connector

A guided flow for connecting WhatsApp as an OpenClaw channel.

#### Prerequisites

- OpenClaw installed and gateway running (diagnostics checks this first).
- If OpenClaw is not installed, the flow starts with OpenClaw installation.

#### Flow

| # | Step | What it does |
|---|------|-------------|
| 1 | **Check OpenClaw** | Verify OpenClaw is installed and the gateway is running. If not, guide installation. |
| 2 | **Install OpenClaw** (if missing) | Run the install script: `curl -fsSL https://openclaw.ai/install.sh \| bash`. Show progress. |
| 3 | **Run onboarding** (if first time) | Run `openclaw onboard --install-daemon`. Stream output to a terminal view in the app. |
| 4 | **Connect WhatsApp channel** | Run `openclaw plugins enable whatsapp` (WhatsApp is a disabled-by-default plugin), then `openclaw channels login --channel whatsapp`. Display the QR code (from stdout or the gateway UI) within the app for the user to scan with their phone. |
| 5 | **Configure Daemon model** | Set `ollama/daemon` (or `ollama/llama3.2:8b`) as the default model in `~/.openclaw/openclaw.json`. Write the explicit provider config with `contextWindow: 16384` and `maxTokens: 8192`. |
| 6 | **Restart gateway** | Run `openclaw gateway restart`. |
| 7 | **Test** | Send a test message via the OpenClaw dashboard or CLI. Verify response comes back. |
| 8 | **Done** | Show success screen. Explain that Daemon will now respond to WhatsApp messages. |

#### UI

- Same vertical stepper pattern as Setup Wizard.
- Step 4 (QR code) gets a large, centered QR display with a countdown timer and refresh button.
- If the QR code is delivered as a terminal-rendered QR (ASCII art), parse and render it as an actual image using a QR rendering library.
- Include a link to the OpenClaw channels docs for manual configuration.

### 4.4 Chat View

A built-in chat interface for talking to the local Daemon model.

#### Features

| Feature | Details |
|---------|---------|
| **Message input** | Text area with send button. Enter to send, Shift+Enter for newline. |
| **Streaming responses** | Use Ollama's streaming API (`"stream": true`). Display tokens as they arrive for a responsive feel. |
| **Conversation history** | Messages persist in the current session. Option to clear chat. History is stored locally via `@tauri-apps/plugin-store`, not sent anywhere. |
| **Model selector** | Dropdown to switch between available models (e.g., `daemon`, `llama3.2:8b`). Populated from `GET /api/tags`. |
| **Inference stats** | After each response, show: tokens generated, time taken, tokens/sec. Parsed from the Ollama API response metadata. |
| **Connection status** | Indicator showing whether Ollama is reachable. If not, show a reconnect banner. |
| **System prompt display** | Collapsible section showing the current system prompt. |
| **Copy message** | Click to copy any message to clipboard. |
| **Code blocks** | Syntax-highlighted code blocks in responses (reuse existing `CodeBlock` component). |
| **Markdown rendering** | Render assistant responses as markdown (bold, lists, headings, code). |

#### API integration

```
POST http://localhost:11434/api/chat
{
  "model": "daemon",
  "messages": [
    {"role": "system", "content": "<system prompt>"},
    {"role": "user", "content": "Hello!"},
    ...
  ],
  "stream": true
}
```

Streaming: read the response body as a stream of newline-delimited JSON objects. Each chunk contains a `message.content` fragment. Append fragments to the UI in real-time.

#### UI

- Full-height view with message list and input bar.
- Messages styled as chat bubbles (user on right, assistant on left).
- Loading indicator (animated dots) while waiting for first token.
- Responsive -- works in the main window or a detachable panel.

---

## 5. Navigation & Layout

### App shell

```
┌──────────────────────────────────────────┐
│  ☰  Daemon               ● Online   ─ □ x│  <- Title bar (native)
├──────┬───────────────────────────────────┤
│      │                                    │
│  🏠  │                                    │
│ Home │        Main Content Area           │
│      │                                    │
│  ⚡  │   (Setup / Diagnostics / Chat /    │
│ Setup│    WhatsApp)                        │
│      │                                    │
│  🔍  │                                    │
│ Diag │                                    │
│      │                                    │
│  💬  │                                    │
│ Chat │                                    │
│      │                                    │
│  📱  │                                    │
│ WA   │                                    │
│      │                                    │
│  ⚙️  │                                    │
│ Set- │                                    │
│ tings│                                    │
│      │                                    │
├──────┴───────────────────────────────────┤
│  Ollama: ● Running   Model: daemon       │  <- Status bar
└──────────────────────────────────────────┘
```

### Screens

| Screen | Route | Description |
|--------|-------|-------------|
| **Home** | `/` | Dashboard with quick-start cards: "Run Setup", "Open Chat", "Check Health", "Connect WhatsApp". Shows overall system status. |
| **Setup Wizard** | `/setup` | Step-by-step setup flow (section 4.1). |
| **Diagnostics** | `/diagnostics` | Health check grid (section 4.2). |
| **Chat** | `/chat` | Chat interface (section 4.4). |
| **WhatsApp** | `/whatsapp` | WhatsApp connection flow (section 4.3). |
| **Settings** | `/settings` | App configuration: theme, model defaults, system prompt editor, OpenClaw config path. |

### Navigation

- Left sidebar with icon+label navigation (collapsible to icons-only).
- Status bar at bottom showing Ollama status and active model.
- System tray icon (optional) for background operation with quick access to chat.

---

## 6. Project Structure

```
daemon/
├── desktop/                          # New -- Tauri desktop app
│   ├── src-tauri/                    # Rust backend
│   │   ├── src/
│   │   │   ├── main.rs              # Tauri entry point
│   │   │   ├── commands/            # IPC command handlers
│   │   │   │   ├── mod.rs
│   │   │   │   ├── ollama.rs        # Ollama API calls
│   │   │   │   ├── setup.rs         # Setup wizard logic
│   │   │   │   ├── diagnostics.rs   # Health checks
│   │   │   │   └── openclaw.rs      # OpenClaw integration
│   │   │   └── lib.rs
│   │   ├── Cargo.toml               # Rust dependencies
│   │   ├── tauri.conf.json          # Tauri config (window, sidecar, capabilities)
│   │   ├── capabilities/            # Permission scopes
│   │   │   └── default.json
│   │   └── bin/                     # Sidecar binaries (populated by build script)
│   │       ├── daemon-setup-x86_64-pc-windows-msvc.exe
│   │       ├── daemon-setup-aarch64-apple-darwin
│   │       └── daemon-setup-x86_64-unknown-linux-gnu
│   ├── src/                          # React frontend (shared with web or forked)
│   │   ├── App.tsx                   # App shell with router
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Setup.tsx
│   │   │   ├── Diagnostics.tsx
│   │   │   ├── Chat.tsx
│   │   │   ├── WhatsApp.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/
│   │   │   ├── layout/              # AppShell, Sidebar, StatusBar
│   │   │   ├── setup/               # SetupStepper, StepCard, LogDrawer
│   │   │   ├── diagnostics/         # HealthCard, StatusBadge, SystemInfo
│   │   │   ├── chat/                # MessageList, MessageBubble, ChatInput, ModelSelector
│   │   │   ├── whatsapp/            # QRDisplay, ChannelStepper
│   │   │   └── shared/              # Reuse from web/ (CodeBlock, InfoBox, etc.)
│   │   ├── hooks/
│   │   │   ├── useOllama.ts         # Ollama API hooks (tags, chat, ps)
│   │   │   ├── useDiagnostics.ts    # Polling health checks
│   │   │   ├── useSetup.ts          # Setup wizard state machine
│   │   │   └── useSidecar.ts        # Sidecar invocation wrapper
│   │   ├── store/
│   │   │   ├── atoms.ts             # Jotai atoms for app state
│   │   │   └── constants.ts
│   │   ├── lib/
│   │   │   ├── tauri.ts             # Tauri invoke/event wrappers
│   │   │   └── ollama-client.ts     # Typed Ollama API client
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── index.html
├── cmd/daemon-setup/                 # Existing Go CLI (built as sidecar)
├── internal/                         # Existing Go packages
├── web/                              # Existing web guide (unchanged)
├── docs/                             # Existing docs (unchanged)
└── Makefile                          # Extended with desktop build targets
```

---

## 7. Rust Backend Commands (IPC)

These are the typed commands exposed to the frontend via `tauri::command`.

### Ollama commands

```rust
#[tauri::command]
async fn ollama_check() -> Result<OllamaStatus, String>
// Returns: { installed: bool, api_reachable: bool, version: Option<String> }

#[tauri::command]
async fn ollama_list_models() -> Result<Vec<ModelInfo>, String>
// Returns list of installed models with name, size, modified date

#[tauri::command]
async fn ollama_pull_model(model: String) -> Result<(), String>
// Starts model pull. Progress streamed via Tauri events.

#[tauri::command]
async fn ollama_running_models() -> Result<Vec<RunningModel>, String>
// Returns currently loaded models (from /api/ps)

#[tauri::command]
async fn ollama_chat(model: String, messages: Vec<Message>, stream: bool) -> Result<ChatResponse, String>
// If stream=true, tokens are pushed via Tauri events. Final response returned.
```

### Setup commands

```rust
#[tauri::command]
async fn setup_check() -> Result<SetupStatus, String>
// Runs daemon-setup check via sidecar, parses output

#[tauri::command]
async fn setup_init() -> Result<(), String>
// Runs daemon-setup init via sidecar

#[tauri::command]
async fn setup_alias() -> Result<(), String>
// Runs daemon-setup alias via sidecar
```

### Diagnostics commands

```rust
#[tauri::command]
async fn diagnostics_full() -> Result<DiagnosticsReport, String>
// Runs all health checks and returns a structured report

#[tauri::command]
async fn system_info() -> Result<SystemInfo, String>
// Returns RAM, disk, CPU info via sysinfo crate
```

### OpenClaw commands

```rust
#[tauri::command]
async fn openclaw_check() -> Result<OpenClawStatus, String>
// Check if installed and gateway running

#[tauri::command]
async fn openclaw_install() -> Result<(), String>
// Run install script. Progress streamed via events.

#[tauri::command]
async fn openclaw_connect_whatsapp() -> Result<(), String>
// Run openclaw channels login --channel whatsapp. QR code streamed via events.

#[tauri::command]
async fn openclaw_configure_model(model: String) -> Result<(), String>
// Write/update ~/.openclaw/openclaw.json with Ollama provider config

#[tauri::command]
async fn openclaw_gateway_restart() -> Result<(), String>
// Run openclaw gateway restart
```

---

## 8. Build & Distribution

### Build targets (extend existing Makefile)

```makefile
# Desktop app
desktop-dev:          # tauri dev (hot-reload)
desktop-build:        # tauri build (release)
desktop-build-linux:  # Cross-compile for Linux
desktop-build-macos:  # Cross-compile for macOS
desktop-build-win:    # Cross-compile for Windows

# Sidecar preparation (build Go binaries with Tauri target-triple names)
sidecar-linux:
	GOOS=linux GOARCH=amd64 go build -o desktop/src-tauri/bin/daemon-setup-x86_64-unknown-linux-gnu ./cmd/daemon-setup

sidecar-macos:
	GOOS=darwin GOARCH=arm64 go build -o desktop/src-tauri/bin/daemon-setup-aarch64-apple-darwin ./cmd/daemon-setup

sidecar-windows:
	GOOS=windows GOARCH=amd64 go build -o desktop/src-tauri/bin/daemon-setup-x86_64-pc-windows-msvc.exe ./cmd/daemon-setup
```

### Distribution

| Platform | Installer format | Auto-update |
|----------|-----------------|-------------|
| Windows | `.msi` + `.exe` (NSIS) | Tauri updater plugin with GitHub Releases |
| macOS | `.dmg` | Tauri updater plugin with GitHub Releases |
| Linux | `.AppImage` + `.deb` | Tauri updater plugin with GitHub Releases |

### CI/CD (GitHub Actions)

- Build sidecars (Go) for all three platforms.
- Build Tauri app for all three platforms.
- Publish installers to GitHub Releases.
- Sign Windows builds with code signing certificate (future).
- Sign macOS builds with Apple Developer ID (future).

---

## 9. Data Model

### Local store (via `@tauri-apps/plugin-store`)

```typescript
interface AppState {
  // Setup
  setupCompleted: boolean
  setupSteps: Record<string, 'pending' | 'done' | 'skipped'>

  // Preferences
  theme: 'light' | 'dark' | 'system'
  defaultModel: string           // e.g., "daemon"
  systemPrompt: string           // editable system prompt

  // Chat
  chatHistory: ChatMessage[]     // persisted between sessions
  chatModel: string              // last used model

  // OpenClaw
  openclawConfigured: boolean
  whatsappConnected: boolean
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  model: string
  stats?: {
    tokensGenerated: number
    durationMs: number
    tokensPerSecond: number
  }
}
```

### Diagnostics report

```typescript
interface DiagnosticsReport {
  timestamp: number
  checks: DiagnosticCheck[]
  overallStatus: 'healthy' | 'degraded' | 'unhealthy'
}

interface DiagnosticCheck {
  id: string
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  metric?: string               // e.g., "18 tok/s", "12.4 GB free"
  action?: {
    label: string               // e.g., "Pull model"
    command: string             // IPC command to invoke
  }
}
```

---

## 10. Implementation Phases

### Phase 1: Foundation (MVP)

- Tauri project scaffolding with React + Vite.
- App shell: sidebar navigation, status bar, routing.
- Setup Wizard (steps 1-6: detect OS through test inference).
- Chat View with streaming responses.
- Basic diagnostics (Ollama installed, API reachable, model available).
- Sidecar integration with `daemon-setup`.

### Phase 2: Full Diagnostics & Polish

- Complete diagnostics dashboard with all checks.
- System info (RAM, disk, CPU).
- Auto-refresh with polling.
- Action buttons on unhealthy checks (pull model, start Ollama, etc.).
- Settings page (theme, model defaults, system prompt editor).
- Chat history persistence.

### Phase 3: WhatsApp & OpenClaw

- OpenClaw install flow.
- WhatsApp channel connection with QR code display.
- OpenClaw model configuration writer.
- Gateway status monitoring.

### Phase 4: Distribution

- GitHub Actions CI/CD pipeline.
- Auto-updater integration.
- Code signing (Windows + macOS).
- Release to GitHub Releases.

---

## 11. Open Questions

| # | Question | Impact |
|---|----------|--------|
| 1 | Should the desktop app share components with the existing web guide, or be a fully independent frontend? Sharing reduces duplication but adds coupling. | Architecture |
| 2 | Should we bundle Ollama inside the installer, or always require the user to install it separately? Bundling simplifies setup but increases installer size significantly (~500 MB+). | Distribution |
| 3 | Should the chat view support multiple conversations (tabs), or just a single conversation? | Scope |
| 4 | Should the app run as a background process (system tray) to monitor Ollama health and send notifications? | Scope |
| 5 | How does OpenClaw's WhatsApp channel login actually deliver the QR code? Need to verify whether it outputs to stdout, opens a browser, or uses a local web server. | WhatsApp flow |
| 6 | Should the app support configuring OpenClaw's other channels (Telegram, Discord, Slack) in addition to WhatsApp, or only WhatsApp for v1? | Scope |
