import { WorkflowNodeDef } from "./type";

export const WorkflowNodeDefs: WorkflowNodeDef[] = [];

const nodes: any = import.meta.glob("./../nodes/**/index.ts", { eager: true });
for (const path in nodes) {
    const module = (nodes as any)[path];
    if (module && module.default) {
        WorkflowNodeDefs.push(module.default);
    }
}
