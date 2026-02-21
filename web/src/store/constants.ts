import type { SectionMeta } from '@/types'

export const GITHUB_RELEASES_URL = 'https://github.com/niiyeboah/daemon/releases'
export const GITHUB_RELEASES_LATEST_URL = 'https://github.com/niiyeboah/daemon/releases/latest'

/** Desktop app version (from tauri.conf.json at build time via Vite define) */
const DESKTOP_VERSION = import.meta.env.VITE_DESKTOP_VERSION ?? '0.1.1'

/** Base URL for desktop release assets (tag: desktop-v{VERSION}) */
export const DESKTOP_RELEASE_BASE = `https://github.com/niiyeboah/daemon/releases/download/desktop-v${DESKTOP_VERSION}`

/** Direct download URLs for the Daemon Desktop app */
export const DESKTOP_DOWNLOAD_URLS = {
  macosAarch64: `${DESKTOP_RELEASE_BASE}/Daemon_${DESKTOP_VERSION}_aarch64.dmg`,
  windowsX64: `${DESKTOP_RELEASE_BASE}/Daemon_${DESKTOP_VERSION}_x64-setup.exe`,
  linuxDeb: `${DESKTOP_RELEASE_BASE}/Daemon_${DESKTOP_VERSION}_amd64.deb`,
  linuxAppImage: `${DESKTOP_RELEASE_BASE}/Daemon_${DESKTOP_VERSION}_amd64.AppImage`,
  linuxRpm: `${DESKTOP_RELEASE_BASE}/Daemon-${DESKTOP_VERSION}-1.x86_64.rpm`,
} as const

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
  { id: 'security', title: 'Security' },
  { id: 'troubleshooting', title: 'Troubleshooting' },
  { id: 'openclaw', title: 'OpenClaw & Automation' },
  { id: 'next-steps', title: 'Next Steps' },
]
