import { WorkflowNodeDef } from "../../core/type";
import ConfigComponent from "./Config.vue";
import icon from "~icons/mdi/play-circle-outline";
import Component from "./View.vue";

export default <WorkflowNodeDef>{
    type: "Start",
    component: Component,
    configComponent: ConfigComponent,

    title: "",
    description: "工作流的起始节点，用于初始化流程",
    icon,
    color: "#22c55e",

    inputFields: [],
    outputFields: [],
};
