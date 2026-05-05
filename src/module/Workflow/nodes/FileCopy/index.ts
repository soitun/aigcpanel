import { WorkflowNodeDef } from "../../core/type";
import ConfigComponent from "./Config.vue";
import icon from "~icons/mdi/content-copy";
import Component from "./View.vue";

export default <WorkflowNodeDef>{
    type: "FileCopy",
    component: Component,
    configComponent: ConfigComponent,

    title: "文件复制",
    description: "复制源文件到目标文件",
    icon,
    color: "#10b981",

    inputFields: [
        {
            type: "file",
            name: "From",
        },
        {
            type: "file",
            name: "To",
        },
    ],
    outputFields: [
        {
            type: "file",
            name: "Value",
        },
    ],
};
