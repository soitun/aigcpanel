package cmd

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"aigcpanel-cli/internal"

	"github.com/spf13/cobra"
)

var modelCallCmd = &cobra.Command{
	Use:   "model_call",
	Short: "Call a model function and wait for result",
	Long: `Call an installed AI model function and poll until completion.

Usage:
  aigcpanel model_call --model <name|version> --function <func> [--key value ...]
  aigcpanel model_call --model <name> --version <ver> --function <func> [--key value ...]

Flags:
  --model      Model server key, format name|version (or use --name/--version)
  --name       Model server name
  --version    Model server version
  --function   Function name (e.g. soundTts, soundClone, videoGen, asr,
               textToImage, imageToImage, textToVideo, imageToVideo)
  --timeout    Poll timeout in seconds (default 300)

For long/array parameter values, use --key-json /path/to/file.json.
All other --key value pairs become the function param object.

Examples:
  aigcpanel model_call --model server-demo|1.1.0 --function soundTts --text "你好"
  aigcpanel model_call --model server-demo|1.1.0 --function asr --audio /path/to/a.wav
  aigcpanel model_call --model server-demo|1.1.0 --function imageToVideo --images '["/a.png","/b.png"]' --prompt "run"`,
	DisableFlagParsing: true,
	RunE: func(cmd *cobra.Command, args []string) error {
		modelKey, modelName, modelVersion, function, param, timeoutSec, helpRequested, err := parseModelCallArgs(args)
		if err != nil {
			return err
		}
		if helpRequested {
			return cmd.Help()
		}
		if function == "" {
			return fmt.Errorf("--function is required")
		}
		if modelKey == "" && (modelName == "" || modelVersion == "") {
			return fmt.Errorf("--model is required (format name|version) or --name plus --version")
		}

		cfg, err := internal.LoadAuthConfig()
		if err != nil {
			return err
		}

		// Build the /api/model/call body. When modelKey contains "|" it is
		// passed as-is; otherwise split into model + version fields.
		var body map[string]any
		if modelKey != "" && strings.Contains(modelKey, "|") {
			body = map[string]any{
				"model":    modelKey,
				"function": function,
				"param":    param,
			}
		} else {
			body = map[string]any{
				"model":    modelName,
				"version":  modelVersion,
				"function": function,
				"param":    param,
			}
		}

		callResult, err := internal.DoRequest(cfg, "/api/model/call", body)
		if err != nil {
			return err
		}
		code, _ := callResult["code"].(float64)
		if code != 0 {
			internal.PrintJSON(callResult)
			return fmt.Errorf("model call failed: %v", callResult["msg"])
		}
		dataMap, _ := callResult["data"].(map[string]any)
		taskId, _ := dataMap["taskId"].(string)
		if taskId == "" {
			return fmt.Errorf("no taskId returned from model call")
		}
		fmt.Fprintf(os.Stderr, "taskId=%s (polling up to %ds)\n", taskId, timeoutSec)

		return internal.PollModelTask(cfg, taskId, time.Duration(timeoutSec)*time.Second)
	},
}

// parseModelCallArgs parses --model/--name/--version/--function/--timeout
// and distributes every other --key value pair into the param object.
func parseModelCallArgs(args []string) (modelKey, modelName, modelVersion, function string, param map[string]any, timeoutSec int, helpRequested bool, err error) {
	param = map[string]any{}
	timeoutSec = 300

	type kv struct{ key, value string }
	var pairs []kv
	i := 0
	for i < len(args) {
		arg := args[i]
		if arg == "--help" || arg == "-h" {
			return "", "", "", "", nil, 0, true, nil
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
			modelKey = value
		case "name":
			modelName = value
		case "version":
			modelVersion = value
		case "function":
			function = value
		case "timeout":
			var n int
			if _, scanErr := fmt.Sscanf(value, "%d", &n); scanErr == nil && n > 0 {
				timeoutSec = n
			} else {
				fmt.Fprintf(os.Stderr, "warning: invalid --timeout %q, using %d\n", value, timeoutSec)
			}
		default:
			pairs = append(pairs, kv{key, value})
		}
	}

	// Distribute remaining pairs into the param object
	for _, p := range pairs {
		key, value := p.key, p.value

		// JSON file flag: --key-json /path/to/file.json
		if strings.HasSuffix(key, "-json") {
			realKey := strings.TrimSuffix(key, "-json")
			fileBytes, readErr := os.ReadFile(value)
			if readErr != nil {
				err = fmt.Errorf("cannot read JSON file for --%s: %w", key, readErr)
				return
			}
			var parsed any
			if jsonErr := json.Unmarshal(fileBytes, &parsed); jsonErr != nil {
				err = fmt.Errorf("invalid JSON in file for --%s: %w", key, jsonErr)
				return
			}
			param[realKey] = parsed
			continue
		}

		// Auto-parse JSON arrays/objects
		trimmed := strings.TrimSpace(value)
		var parsedValue any
		if (strings.HasPrefix(trimmed, "[") && strings.HasSuffix(trimmed, "]")) ||
			(strings.HasPrefix(trimmed, "{") && strings.HasSuffix(trimmed, "}")) {
			var parsed any
			if jsonErr := json.Unmarshal([]byte(trimmed), &parsed); jsonErr == nil {
				parsedValue = parsed
			} else {
				parsedValue = value
			}
		} else {
			parsedValue = value
		}
		param[key] = parsedValue
	}
	return modelKey, modelName, modelVersion, function, param, timeoutSec, false, nil
}
