package cmd

import (
	"aigcpanel-cli/internal"

	"github.com/spf13/cobra"
)

var modelListCmd = &cobra.Command{
	Use:   "model_list",
	Short: "List installed AI models",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := internal.LoadAuthConfig()
		if err != nil {
			return err
		}
		result, err := internal.DoRequest(cfg, "/api/model/list", map[string]any{})
		if err != nil {
			return err
		}
		return internal.PrintJSON(result)
	},
}
