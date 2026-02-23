# --- Desktop app (Tauri) ---

# Run desktop app in dev mode (hot-reload)
.PHONY: desktop-dev
desktop-dev:
	cd desktop && npm run tauri dev

# Build desktop app for production (current platform)
.PHONY: desktop-build
desktop-build:
	cd desktop && npm run tauri build

# Cross-compile for Linux (amd64)
.PHONY: desktop-build-linux
desktop-build-linux:
	cd desktop && npm run tauri build -- --target x86_64-unknown-linux-gnu

# Cross-compile for Windows (amd64)
.PHONY: desktop-build-win
desktop-build-win:
	cd desktop && npm run tauri build -- --target x86_64-pc-windows-msvc
