import { WorkflowNodeDef } from "../../core/type";
import ConfigComponent from "./Config.vue";
import icon from "~icons/mdi/tools";
import Component from "./View.vue";

export default <WorkflowNodeDef>{
    type: "McpToolsCall",
    component: Component,
    configComponent: ConfigComponent,

    title: "MCPTools调用",
    description: "调用MCP工具进行处理",
    icon,
    color: "#6366f1",

    inputFields: [],
    outputFields: [
        {
            type: "text",
            name: "Text",
        },
        {
            type: "file",
            name: "Image",
            fileExtensions: ["png", "jpg"],
        },
    ],
};
