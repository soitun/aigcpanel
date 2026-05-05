import { WorkflowNodeDef } from "../../core/type";
import ConfigComponent from "./Config.vue";
import icon from "~icons/mdi/brain";
import Component from "./View.vue";

export default <WorkflowNodeDef>{
    type: "LLM",
    component: Component,
    configComponent: ConfigComponent,

    title: "大模型",
    description: "调用大模型生成文本",
    icon,
    color: "#ec4899",

    inputFields: [
        {
            name: "Prompt",
            type: "textarea",
        },
    ],
    outputFields: [
        {
            name: "Text",
            type: "text",
        },
        {
            name: "Json",
            type: "json",
        },
    ],
};
