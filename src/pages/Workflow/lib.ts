import { NodeFunctionCall } from "../../module/Workflow/core/type";

const nodes: any = import.meta.glob("./../Apps/*/workflow/node.ts", {
    eager: true,
});
export const FunctionCallNodes: NodeFunctionCall[] = [];
for (const path in nodes) {
    const mod = nodes[path] as any;
    if (mod.default) {
        // @ts-ignore
        FunctionCallNodes.push(mod.default);
    }
}
