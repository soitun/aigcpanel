package cmd

import (
	"fmt"
	"os"
	"strings"
	"time"

	"aigcpanel-cli/internal"

	"github.com/spf13/cobra"
)

var modelCallCmd = &cobra.Command{
	Use:   "model_call",
	Short: "Call an AI model function",
	Long: `Call an AI model function and wait for the result.

Usage:
  aigcpanel model_call --model <name> --version <version> --function <funcName> [--key value ...]

The --model, --version and --function flags are required.
All other --key value pairs are passed as the param object to the model.
Params can also use the --param-key prefix to avoid collision with reserved flags.

Examples:
  aigcpanel model_call --model CosyVoice --version 1.0.0 --function soundTts --text "Hello world"
  aigcpanel model_call --model server-demo --version 1.0.0 --function soundClone --text "测试" --promptAudio /path/to/audio.wav
  aigcpanel model_call --model server-demo --version 1.0.0 --function textToImage --param-prompt "A landscape"`,
	DisableFlagParsing: true,
	RunE: func(cmd *cobra.Command, args []string) error {
		modelName, modelVersion, function, param, helpRequested, err := parseModelCallArgs(args)
		if err != nil {
			return err
		}
		if helpRequested {
			return cmd.Help()
		}
		if modelName == "" {
			return fmt.Errorf("--model is required")
		}
		if modelVersion == "" {
			return fmt.Errorf("--version is required")
		}
		if function == "" {
			return fmt.Errorf("--function is required")
		}

		model := modelName + "|" + modelVersion

		cfg, err := internal.LoadAuthConfig()
		if err != nil {
			return err
		}

		callResult, err := internal.DoRequest(cfg, "/api/model/call", map[string]any{
			"model":    model,
			"function": function,
			"param":    param,
		})
		if err != nil {
			return err
		}

		code, _ := callResult["code"].(float64)
		if code != 0 {
			return internal.PrintJSON(callResult)
		}

		dataMap, _ := callResult["data"].(map[string]any)
		taskId, _ := dataMap["taskId"].(string)
		if taskId == "" {
			return fmt.Errorf("no taskId returned from model call")
		}

		// Poll for result
		deadline := time.Now().Add(120 * time.Second)
		for time.Now().Before(deadline) {
			queryResult, err := internal.DoRequest(cfg, "/api/model/query", map[string]any{
				"taskId": taskId,
			})
			if err != nil {
				return err
			}
			qCode, _ := queryResult["code"].(float64)
			if qCode != 0 {
				return internal.PrintJSON(queryResult)
			}
			qData, _ := queryResult["data"].(map[string]any)
			status, _ := qData["status"].(string)
			switch status {
			case "success":
				return internal.PrintJSON(queryResult)
			case "error":
				return internal.PrintJSON(queryResult)
			case "pending":
				time.Sleep(500 * time.Millisecond)
				continue
			default:
				time.Sleep(500 * time.Millisecond)
				continue
			}
		}
		return internal.PrintJSON(map[string]any{
			"code": -1,
			"msg":  "timeout waiting for model result",
		})
	},
}

// parseModelCallArgs manually parses --key value style arguments.
// Reserved flags: --model (name), --version (version), --function (func name).
// --param-key value is equivalent to --key value (prefix stripped).
// All other --key value pairs become param entries.
func parseModelCallArgs(args []string) (modelName, modelVersion, function string, param map[string]any, helpRequested bool, err error) {
	param = map[string]any{}
	i := 0
	for i < len(args) {
		arg := args[i]
		if arg == "--help" || arg == "-h" {
			return "", "", "", nil, true, nil
		}
		if !strings.HasPrefix(arg, "--") {
			i++
			continue
		}
		key := strings.TrimPrefix(arg, "--")
		if i+1 >= len(args) || strings.HasPrefix(args[i+1], "--") {
			fmt.Fprintf(os.Stderr, "warning: flag --%s has no value, ignoring\n", key)
			i++
			continue
		}
		value := args[i+1]
		i += 2
		switch key {
		case "model":
			modelName = value
		case "version":
			modelVersion = value
		case "function":
			function = value
		default:
			// Strip optional --param- prefix
			paramKey := strings.TrimPrefix(key, "param-")
			param[paramKey] = value
		}
	}
	return modelName, modelVersion, function, param, false, nil
}

