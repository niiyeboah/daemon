# Build the daemon-setup CLI for current OS
.PHONY: build
build:
	go build -o daemon-setup ./cmd/daemon-setup

# Build for macOS (darwin). Use GOARCH=arm64 for Apple Silicon, amd64 for Intel.
.PHONY: build-macos
build-macos:
	GOOS=darwin GOARCH=$$(go env GOARCH) go build -o daemon-setup ./cmd/daemon-setup

# Run tests
.PHONY: test
test:
	go test ./...

# Clean built binary
.PHONY: clean
clean:
	rm -f daemon-setup
