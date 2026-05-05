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
        const folder = param.runInputs["Path"];
        if (!folder) {
            result.statusMsg = "文件夹未配置";
            return result;
        }
        try {
            const files = await $mapi.file.list(folder);
            const excludes = [".DS_Store"];
            const filePaths = files
                .filter((f) => {
                    // filter .DS_Store
                    return !excludes.includes(f.name);
                })
                .map((f) => f.pathname);
            result.runOutputs["Files"] = filePaths;
            result.statusMsg = `找到 ${filePaths.length} 个文件`;
            result.status = "success";
        } catch (e) {
            result.statusMsg = "列出文件错误: " + e;
        }
        return result;
    },
    async check(node) {
        // No specific check needed
    },
};
