import { WorkflowNodeDef } from "../../core/type";
import ConfigComponent from "./Config.vue";
import icon from "~icons/mdi/source-branch";
import Component from "./View.vue";

export default <WorkflowNodeDef>{
    type: "IfElse",
    component: Component,
    configComponent: ConfigComponent,

    title: "条件判断",
    description: "if else 条件判断",
    icon,
    color: "#f43f5e",

    inputFields: [],
    outputFields: [],
};
