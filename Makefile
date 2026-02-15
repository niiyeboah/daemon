# Build the daemon-setup CLI for current OS
.PHONY: build
build:
	go build -o daemon-setup ./cmd/daemon-setup

# Build for macOS (darwin). Use GOARCH=arm64 for Apple Silicon, amd64 for Intel.
.PHONY: build-macos
build-macos:
	GOOS=darwin GOARCH=$$(go env GOARCH) go build -o daemon-setup ./cmd/daemon-setup

# Build for Windows (amd64). Use from Linux/macOS to produce daemon-setup.exe.
.PHONY: build-windows
build-windows:
	GOOS=windows GOARCH=amd64 go build -o daemon-setup.exe ./cmd/daemon-setup

# Run tests
.PHONY: test
test:
	go test ./...

# Clean built binaries
.PHONY: clean
clean:
	rm -f daemon-setup daemon-setup.exe
