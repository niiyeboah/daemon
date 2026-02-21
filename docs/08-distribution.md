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
   - Automated via `.github/workflows/desktop-release.yml`
   - Push tag `desktop-v*` (e.g. `desktop-v0.1.0`) or run workflow manually
   - Builds macOS (aarch64), Linux (x86_64), and Windows (x86_64)
   - Creates GitHub Release with installers and `latest.json` for auto-updates

## macOS: "Damaged" DMG / Gatekeeper

Builds use ad-hoc signing by default. If users see *"Daemon is damaged and can't be opened"* after downloading the DMG, they can remove the quarantine attribute: `xattr -cr ~/Downloads/Daemon_*.dmg` (and after install, `xattr -cr /Applications/Daemon.app`). See [Troubleshooting — macOS](05-troubleshooting.md#macos-daemon-is-damaged-and-cant-be-opened).

## Code Signing (Optional)

To sign and notarize the macOS build in CI, add these repository secrets and re-run the Desktop Release workflow:

| Secret                       | Description                                       |
| ---------------------------- | ------------------------------------------------- |
| `APPLE_CERTIFICATE`          | Base64-encoded `.p12` (Developer ID Application)  |
| `APPLE_CERTIFICATE_PASSWORD` | Password for the `.p12`                           |
| `KEYCHAIN_PASSWORD`          | Password for the temporary build keychain         |
| `APPLE_ID`                   | Apple ID email                                    |
| `APPLE_PASSWORD`             | App-Specific Password (not your Apple ID password)|
| `APPLE_TEAM_ID`              | Team ID from developer.apple.com                  |

Requires a paid Apple Developer account. If these secrets are not set, the workflow uses ad-hoc signing and the DMG still builds; users can apply the quarantine workaround above.

- **Windows:** Code signing certificate (future)
