package shell

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// RcPath returns the path to the shell rc file (.bashrc or .zshrc) based on
// the SHELL environment variable. Defaults to .bashrc if SHELL is unset or
// not recognized.
func RcPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	shell := os.Getenv("SHELL")
	if strings.Contains(shell, "zsh") {
		return filepath.Join(home, ".zshrc"), nil
	}
	return filepath.Join(home, ".bashrc"), nil
}

// AddAlias appends an alias line to the user's rc file if not already present.
// aliasName and aliasValue are used to form: alias aliasName="aliasValue".
// If dryRun is true, only prints what would be appended and does not write.
func AddAlias(out io.Writer, aliasName, aliasValue string, dryRun bool) error {
	rcPath, err := RcPath()
	if err != nil {
		return err
	}

	line := fmt.Sprintf("alias %s=%q\n", aliasName, aliasValue)

	// Idempotent: check if already present
	f, err := os.Open(rcPath)
	if err != nil {
		if !os.IsNotExist(err) {
			return err
		}
		// File does not exist; we will create it
		f = nil
	}
	if f != nil {
		scanner := bufio.NewScanner(f)
		for scanner.Scan() {
			trimmed := strings.TrimSpace(scanner.Text())
			// Match alias name=value or alias name="value"
			if trimmed == strings.TrimSpace(line) ||
				strings.HasPrefix(trimmed, "alias "+aliasName+"=") {
				fmt.Fprintf(out, "Alias already present in %s.\n", rcPath)
				f.Close()
				return nil
			}
		}
		f.Close()
		if err := scanner.Err(); err != nil {
			return err
		}
	}

	if dryRun {
		fmt.Fprintf(out, "Would append to %s:\n%s", rcPath, line)
		return nil
	}

	flags := os.O_APPEND | os.O_CREATE | os.O_WRONLY
	rc, err := os.OpenFile(rcPath, flags, 0644)
	if err != nil {
		return err
	}
	defer rc.Close()

	if _, err := rc.WriteString(line); err != nil {
		return err
	}
	fmt.Fprintf(out, "Added alias to %s. Run 'source %s' or open a new terminal.\n", rcPath, rcPath)
	return nil
}
