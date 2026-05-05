import { WorkflowNodeDef } from "../../core/type";
import ConfigComponent from "./Config.vue";
import icon from "~icons/mdi/regex";
import Component from "./View.vue";

export default <WorkflowNodeDef>{
    type: "RegexExtract",
    component: Component,
    configComponent: ConfigComponent,

    title: "正则提取",
    description: "使用正则表达式从输入文本中提取匹配的内容",
    icon,
    color: "#0ea5e9",

    inputFields: [
        {
            type: "text",
            name: "Value",
        },
    ],
    outputFields: [
        {
            type: "text",
            name: "Value",
        },
    ],
};
