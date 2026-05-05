import { WorkflowNodeDef } from "../../core/type";
import ConfigComponent from "./Config.vue";
import icon from "~icons/mdi/language-javascript";
import Component from "./View.vue";

export default <WorkflowNodeDef>{
    type: "JsRunner",
    component: Component,
    configComponent: ConfigComponent,

    title: "JS执行器",
    description: "执行JavaScript代码",
    icon,
    color: "#f59e0b",

    inputFields: [
        {
            type: "json",
            name: "Value",
        },
    ],
    outputFields: [
        {
            type: "json",
            name: "Value",
        },
    ],
};
