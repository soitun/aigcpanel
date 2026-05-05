import { defineStore } from "pinia";
import store from "../index";
import {
    NodeProperties,
    NodeRunParam,
    NodeRunResult,
    NodeStatus,
    WorkflowData,
    WorkflowStatus,
} from "../../module/Workflow/core/type";
import { workflowCheck } from "../../module/Workflow/schedule/engine";
import { t } from "../../lang";
import {
    WorkflowLogRecord,
    WorkflowLogService,
} from "../../service/WorkflowService";
import { useTaskStore } from "./task";
import { TaskService } from "../../service/TaskService";
import { WorkflowRunParam } from "../../task/Workflow";

const taskStore = useTaskStore();

export type WorkflowChangeCallbacksType = {
    onNodeStatusChange?: (
        workflowId: number,
        workflowLogId: number,
        data: WorkflowData,
        nodeId: string,
        status: NodeStatus,
        statusMsg?: string,
    ) => void;
    onNodeDataChange?: (
        workflowId: number,
        workflowLogId: number,
        data: WorkflowData,
        nodeId: string,
        properties: Partial<{
            runInputs: NodeProperties["runInputs"];
            runOutputs: NodeProperties["runOutputs"];
            runData: NodeProperties["runData"];
            data: NodeProperties["data"];
        }>,
    ) => void;
    onNodeStart?: (
        workflowId: number,
        workflowLogId: number,
        data: WorkflowData,
        nodeId: string,
        param: NodeRunParam,
    ) => void;
    onNodeFinish?: (
        workflowId: number,
        workflowLogId: number,
        data: WorkflowData,
        nodeId: string,
        result: NodeRunResult,
    ) => void;
    onStatusChange?: (
        workflowId: number,
        workflowLogId: number,
        data: WorkflowData,
        status: WorkflowStatus,
        statusMsg?: string,
    ) => void;
    onFinish?: (
        workflowId: number,
        workflowLogId: number,
        data: WorkflowData,
        success: boolean,
        errors: string[],
        results: Map<string, NodeRunResult>,
    ) => void;
    onLog?: (
        workflowId: number,
        workflowLogId: number,
        data: WorkflowData,
        level: "info" | "warn" | "error",
        message: string,
    ) => void;
};

type WorkflowChangeType = keyof WorkflowChangeCallbacksType;

// 小工具：去掉前两个参数
type DropFirstTwo<T extends any[]> = T extends [any, any, ...infer R] ? R : [];

// 每个事件的参数（去掉 workflowId、workflowLogId）
type WorkflowChangeData<T extends WorkflowChangeType> = DropFirstTwo<
    Parameters<NonNullable<WorkflowChangeCallbacksType[T]>>
>;

const changeListeners = [] as {
    callbacks: Partial<WorkflowChangeCallbacksType>;
}[];

export const workflowStore = defineStore("workflow", {
    state: () => ({
        isReady: false,
    }),
    actions: {
        async init() {
            taskStore.onChange(null, async (bizId, type) => {
                console.log(`workflow.task.on.${type}`, { bizId });
                if ("success" === type) {
                    const task = await TaskService.get(bizId);
                    console.log(`workflow.task.on.${type}.task`, task);
                    if (task && task.status === "success") {
                        const log = await WorkflowLogService.getByPause(
                            "task",
                            bizId,
                        );
                        console.log(`workflow.task.on.${type}.log`, log);
                        if (log && log.status === "pause") {
                            this.submit(
                                log.workflowId,
                                log.id!,
                                log.data,
                            ).then();
                        }
                    }
                }
            });
            this.isReady = true;
        },
        async submit(
            workflowId: number,
            workflowLogId: number,
            data: WorkflowData,
            param?: {
                stopNodeId?: string;
            },
        ): Promise<WorkflowLogRecord> {
            const runParam: WorkflowRunParam = Object.assign(
                {
                    isContinue: false,
                    stopNodeId: undefined,
                },
                param,
            );
            if (!workflowLogId) {
                const { valid, errors } = await workflowCheck(data!);
                if (!valid) {
                    throw t("工作流校验失败: {msg}", { msg: errors.join(",") });
                }
                workflowLogId = await WorkflowLogService.insert({
                    workflowId,
                    data,
                    status: "idle",
                    startTime: Date.now(),
                    endTime: 0,
                });
            } else {
                runParam.isContinue = true;
                await WorkflowLogService.update(workflowLogId, {
                    data: data,
                    status: "idle",
                    startTime: Date.now(),
                    endTime: 0,
                });
            }
            window.$mapi.workflow.dispatch(workflowLogId + "", runParam).then();
            return (await WorkflowLogService.get(workflowLogId))!;
        },
        async cancel(workflowLogId: number) {
            const log = await WorkflowLogService.get(workflowLogId);
            if (!log) {
                throw t("工作流日志不存在");
            }
            if (log.status !== "running") {
                throw t("工作流日志状态不正确，无法取消");
            }
            // 找到正在运行的任务，也需要取消
            for (const node of log.data.nodes || []) {
                if (node.properties?.status === "running") {
                    if (node.properties?.runData?.taskId) {
                        const task = await TaskService.get(
                            node.properties?.runData?.taskId + "",
                        );
                        if (task && task.status === "running") {
                            taskStore.requestCancel(task.biz, task.id + "");
                        }
                    }
                }
            }
            taskStore.requestCancel("Workflow", workflowLogId + "");
        },
        onChange(callbacks: Partial<WorkflowChangeCallbacksType>) {
            changeListeners.push({ callbacks });
        },
        offChange(callbacks: Partial<WorkflowChangeCallbacksType>) {
            const index = changeListeners.findIndex(
                (v) => v.callbacks === callbacks,
            );
            changeListeners.splice(index, 1);
        },
        fireChange<T extends WorkflowChangeType>(
            workflowLog: WorkflowLogRecord,
            type: T,
            ...data: WorkflowChangeData<T> // 一定是元组
        ) {
            changeListeners.forEach((v) => {
                const fn = v.callbacks[type];
                if (fn) {
                    (fn as any)(
                        workflowLog.workflowId,
                        workflowLog.id,
                        ...data,
                    );
                }
            });
        },
    },
});

const ins = workflowStore(store);
ins.init().then();

export const useWorkflowStore = () => {
    return ins;
};
