package main

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/niiyeboah/daemon-bot/internal/modelfile"
	"github.com/niiyeboah/daemon-bot/internal/ollama"
	"github.com/niiyeboah/daemon-bot/internal/shell"

	"github.com/AlecAivazis/survey/v2"
	"github.com/spf13/cobra"
	"golang.org/x/term"
)

func main() {
	root := &cobra.Command{
		Use:   "daemon-setup",
		Short: "Setup the Daemon personal assistant bot (Ollama + Modelfile)",
		Long:  "Daemon-setup helps you configure the Daemon bot on your PC: check prerequisites, write the Modelfile, create the daemon model, and optionally add a shell alias.",
		RunE: func(cmd *cobra.Command, args []string) error {
			if term.IsTerminal(int(os.Stdin.Fd())) {
				return runInteractive(cmd.OutOrStdout(), cmd.ErrOrStderr())
			}
			printMenu(cmd.OutOrStdout())
			return nil
		},
	}
	root.CompletionOptions.DisableDefaultCmd = true
	root.SilenceUsage = true

	root.AddCommand(newCheckCmd())
	root.AddCommand(newInitCmd())
	root.AddCommand(newModelfileCmd())
	root.AddCommand(newAliasCmd())
	root.AddCommand(newSetupCmd())
	root.AddCommand(newGuideCmd())

	if err := root.Execute(); err != nil {
		os.Exit(1)
	}
}

func init() {
	defaultModelfilePath = func() (string, error) {
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		return filepath.Join(home, "Modelfile"), nil
	}
}

var defaultModelfilePath func() (string, error)

func modelfilePathOrDefault(override string) (string, error) {
	if override != "" {
		return override, nil
	}
	return defaultModelfilePath()
}

func printMenu(w io.Writer) {
	fmt.Fprintln(w, "Daemon setup – configure your local assistant")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "Commands:")
	fmt.Fprintln(w, "  check     Verify Ollama and required models")
	fmt.Fprintln(w, "  init      Write Modelfile and create daemon model")
	fmt.Fprintln(w, "  modelfile Write Modelfile only")
	fmt.Fprintln(w, "  alias     Add shell alias so you can run 'daemon'")
	fmt.Fprintln(w, "  setup     Full setup (check → init → alias)")
	fmt.Fprintln(w, "  guide     Show full setup guide and workflow")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "Run without arguments in a terminal for interactive mode.")
	fmt.Fprintln(w, "Run daemon-setup guide for full help.")
}

const (
	menuCheck     = "Check prerequisites"
	menuInit      = "Init (write Modelfile and create model)"
	menuModelfile = "Write Modelfile only"
	menuAlias     = "Add shell alias"
	menuSetup     = "Full setup (check → init → alias)"
	menuGuide     = "Show guide"
	menuExit      = "Exit"
)

func runInteractive(stdout, stderr io.Writer) error {
	mainOpt := ""
	prompt := &survey.Select{
		Message: "What do you want to do?",
		Options: []string{menuCheck, menuInit, menuModelfile, menuAlias, menuSetup, menuGuide, menuExit},
	}
	if err := survey.AskOne(prompt, &mainOpt); err != nil {
		return err
	}
	switch mainOpt {
	case menuExit:
		return nil
	case menuGuide:
		printGuide(stdout)
		return nil
	case menuCheck:
		return runInteractiveCheck(stdout)
	case menuInit:
		return runInteractiveInit(stdout, stderr)
	case menuModelfile:
		return runInteractiveModelfile(stdout)
	case menuAlias:
		return runInteractiveAlias(stdout)
	case menuSetup:
		return runInteractiveSetup(stdout, stderr)
	default:
		return nil
	}
}

func runInteractiveCheck(stdout io.Writer) error {
	skipAPI := false
	if err := survey.AskOne(&survey.Confirm{
		Message: "Skip API check? (only check ollama in PATH)",
		Default: false,
	}, &skipAPI); err != nil {
		return err
	}
	return ollama.Check(stdout, skipAPI, "", "")
}

func defaultModelfilePathString() string {
	path, err := defaultModelfilePath()
	if err != nil {
		return "~/Modelfile"
	}
	return path
}

