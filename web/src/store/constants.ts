import type { SectionMeta, Step } from '@/types'

export const GITHUB_RELEASES_URL = 'https://github.com/niiyeboah/daemon/releases'
export const GITHUB_RELEASES_LATEST_URL = 'https://github.com/niiyeboah/daemon/releases/latest'

/** Direct download URLs for the latest CLI builds (GitHub redirects latest → tag) */
const RELEASES_LATEST_DOWNLOAD = 'https://github.com/niiyeboah/daemon/releases/latest/download'
export const CLI_BUILD_URLS = {
  linuxAmd64: `${RELEASES_LATEST_DOWNLOAD}/daemon-setup-linux-amd64`,
  windowsAmd64: `${RELEASES_LATEST_DOWNLOAD}/daemon-setup-windows-amd64.exe`,
  darwinArm64: `${RELEASES_LATEST_DOWNLOAD}/daemon-setup-darwin-arm64`,
} as const

export const SECTIONS: SectionMeta[] = [
  { id: 'hero', title: 'Introduction' },
  { id: 'hardware', title: 'Hardware' },
  { id: 'os-setup', title: 'OS Setup' },
  { id: 'post-install', title: 'Post-Install' },
  { id: 'ollama', title: 'Ollama + Llama' },
  { id: 'daemon-bot', title: 'Daemon Bot' },
  { id: 'security', title: 'Security' },
  { id: 'troubleshooting', title: 'Troubleshooting' },
  { id: 'openclaw', title: 'OpenClaw & Automation' },
  { id: 'next-steps', title: 'Next Steps' },
]

export const STEPS: Step[] = [
  // Hardware
  { id: 'hardware-ready', section: 'hardware', label: 'Hardware set up and powered on', os: 'all' },

  // OS Setup
  { id: 'os-installed', section: 'os-setup', label: 'Operating system installed', os: 'all' },
  { id: 'go-installed', section: 'os-setup', label: 'Go installed', os: 'all' },

  // Post-Install (Ubuntu only)
  { id: 'system-updated', section: 'post-install', label: 'System packages updated', os: 'ubuntu' },
  { id: 'hostname-set', section: 'post-install', label: 'Hostname and timezone configured', os: 'ubuntu' },

  // Ollama
  { id: 'ollama-installed', section: 'ollama', label: 'Ollama installed and running', os: 'all' },
  { id: 'model-pulled', section: 'ollama', label: 'Llama 3.2 1B model downloaded', os: 'all' },
  { id: 'model-tested', section: 'ollama', label: 'Model tested interactively', os: 'all' },

  // Daemon Bot
  { id: 'daemon-setup-built', section: 'daemon-bot', label: 'daemon-setup CLI built', os: 'all' },
  { id: 'daemon-model-created', section: 'daemon-bot', label: 'Daemon model created', os: 'all' },
  { id: 'shell-alias-added', section: 'daemon-bot', label: 'Shell alias configured', os: 'all' },

  // Security
  { id: 'firewall-configured', section: 'security', label: 'Firewall configured', os: 'ubuntu' },
  { id: 'ssh-hardened', section: 'security', label: 'SSH access hardened', os: 'ubuntu' },
  { id: 'auto-updates-enabled', section: 'security', label: 'Automatic updates enabled', os: 'ubuntu' },
]
