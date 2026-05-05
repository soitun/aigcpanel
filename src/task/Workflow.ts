import { TaskBiz } from "../store/modules/task";
import { workflowExecute } from "../module/Workflow/schedule/engine";
import {
    WorkflowLogService,
    WorkflowService,
} from "../service/WorkflowService";
import { t } from "../lang";
import { useWorkflowStore } from "../store/modules/workflow";
import { TaskRecord } from "../service/TaskService";
import { FfmpegJobResultType } from "../pages/Apps/Ffmpeg/type";
import { throttle } from "lodash-es";

const workflowStore = useWorkflowStore();

export type WorkflowRunParam = {
    isContinue?: boolean;
    stopNodeId?: string;
};

export const WorkflowCleaner = async (task: TaskRecord) => {
    const files: string[] = [];
    const jobResult: FfmpegJobResultType = task.jobResult;
    return {
        files,
    };
};

const workFlowExecuteMap: Record<
    string,
    Awaited<ReturnType<typeof workflowExecute>>
> = {};

export const Workflow: TaskBiz = {
    runFunc: async (bizId, bizParam: WorkflowRunParam) => {
        const { isContinue, stopNodeId } = bizParam;
        const workflowLog = await WorkflowLogService.get(bizId);
        if (!workflowLog) {
            throw t("工作流日志记录不存在");
        }
        if (workflowLog.status !== "idle") {
            throw t("工作流日志记录状态错误，当前状态为 {status}", {
                status: workflowLog.status,
            });
        }
        const sync = throttle(
            async () => {
                // console.log('sync workflow log', workflowLog.id, workflowLog.status, workflowLog.data);
                await WorkflowLogService.update(workflowLog.id!, {
                    pauseByType: workflowLog.pauseByType || "",
                    pauseById: workflowLog.pauseById || "",
                    data: workflowLog.data,
                    status: workflowLog.status,
                    statusMsg: workflowLog.statusMsg,
                    startTime: workflowLog.startTime,
                    endTime: workflowLog.endTime,
                });
                // update the workflow if the log is the latest one
                const latestLog =
                    await WorkflowLogService.getLatestByWorkflowId(
                        workflowLog.workflowId,
                    );
                if (latestLog && latestLog.id === workflowLog.id) {
                    await WorkflowService.update(workflowLog.workflowId, {
                        data: workflowLog.data,
                    });
                }
            },
            1000,
            {
                trailing: true,
            },
        );
        const res = workflowExecute(workflowLog.data, {
            isContinue,
            stopNodeId,
            onNodeStatusChange: (data, nodeId, status, statusMsg) => {
                workflowStore.fireChange(
                    workflowLog,
                    "onNodeStatusChange",
                    data,
                    nodeId,
                    status,
                    statusMsg,
                );
                if (status === "success_ignore") {
                    status = "success";
                }
                workflowLog.status = status;
                workflowLog.statusMsg = statusMsg;
                sync();
            },
            onNodeDataChange: (data, nodeId, properties) => {
                workflowStore.fireChange(
                    workflowLog,
                    "onNodeDataChange",
                    data,
                    nodeId,
                    properties,
                );
                workflowLog.data.nodes.forEach((node) => {
                    if (node.id === nodeId) {
                        Object.assign(node.properties, properties);
                    }
                });
                sync();
            },
            onNodeStart: (data, nodeId, param) => {
                workflowStore.fireChange(
                    workflowLog,
                    "onNodeStart",
                    data,
                    nodeId,
                    param,
                );
                workflowLog.status = "running";
                workflowLog.statusMsg = "";
                sync();
            },
            onNodeFinish: (data, nodeId, result) => {
                workflowStore.fireChange(
                    workflowLog,
                    "onNodeFinish",
                    data,
                    nodeId,
                    result,
                );
                workflowLog.data.nodes.forEach((node) => {
                    if (node.id === nodeId) {
                        if (result.runOutputs) {
                            node.properties.runOutputs = result.runOutputs;
                        }
                        if (result.runData) {
                            node.properties.runData = result.runData;
                        }
                    }
                });
                if (result.pauseByType && result.pauseById) {
                    workflowLog.pauseByType = result.pauseByType;
                    workflowLog.pauseById = result.pauseById;
                }
                sync();
            },
            onStatusChange: (data, status, statusMsg) => {
                workflowStore.fireChange(
                    workflowLog,
                    "onStatusChange",
                    data,
                    status,
                    statusMsg,
                );
                workflowLog.status = status;
                workflowLog.statusMsg = statusMsg;
                sync();
            },
            onFinish: (data, success, errors, results) => {
                workflowStore.fireChange(
                    workflowLog,
                    "onFinish",
                    data,
                    success,
                    errors,
                    results,
                );
                workflowLog.endTime = Date.now();
                workflowLog.status = data.status;
                workflowLog.statusMsg =
                    errors.length > 0 ? errors.join(", ") : t("执行完成");
                sync();
            },
            onLog: (data, msg, level) => {
                workflowStore.fireChange(
                    workflowLog,
                    "onLog",
                    data,
                    msg,
                    level,
                );
            },
        });
        workFlowExecuteMap[bizId] = res;
        const result = await res.result();
        delete workFlowExecuteMap[bizId];
        return "success";
    },
    successFunc: async (bizId, bizParam) => {
        delete workFlowExecuteMap[bizId];
    },
    failFunc: async (bizId, msg, bizParam) => {
        delete workFlowExecuteMap[bizId];
    },
    requestCancelFunc: async (bizId: string, bizParam: any) => {
        if (workFlowExecuteMap[bizId]) {
            workFlowExecuteMap[bizId].cancel();
        }
    },
};
