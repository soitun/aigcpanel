import { WorkflowNodeDef } from "../../core/type";
import ConfigComponent from "./Config.vue";
import icon from "~icons/mdi/function-variant";
import Component from "./View.vue";

export default <WorkflowNodeDef>{
    type: "FunctionCall",
    component: Component,
    configComponent: ConfigComponent,

    title: "",
    description: "调用自定义函数",
    icon,
    color: "#8b5cf6",

    inputFields: [],
    outputFields: [],
};
