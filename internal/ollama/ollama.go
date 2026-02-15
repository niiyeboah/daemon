package ollama

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os/exec"
	"runtime"
	"strings"
	"time"
)

const (
	DefaultBaseModel = "llama3.2:3b"
	DefaultHost     = "http://localhost:11434"
	apiTimeout      = 5 * time.Second
)

// tagsResponse matches the structure of GET /api/tags
type tagsResponse struct {
	Models []struct {
		Name string `json:"name"`
	} `json:"models"`
}

// Check verifies that ollama is in PATH and optionally that the API is
// reachable and that the base model and "daemon" model exist.
// Returns an error (and prints guidance) if something is missing.
func Check(out io.Writer, skipAPI bool) error {
	path, err := exec.LookPath("ollama")
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
		// Model names can be "llama3.2:3b" or "daemon"
		names[m.Name] = true
		// Also match without tag for "llama3.2"
		if idx := strings.Index(m.Name, ":"); idx > 0 {
			names[m.Name[:idx]] = true
		}
	}

	hasBase := names[DefaultBaseModel] || names["llama3.2:3b"]
	hasDaemon := names["daemon"]

	if !hasBase {
		fmt.Fprintf(out, "Base model %q not found. Run: ollama pull %s\n", DefaultBaseModel, DefaultBaseModel)
		return fmt.Errorf("base model %s not found", DefaultBaseModel)
	}
	fmt.Fprintf(out, "Base model %s: present\n", DefaultBaseModel)

	if !hasDaemon {
		fmt.Fprintf(out, "Daemon model not found. Run: daemon-setup init\n")
		return fmt.Errorf("daemon model not found")
	}
	fmt.Fprintf(out, "Daemon model: present\n")
	return nil
}

// CreateModel runs `ollama create <name> -f <modelfilePath>` and streams
// stdout/stderr to the provided writers.
func CreateModel(modelfilePath, modelName string, stdout, stderr io.Writer) error {
	cmd := exec.Command("ollama", "create", modelName, "-f", modelfilePath)
	cmd.Stdout = stdout
	cmd.Stderr = stderr
	cmd.Stdin = nil
	return cmd.Run()
}
