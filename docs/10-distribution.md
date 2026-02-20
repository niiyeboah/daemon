# Distribution & Auto-Updates

This document describes how to build and distribute the Daemon desktop app (Phase 4).

## Installer Formats

| Platform | Format | Default |
|----------|--------|---------|
| macOS | `.dmg` | Primary (M4 Mac Mini target) |
| Windows | `.msi` (WiX) + `.exe` (NSIS) | |
| Linux | `.AppImage` + `.deb` | |

## Makefile Targets

```bash
# Development (hot-reload)
make desktop-dev

# Production build (current platform)
make desktop-build

# Cross-compile macOS (primary)
make desktop-build-macos

# Cross-compile Linux (amd64)
make desktop-build-linux

# Cross-compile Windows (amd64)
make desktop-build-win
```

## Sidecar Build Targets

The Go `daemon-setup` CLI is built as a per-target sidecar:

```bash
make sidecar-macos    # daemon-setup-aarch64-apple-darwin (M4 Mac Mini)
make sidecar-linux    # daemon-setup-x86_64-unknown-linux-gnu
make sidecar-windows  # daemon-setup-x86_64-pc-windows-msvc.exe
```

## Auto-Updater (GitHub Releases)

The app uses the Tauri updater plugin with GitHub Releases. To enable signed updates:

1. **Generate signing keys:**
   ```bash
   cd desktop && npm run tauri signer generate -- -w ~/.tauri/daemon.key
   ```

2. **Update `tauri.conf.json`:**
   - Set `"createUpdaterArtifacts": true` in `bundle`
   - Replace `REPLACE_WITH_PUBLIC_KEY` in `plugins.updater.pubkey` with the content of `~/.tauri/daemon.key.pub`

3. **Build with private key:**
   ```bash
   export TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.tauri/daemon.key)"
   make desktop-build
   ```

4. **Upload to GitHub Releases:**
   - Upload the DMG/MSI/AppImage and their `.sig` files
   - Create `latest.json` with the format from [Tauri updater docs](https://v2.tauri.app/plugin/updater)
   - Or use GitHub Actions: [tauri-action](https://github.com/tauri-apps/tauri-action)

## Code Signing (Future)

- **macOS:** Apple Developer ID (priority for M4 Mac Mini users)
- **Windows:** Code signing certificate
