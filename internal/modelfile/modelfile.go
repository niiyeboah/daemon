package modelfile

import (
	"fmt"
	"os"
	"path/filepath"
)

// Default system prompt from docs/05-daemon-bot.md
const defaultSystemPrompt = `You are Daemon, a helpful and concise personal assistant running locally on the user's own hardware. You respect the user's privacy -- no data ever leaves this machine. You answer questions clearly and directly. When you are unsure, you say so. You are friendly but not verbose.`

// Params holds Modelfile parameters (can be overridden by flags).
type Params struct {
	BaseModel    string  // FROM ...
	SystemPrompt string  // SYSTEM """..."""
	Temperature  float64 // PARAMETER temperature
	TopP         float64 // PARAMETER top_p
	NumCtx       int     // PARAMETER num_ctx
}

// DefaultParams returns the defaults from docs/05-daemon-bot.md.
func DefaultParams(baseModel string) Params {
	if baseModel == "" {
		baseModel = "llama3.2:3b"
	}
	return Params{
		BaseModel:    baseModel,
		SystemPrompt: defaultSystemPrompt,
		Temperature:  0.7,
		TopP:         0.9,
		NumCtx:       2048,
	}
}

// Content returns the full Modelfile content.
func Content(p Params) string {
	return fmt.Sprintf(`FROM %s

PARAMETER temperature %.1f
PARAMETER top_p %.1f
PARAMETER num_ctx %d

SYSTEM """
%s
"""
`,
		p.BaseModel,
		p.Temperature,
		p.TopP,
		p.NumCtx,
		p.SystemPrompt,
	)
}

// Write writes the Modelfile to the given path, creating parent dirs if needed.
func Write(path string, p Params) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	return os.WriteFile(path, []byte(Content(p)), 0644)
}