func runInteractiveInit(stdout, stderr io.Writer) error {
	path, err := promptPathModelBase()
	if err != nil {
		return err
	}
	return runInit(stdout, stderr, path.Modelfile, path.ModelName, path.BaseModel)
}

func runInteractiveModelfile(stdout io.Writer) error {
	path, err := promptPathModelBase()
	if err != nil {
		return err
	}
	return runModelfile(stdout, path.Modelfile, path.ModelName, path.BaseModel)
}

type pathModelBase struct {
	Modelfile string `survey:"modelfile"`
	ModelName string `survey:"modelName"`
	BaseModel string `survey:"baseModel"`
}

func promptPathModelBase() (*pathModelBase, error) {
	defaultPath := defaultModelfilePathString()
	out := &pathModelBase{}
	qs := []*survey.Question{
		{
			Name: "modelfile",
			Prompt: &survey.Input{Message: "Modelfile path:", Default: defaultPath},
			Transform: survey.TransformString(func(s string) string {
				return strings.TrimSpace(s)
			}),
		},
		{
			Name: "modelName",
			Prompt: &survey.Input{Message: "Model name:", Default: "daemon"},
			Transform: survey.TransformString(func(s string) string {
				return strings.TrimSpace(s)
			}),
		},
		{
			Name: "baseModel",
			Prompt: &survey.Input{Message: "Base model (FROM):", Default: "llama3.2:3b"},
			Transform: survey.TransformString(func(s string) string {
				return strings.TrimSpace(s)
			}),
		},
	}
	if err := survey.Ask(qs, out); err != nil {
		return nil, err
	}
	return out, nil
}

func runInteractiveAlias(stdout io.Writer) error {
	dryRun := false
	if err := survey.AskOne(&survey.Confirm{
		Message: "Dry run? (only print what would be added)",
		Default: false,
	}, &dryRun); err != nil {
		return err
	}
	return shell.AddAlias(stdout, "daemon", "ollama run daemon", dryRun)
}

func runInteractiveSetup(stdout, stderr io.Writer) error {
	path, err := promptPathModelBase()
	if err != nil {
		return err
	}
	return runSetup(stdout, stderr, false, path.Modelfile, path.ModelName, path.BaseModel)
}

func runInit(stdout, stderr io.Writer, modelfilePath, modelName, baseModel string) error {
	path, err := modelfilePathOrDefault(modelfilePath)
	if err != nil {
		return err
	}
	p := modelfile.DefaultParams(baseModel)
	if err := modelfile.Write(path, p); err != nil {
		return err
	}
	fmt.Fprintf(stdout, "Wrote Modelfile to %s\n", path)
	if err := ollama.CreateModel(path, modelName, stdout, stderr); err != nil {
		return fmt.Errorf("ollama create: %w", err)
	}
	fmt.Fprintf(stdout, "Daemon model %q created. Run: ollama run %s\n", modelName, modelName)
	return nil
}

func runModelfile(stdout io.Writer, modelfilePath, modelName, baseModel string) error {
	path, err := modelfilePathOrDefault(modelfilePath)
	if err != nil {
		return err
	}
	p := modelfile.DefaultParams(baseModel)
	if err := modelfile.Write(path, p); err != nil {
		return err
	}
	fmt.Fprintf(stdout, "Wrote Modelfile to %s. Create the model with: ollama create %s -f %s\n", path, modelName, path)
	return nil
}

func runSetup(stdout, stderr io.Writer, yes bool, modelfilePath, modelName, baseModel string) error {
	if err := ollama.Check(stdout, false, baseModel, modelName); err != nil {
		// If only the custom model is missing, we can continue; if ollama or base model missing, stop
		if !isOnlyCustomModelMissing(err) {
			return err
		}
	}
	path, err := modelfilePathOrDefault(modelfilePath)
	if err != nil {
		return err
	}
	if !yes {
		fmt.Fprintf(stdout, "Will write Modelfile to %s and create model %q. Continue? [y/N]: ", path, modelName)
		var response string
		if _, err := fmt.Scanln(&response); err != nil || (response != "y" && response != "Y") {
			fmt.Fprintln(stdout, "Aborted.")
			return nil
		}
	}
	if err := runInit(stdout, stderr, modelfilePath, modelName, baseModel); err != nil {
		return err
	}
	if !yes {
		fmt.Fprintf(stdout, "Add shell alias so you can run 'daemon'? [y/N]: ")
		var response string
		if _, err := fmt.Scanln(&response); err != nil || (response != "y" && response != "Y") {
			return nil
		}
	}
	return shell.AddAlias(stdout, "daemon", "ollama run "+modelName, false)
}

