import {
    NodeRunController,
    NodeRunParam,
    NodeRunResult,
    WorkflowSchedule,
} from "../../core/type";
import { useModelStore } from "../../../Model/store/model";
import { t } from "../../../../lang";

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
        const prompt = param.runInputs["Prompt"] || "";
        if (!prompt) {
            result.statusMsg = "Prompt不能为空";
            return result;
        }
        const model = param.node.properties.data?.model || "";
        const [providerId, modelId] = model.split("|");
        if (!providerId || !modelId) {
            result.statusMsg = "模型格式错误，应为 providerId|modelId";
            return result;
        }
        const format = param.node.properties.data?.format || "text";
        const modelStore = useModelStore();

        const ret = await modelStore.chat(providerId, modelId, prompt);
        if (!ret) {
            result.statusMsg = "调用模型失败";
            return result;
        }
        if (ret.code !== 0) {
            result.statusMsg = ret.msg || "调用模型失败";
            return result;
        }
        result.runOutputs["Text"] = ret.data!.content;
        result.runOutputs["Json"] = {};
        let content = result.runOutputs["Text"];
        if (format === "json" && content) {
            content = content.trim();
            // ```json xxx ``` replace
            if (/^```json/.test(content)) {
                content = content
                    .replace(/^```json/, "")
                    .replace(/```$/, "")
                    .trim();
            } else if (/^```/.test(content)) {
                content = content
                    .replace(/^```/, "")
                    .replace(/```$/, "")
                    .trim();
            }
            try {
                result.runOutputs["Json"] = JSON.parse(content);
            } catch (e) {
                result.statusMsg = t("解析返回数据失败") + ":" + content;
                return result;
            }
        }
        result.status = "success";
        return result;
    },
    async check(node) {
        if (!node.properties.data) {
            throw new Error("节点数据未配置");
        }
        const data = node.properties.data;
        if (!data.model) {
            throw new Error("模型未配置");
        }
        if (!data.format) {
            throw new Error("Prompt模板未配置");
        }
    },
};
