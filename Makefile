# Build the daemon-setup CLI for current OS
.PHONY: build
build:
	go build -o daemon-setup ./cmd/daemon-setup

# Build for macOS (darwin). Use GOARCH=arm64 for Apple Silicon, amd64 for Intel.
.PHONY: build-macos
build-macos:
	GOOS=darwin GOARCH=$$(go env GOARCH) go build -o daemon-setup ./cmd/daemon-setup

# Build for Linux (amd64). Use from macOS/Windows to produce a Linux binary.
.PHONY: build-linux
build-linux:
	GOOS=linux GOARCH=amd64 go build -o daemon-setup-linux-amd64 ./cmd/daemon-setup

# Build for Windows (amd64). Use from Linux/macOS to produce daemon-setup.exe.
.PHONY: build-windows
build-windows:
	GOOS=windows GOARCH=amd64 go build -o daemon-setup.exe ./cmd/daemon-setup

# Run tests
.PHONY: test
test:
	go test ./...

# --- Desktop app (Tauri) ---

# Build sidecar for macOS (Apple Silicon)
.PHONY: sidecar-macos
sidecar-macos:
	@mkdir -p desktop/src-tauri/bin
	GOOS=darwin GOARCH=arm64 go build -o desktop/src-tauri/bin/daemon-setup-aarch64-apple-darwin ./cmd/daemon-setup

# Build sidecar for macOS (Intel)
.PHONY: sidecar-macos-x64
sidecar-macos-x64:
	@mkdir -p desktop/src-tauri/bin
	GOOS=darwin GOARCH=amd64 go build -o desktop/src-tauri/bin/daemon-setup-x86_64-apple-darwin ./cmd/daemon-setup

# Build sidecar for Linux (amd64)
.PHONY: sidecar-linux
sidecar-linux:
	@mkdir -p desktop/src-tauri/bin
	GOOS=linux GOARCH=amd64 go build -o desktop/src-tauri/bin/daemon-setup-x86_64-unknown-linux-gnu ./cmd/daemon-setup

# Build sidecar for Windows (amd64)
.PHONY: sidecar-windows
sidecar-windows:
	@mkdir -p desktop/src-tauri/bin
	GOOS=windows GOARCH=amd64 go build -o desktop/src-tauri/bin/daemon-setup-x86_64-pc-windows-msvc.exe ./cmd/daemon-setup

# Run desktop app in dev mode (macOS)
.PHONY: desktop-dev
desktop-dev: sidecar-macos
	cd desktop && npm run tauri dev

# Build desktop app for production (macOS)
.PHONY: desktop-build
desktop-build: sidecar-macos
	cd desktop && npm run tauri build

# Clean built binaries
.PHONY: clean
clean:
	rm -f daemon-setup daemon-setup.exe daemon-setup-linux-amd64
	rm -rf desktop/src-tauri/bin/daemon-setup-*