func isOnlyCustomModelMissing(err error) bool {
	if err == nil {
		return false
	}
	s := err.Error()
	return s == "daemon model not found" || s == "daemon-lite model not found"
}

func newCheckCmd() *cobra.Command {
	var skipAPI bool
	cmd := &cobra.Command{
		Use:   "check",
		Short: "Verify Ollama is installed and required models are available",
		RunE: func(cmd *cobra.Command, args []string) error {
			return ollama.Check(cmd.OutOrStdout(), skipAPI, "", "")
		},
	}
	cmd.Flags().BoolVar(&skipAPI, "skip-api", false, "Only check that ollama is in PATH; do not query the API")
	return cmd
}

func newInitCmd() *cobra.Command {
	var (
		modelfilePath string
		modelName     string
		baseModel     string
		lite          bool
	)
	cmd := &cobra.Command{
		Use:   "init",
		Short: "Write the Modelfile and create the daemon model with ollama",
		RunE: func(c *cobra.Command, args []string) error {
			name, base := modelName, baseModel
			if lite {
				name, base = "daemon-lite", "llama3.2:1b"
			}
			return runInit(c.OutOrStdout(), c.ErrOrStderr(), modelfilePath, name, base)
		},
	}
	cmd.Flags().StringVar(&modelfilePath, "modelfile", "", "Path to write the Modelfile (default: $HOME/Modelfile)")
	cmd.Flags().StringVar(&modelName, "model-name", "daemon", "Name of the custom model to create")
	cmd.Flags().StringVar(&baseModel, "base-model", "llama3.2:3b", "Base model in the Modelfile (FROM)")
	cmd.Flags().BoolVar(&lite, "lite", false, "Use llama3.2:1b and create daemon-lite (faster inference for OpenClaw on low-power hardware)")
	return cmd
}

func newModelfileCmd() *cobra.Command {
	var (
		modelfilePath string
		modelName     string
		baseModel     string
		lite          bool
	)
	cmd := &cobra.Command{
		Use:   "modelfile",
		Short: "Write the Modelfile only (no ollama create)",
		RunE: func(c *cobra.Command, args []string) error {
			name, base := modelName, baseModel
			if lite {
				name, base = "daemon-lite", "llama3.2:1b"
			}
			return runModelfile(c.OutOrStdout(), modelfilePath, name, base)
		},
	}
	cmd.Flags().StringVar(&modelfilePath, "modelfile", "", "Path to write the Modelfile (default: $HOME/Modelfile)")
	cmd.Flags().StringVar(&modelName, "model-name", "daemon", "Name of the custom model (for reference)")
	cmd.Flags().StringVar(&baseModel, "base-model", "llama3.2:3b", "Base model in the Modelfile (FROM)")
	cmd.Flags().BoolVar(&lite, "lite", false, "Use llama3.2:1b for daemon-lite (faster inference for OpenClaw on low-power hardware)")
	return cmd
}

func newAliasCmd() *cobra.Command {
	var dryRun bool
	cmd := &cobra.Command{
		Use:   "alias",
		Short: "Add shell alias so you can run 'daemon' to start the bot",
		RunE: func(c *cobra.Command, args []string) error {
			return shell.AddAlias(c.OutOrStdout(), "daemon", "ollama run daemon", dryRun)
		},
	}
	cmd.Flags().BoolVar(&dryRun, "dry-run", false, "Print what would be appended without writing")
	return cmd
}

