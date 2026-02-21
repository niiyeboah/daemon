package ollama

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const (
	DefaultBaseModel = "llama3.2:8b"
	DefaultHost     = "http://localhost:11434"
	apiTimeout      = 5 * time.Second
)

// tagsResponse matches the structure of GET /api/tags
type tagsResponse struct {
	Models []struct {
		Name string `json:"name"`
	} `json:"models"`
}

// ollamaPaths returns candidate paths for the ollama binary. Used when the
// process PATH is minimal (e.g. GUI apps on macOS).
func ollamaCandidatePaths() []string {
	if runtime.GOOS != "darwin" {
		return nil
	}
	return []string{
		"/usr/local/bin/ollama",
		"/opt/homebrew/bin/ollama",
		"/Applications/Ollama.app/Contents/Resources/ollama",
	}
}

// ollamaPath returns the path to the ollama binary, or an error if not found.
// It tries exec.LookPath first, then on macOS tries common install locations
// so that GUI-launched processes (e.g. desktop app) can find ollama even when
// PATH does not include /usr/local/bin or /opt/homebrew/bin.
func ollamaPath() (string, error) {
	if path, err := exec.LookPath("ollama"); err == nil {
		return path, nil
	}
	for _, p := range ollamaCandidatePaths() {
		if p == "" {
			continue
		}
		info, err := os.Stat(p)
		if err != nil {
			continue
		}
		if info.Mode().IsRegular() || (info.Mode()&os.ModeSymlink != 0) {
			// Resolve symlink to get executable path
			resolved := p
			if info.Mode()&os.ModeSymlink != 0 {
				if r, err := filepath.EvalSymlinks(p); err == nil {
					resolved = r
				}
			}
			return resolved, nil
		}
	}
	return "", fmt.Errorf("ollama: executable file not found in $PATH")
}

// Check verifies that ollama is in PATH and optionally that the API is
// reachable and that the base model and custom model exist.
// If baseModel or customModel is empty, defaults are used (llama3.2:8b and "daemon").
// Returns an error (and prints guidance) if something is missing.
func Check(out io.Writer, skipAPI bool, baseModel, customModel string) error {
	if baseModel == "" {
		baseModel = DefaultBaseModel
	}
	if customModel == "" {
		customModel = "daemon"
	}
	path, err := ollamaPath()
	if err != nil {
		fmt.Fprintf(out, "Ollama not found in PATH.\n")
		fmt.Fprintf(out, "Install from https://ollama.com or see docs/04-ollama-llama.md\n")
		return err
	}
	fmt.Fprintf(out, "Ollama found: %s\n", path)

	if skipAPI {
		return nil
	}

	client := &http.Client{Timeout: apiTimeout}
	resp, err := client.Get(DefaultHost + "/api/tags")
	if err != nil {
		fmt.Fprintf(out, "Ollama API not reachable at %s.\n", DefaultHost)
		if runtime.GOOS == "windows" {
			fmt.Fprintf(out, "Start Ollama from the Start menu or run 'ollama serve' in a terminal.\n")
		} else {
			fmt.Fprintf(out, "Start Ollama (e.g. systemctl start ollama) or run 'ollama serve'.\n")
		}
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Fprintf(out, "Ollama API returned status %d.\n", resp.StatusCode)
		return fmt.Errorf("ollama API: %d", resp.StatusCode)
	}

	var tags tagsResponse
	if err := json.NewDecoder(resp.Body).Decode(&tags); err != nil {
		fmt.Fprintf(out, "Failed to parse Ollama API response: %v\n", err)
		return err
	}

	names := make(map[string]bool)
	for _, m := range tags.Models {
		// Model names can be "llama3.2:8b" or "daemon"
		names[m.Name] = true
		// Also match without tag for "llama3.2"
		if idx := strings.Index(m.Name, ":"); idx > 0 {
			names[m.Name[:idx]] = true
		}
	}

	hasBase := names[baseModel]
	if !hasBase && strings.Index(baseModel, ":") > 0 {
		hasBase = names[baseModel[:strings.Index(baseModel, ":")]]
	}
	if !hasBase {
		fmt.Fprintf(out, "Base model %q not found. Run: ollama pull %s\n", baseModel, baseModel)
		return fmt.Errorf("base model %s not found", baseModel)
	}
	fmt.Fprintf(out, "Base model %s: present\n", baseModel)

	hasCustom := names[customModel]
	if !hasCustom {
		fmt.Fprintf(out, "Custom model %q not found. Run: daemon-setup init\n", customModel)
		return fmt.Errorf("%s model not found", customModel)
	}
	fmt.Fprintf(out, "Custom model %s: present\n", customModel)
	return nil
}

// CreateModel runs `ollama create <name> -f <modelfilePath>` and streams
// stdout/stderr to the provided writers.
func CreateModel(modelfilePath, modelName string, stdout, stderr io.Writer) error {
	path, err := ollamaPath()
	if err != nil {
		return err
	}
	cmd := exec.Command(path, "create", modelName, "-f", modelfilePath)
	cmd.Stdout = stdout
	cmd.Stderr = stderr
	cmd.Stdin = nil
	return cmd.Run()
}
