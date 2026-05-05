import {
    NodeRunController,
    NodeRunParam,
    NodeRunResult,
    WorkflowSchedule,
} from "../../core/type";

export default <WorkflowSchedule>{
    async run(
        controller: NodeRunController,
        param: NodeRunParam,
    ): Promise<NodeRunResult> {
        const result: NodeRunResult = {
            status: "error",
            statusMsg: "未知错误",
            runOutputs: {},
            runData: {},
        };
        const { serverUrl, selectedTool } = param.node.properties.data || {};
        if (!serverUrl || !selectedTool) {
            result.statusMsg = "MCP服务器地址或工具未配置";
            return result;
        }
        const args = {};
        for (const field of param.node.properties.inputFields || []) {
            args[field.name] = param.runInputs[field.name] || {};
        }
        const res = await $mapi.misc.request({
            method: "POST",
            url: serverUrl,
            headers: {
                "Content-Type": "application/json",
            },
            data: {
                jsonrpc: "2.0",
                id: 1,
                method: "tools/call",
                params: {
                    name: selectedTool,
                    arguments: args,
                },
            },
        });
        // console.log('McpToolCall.res', {
        //     serverUrl,
        //     selectedTool,
        //     args,
        //     res,
        //     inputs: param.runInputs
        // });
        const content = res.result?.content || [];
        let textOutput = "";
        let imageOutput = "";

        function detectImageType(base64: string): string {
            const bytes = Buffer.from(base64, "base64").subarray(0, 4);
            if (
                bytes[0] === 0x89 &&
                bytes[1] === 0x50 &&
                bytes[2] === 0x4e &&
                bytes[3] === 0x47
            ) {
                return "png";
            }
            if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
                return "jpeg";
            }
            if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
                return "gif";
            }
            return "jpg";
        }

        for (const item of content) {
            if (item.type === "text") {
                textOutput += item.text;
            } else if (item.type === "image") {
                imageOutput = item.data;
                // check base64 format
                if (imageOutput && imageOutput.match(/^[a-zA-Z0-9+/=]+\s*$/)) {
                    const temp = await $mapi.file.temp(
                        detectImageType(imageOutput),
                    );
                    const data = Buffer.from(imageOutput as string, "base64");
                    await $mapi.file.writeBuffer(temp, data, {
                        isDataPath: false,
                    });
                    imageOutput = await $mapi.file.hubSave(temp);
                }
            }
        }
        result.runOutputs["Text"] = textOutput;
        result.runOutputs["Image"] = imageOutput;
        result.statusMsg = "执行成功";
        result.status = "success";
        return result;
    },
    async check(node) {
        const { serverUrl, selectedTool } = node.properties.data || {};
        if (!serverUrl || !selectedTool) {
            throw "MCP服务器地址或工具未配置";
        }
    },
};