func newSetupCmd() *cobra.Command {
	var (
		yes           bool
		modelfilePath string
		modelName     string
		baseModel     string
		lite          bool
	)
	cmd := &cobra.Command{
		Use:   "setup",
		Short: "Run check, then init, then alias (full setup)",
		RunE: func(c *cobra.Command, args []string) error {
			name, base := modelName, baseModel
			if lite {
				name, base = "daemon-lite", "llama3.2:1b"
			}
			return runSetup(c.OutOrStdout(), c.ErrOrStderr(), yes, modelfilePath, name, base)
		},
	}
	cmd.Flags().BoolVar(&yes, "yes", false, "Skip confirmations")
	cmd.Flags().StringVar(&modelfilePath, "modelfile", "", "Path to write the Modelfile (default: $HOME/Modelfile)")
	cmd.Flags().StringVar(&modelName, "model-name", "daemon", "Name of the custom model to create")
	cmd.Flags().StringVar(&baseModel, "base-model", "llama3.2:3b", "Base model in the Modelfile (FROM)")
	cmd.Flags().BoolVar(&lite, "lite", false, "Use llama3.2:1b and create daemon-lite (faster inference for OpenClaw on low-power hardware)")
	return cmd
}

func newGuideCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "guide",
		Short: "Show full setup guide and workflow",
		RunE: func(cmd *cobra.Command, args []string) error {
			printGuide(cmd.OutOrStdout())
			return nil
		},
	}
}

func printGuide(w io.Writer) {
	fmt.Fprintln(w, "Daemon setup – full guide")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "daemon-setup configures the Daemon personal assistant bot on your PC: it checks")
	fmt.Fprintln(w, "prerequisites (Ollama and models), writes the Modelfile, creates the daemon model,")
	fmt.Fprintln(w, "and can add a shell alias so you can run 'daemon' to start the bot.")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "Supported platforms")
	fmt.Fprintln(w, "  • Windows (default — Beelink S13 Pro comes preloaded with Windows)")
	fmt.Fprintln(w, "  • Ubuntu Desktop 24.04 LTS (alternative — Desktop recommended over Server)")
	fmt.Fprintln(w, "  • macOS")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "Prerequisites")
	fmt.Fprintln(w, "  • Ollama installed and in PATH")
	fmt.Fprintln(w, "  • Base model pulled (e.g. llama3.2:3b, or llama3.2:1b for --lite)")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "Commands")
	fmt.Fprintln(w, "  check     Verify Ollama is installed and required models are available")
	fmt.Fprintln(w, "  init      Write the Modelfile and create the daemon model with ollama")
	fmt.Fprintln(w, "  modelfile Write the Modelfile only (no ollama create)")
	fmt.Fprintln(w, "  alias     Add shell alias so you can run 'daemon' to start the bot")
	fmt.Fprintln(w, "  setup     Run check, then init, then alias (full setup)")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "Typical workflow")
	fmt.Fprintln(w, "  1. daemon-setup check     # verify Ollama and models")
	fmt.Fprintln(w, "  2. daemon-setup init      # create the daemon model")
	if runtime.GOOS == "windows" {
		fmt.Fprintln(w, "  3. daemon-setup alias    # add 'daemon' function, then restart PowerShell or run . $PROFILE")
	} else {
		fmt.Fprintln(w, "  3. daemon-setup alias    # add 'daemon' alias, then source ~/.bashrc or ~/.zshrc")
	}
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "  Or one-shot:  daemon-setup setup --yes")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "  For OpenClaw on low-power hardware (e.g. N100), use the 1B model for faster inference:")
	fmt.Fprintln(w, "  ollama pull llama3.2:1b")
	fmt.Fprintln(w, "  daemon-setup init --lite   # creates daemon-lite; set OpenClaw default to ollama/daemon-lite")
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "Examples")
	if runtime.GOOS == "windows" {
		fmt.Fprintln(w, "  .\\daemon-setup check")
		fmt.Fprintln(w, "  .\\daemon-setup setup --yes")
	} else {
		fmt.Fprintln(w, "  daemon-setup check")
		fmt.Fprintln(w, "  daemon-setup setup --yes")
	}
	fmt.Fprintln(w, "")
	fmt.Fprintln(w, "For more details, see the README and docs/05-daemon-bot.md in the repo.")
}
