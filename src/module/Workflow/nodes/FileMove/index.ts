import { WorkflowNodeDef } from "../../core/type";
import ConfigComponent from "./Config.vue";
import icon from "~icons/mdi/file-move";
import Component from "./View.vue";

export default <WorkflowNodeDef>{
    type: "FileMove",
    component: Component,
    configComponent: ConfigComponent,

    title: "文件移动",
    description: "移动源文件到目标文件",
    icon,
    color: "#f59e0b",

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
