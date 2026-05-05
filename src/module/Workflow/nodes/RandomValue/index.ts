import { WorkflowNodeDef } from "../../core/type";
import ConfigComponent from "./Config.vue";
import icon from "~icons/mdi/dice-multiple";
import Component from "./View.vue";

export default <WorkflowNodeDef>{
    type: "RandomValue",
    component: Component,
    configComponent: ConfigComponent,

    title: "随机值",
    description: "生成随机值输出",
    icon,
    color: "#d946ef",

    inputFields: [],
    outputFields: [
        {
            type: "text",
            name: "Value",
        },
    ],
};
