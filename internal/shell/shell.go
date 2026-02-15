package shell

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

// RcPath returns the path to the shell rc file. On Windows this is the
// PowerShell profile; on Unix it is .bashrc or .zshrc based on SHELL.
func RcPath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	if runtime.GOOS == "windows" {
		return filepath.Join(home, "Documents", "WindowsPowerShell", "Microsoft.PowerShell_profile.ps1"), nil
	}
	shell := os.Getenv("SHELL")
	if strings.Contains(shell, "zsh") {
		return filepath.Join(home, ".zshrc"), nil
	}
	return filepath.Join(home, ".bashrc"), nil
}

// AddAlias appends an alias (Unix) or PowerShell function (Windows) to the
// user's rc file if not already present. If dryRun is true, only prints what
// would be appended and does not write.
func AddAlias(out io.Writer, aliasName, aliasValue string, dryRun bool) error {
	rcPath, err := RcPath()
	if err != nil {
		return err
	}

	var line string
	var alreadyPresentPrefix string
	if runtime.GOOS == "windows" {
		line = fmt.Sprintf("function %s { %s }\n", aliasName, aliasValue)
		alreadyPresentPrefix = "function " + aliasName + " "
	} else {
		line = fmt.Sprintf("alias %s=%q\n", aliasName, aliasValue)
		alreadyPresentPrefix = "alias " + aliasName + "="
	}

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
			if trimmed == strings.TrimSpace(line) || strings.HasPrefix(trimmed, alreadyPresentPrefix) {
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

	// On Windows, ensure profile directory exists
	if runtime.GOOS == "windows" {
		if err := os.MkdirAll(filepath.Dir(rcPath), 0755); err != nil {
			return err
		}
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
	if runtime.GOOS == "windows" {
		fmt.Fprintf(out, "Added to PowerShell profile. Restart PowerShell or run `. $PROFILE` to load it.\n")
	} else {
		fmt.Fprintf(out, "Added alias to %s. Run 'source %s' or open a new terminal.\n", rcPath, rcPath)
	}
	return nil
}
