package main

import (
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/niiyeboah/daemon-bot/internal/modelfile"
	"github.com/niiyeboah/daemon-bot/internal/ollama"
	"github.com/niiyeboah/daemon-bot/internal/shell"

	"github.com/spf13/cobra"
)

func main() {
	root := &cobra.Command{
		Use:   "daemon-setup",
		Short: "Setup the Daemon personal assistant bot (Ollama + Modelfile)",
		Long:  "Daemon-setup helps you configure the Daemon bot on your PC: check prerequisites, write the Modelfile, create the daemon model, and optionally add a shell alias.",
	}
	root.CompletionOptions.DisableDefaultCmd = true

	root.AddCommand(newCheckCmd())
	root.AddCommand(newInitCmd())
	root.AddCommand(newModelfileCmd())
	root.AddCommand(newAliasCmd())
	root.AddCommand(newSetupCmd())

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
	if err := ollama.Check(stdout, false); err != nil {
		// If only daemon is missing, we can continue; if ollama or base model missing, stop
		if !isOnlyDaemonMissing(err) {
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

func isOnlyDaemonMissing(err error) bool {
	return err != nil && (err.Error() == "daemon model not found" || fmt.Sprintf("%v", err) == "daemon model not found")
}

func newCheckCmd() *cobra.Command {
	var skipAPI bool
	cmd := &cobra.Command{
		Use:   "check",
		Short: "Verify Ollama is installed and required models are available",
		RunE: func(cmd *cobra.Command, args []string) error {
			return ollama.Check(cmd.OutOrStdout(), skipAPI)
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
	)
	cmd := &cobra.Command{
		Use:   "init",
		Short: "Write the Modelfile and create the daemon model with ollama",
		RunE: func(c *cobra.Command, args []string) error {
			return runInit(c.OutOrStdout(), c.ErrOrStderr(), modelfilePath, modelName, baseModel)
		},
	}
	cmd.Flags().StringVar(&modelfilePath, "modelfile", "", "Path to write the Modelfile (default: $HOME/Modelfile)")
	cmd.Flags().StringVar(&modelName, "model-name", "daemon", "Name of the custom model to create")
	cmd.Flags().StringVar(&baseModel, "base-model", "llama3.2:3b", "Base model in the Modelfile (FROM)")
	return cmd
}

func newModelfileCmd() *cobra.Command {
	var (
		modelfilePath string
		modelName     string
		baseModel     string
	)
	cmd := &cobra.Command{
		Use:   "modelfile",
		Short: "Write the Modelfile only (no ollama create)",
		RunE: func(c *cobra.Command, args []string) error {
			return runModelfile(c.OutOrStdout(), modelfilePath, modelName, baseModel)
		},
	}
	cmd.Flags().StringVar(&modelfilePath, "modelfile", "", "Path to write the Modelfile (default: $HOME/Modelfile)")
	cmd.Flags().StringVar(&modelName, "model-name", "daemon", "Name of the custom model (for reference)")
	cmd.Flags().StringVar(&baseModel, "base-model", "llama3.2:3b", "Base model in the Modelfile (FROM)")
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
	)
	cmd := &cobra.Command{
		Use:   "setup",
		Short: "Run check, then init, then alias (full setup)",
		RunE: func(c *cobra.Command, args []string) error {
			return runSetup(c.OutOrStdout(), c.ErrOrStderr(), yes, modelfilePath, modelName, baseModel)
		},
	}
	cmd.Flags().BoolVar(&yes, "yes", false, "Skip confirmations")
	cmd.Flags().StringVar(&modelfilePath, "modelfile", "", "Path to write the Modelfile (default: $HOME/Modelfile)")
	cmd.Flags().StringVar(&modelName, "model-name", "daemon", "Name of the custom model to create")
	cmd.Flags().StringVar(&baseModel, "base-model", "llama3.2:3b", "Base model in the Modelfile (FROM)")
	return cmd
}
