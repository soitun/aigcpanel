import {
    NodeRunController,
    NodeRunParam,
    NodeRunResult,
    WorkflowSchedule,
} from "../../core/type";
import { FileUtil } from "../../../../lib/file";

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
        const from_ = param.runInputs["From"];
        const to_ = param.runInputs["To"];
        if (!from_) {
            result.statusMsg = "源文件未配置";
            return result;
        }
        if (!to_) {
            result.statusMsg = "目标文件未配置";
            return result;
        }
        try {
            const overwrite = param.node.properties?.data?.overwrite ?? false;
            // console.log('FileMove.Run', {from_, to_, overwrite});
            let targetPath = to_;
            if (!overwrite) {
                let exists = await $mapi.file.exists(targetPath);
                let counter = 1;
                // console.log('FileMove.Run', 'check exists', {targetPath, exists});
                while (exists) {
                    const ext = await $mapi.file.ext(targetPath);
                    const base = to_.substring(0, to_.length - ext.length - 1);
                    targetPath = `${base}_${counter}.${ext}`;
                    exists = await $mapi.file.exists(targetPath);
                    counter++;
                }
            }
            await $mapi.file.rename(from_, targetPath, {
                overwrite: true,
            });
            result.runOutputs["Value"] = targetPath;
            result.statusMsg = "移动成功";
            result.status = "success";
        } catch (e) {
            result.statusMsg = "移动错误: " + e;
        }
        return result;
    },
    async check(node) {
        // No specific check needed
        return;
    },
};
