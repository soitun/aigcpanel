import { WorkflowNodeDef } from "../../core/type";
import ConfigComponent from "./Config.vue";
import icon from "~icons/mdi/file-multiple";
import Component from "./View.vue";

export default <WorkflowNodeDef>{
    type: "FileList",
    component: Component,
    // configComponent: ConfigComponent,

    title: "文件列表",
    description: "列出文件夹中的所有文件",
    icon,
    color: "#3b82f6",

    inputFields: [
        {
            type: "text",
            name: "Path",
        },
    ],
    outputFields: [
        {
            type: "files",
            name: "Files",
        },
    ],
};
