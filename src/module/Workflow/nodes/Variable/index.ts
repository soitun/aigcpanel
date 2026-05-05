import { WorkflowNodeDef } from "../../core/type";
import ConfigComponent from "./Config.vue";
import icon from "~icons/mdi/variable";
import Component from "./View.vue";

export default <WorkflowNodeDef>{
    type: "Variable",
    component: Component,
    configComponent: ConfigComponent,

    title: "变量设置",
    description: "修改变量对象的属性值，使用 x.x 格式的路径",
    icon,
    color: "#14b8a6",

    inputFields: [],
    outputFields: [],
};
