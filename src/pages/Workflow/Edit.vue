<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import InputInlineEditor from "../../components/common/InputInlineEditor.vue";
import { t } from "../../lang";
import { Dialog } from "../../lib/dialog";
import { WorkflowStatus } from "../../module/Workflow/core/type";
import { workflowCheck } from "../../module/Workflow/schedule/engine";
import WorkflowEditor from "../../module/Workflow/WorkflowEditor.vue";
import {
    WorkflowLogRecord,
    WorkflowLogService,
    WorkflowService,
} from "../../service/WorkflowService";
import {
    useWorkflowStore,
    WorkflowChangeCallbacksType,
} from "../../store/modules/workflow";
import WorkflowLogDialog from "./components/WorkflowLogDialog.vue";
import WorkflowLogViewDialog from "./components/WorkflowLogViewDialog.vue";

const workflowStore = useWorkflowStore();

const route = useRoute();

const workflowLogDialog = ref<InstanceType<typeof WorkflowLogDialog> | null>(
    null,
);
const workflowLogViewDialog = ref<InstanceType<
    typeof WorkflowLogViewDialog
> | null>(null);

const workflowEditor = ref<InstanceType<typeof WorkflowEditor> | null>(null);

const workflow = ref<{
    id: string;
    name: string;
    data: any;
}>({
    id: "",
    name: "",
    data: null,
});
const workflowLog = ref<WorkflowLogRecord | null>(null);
const hasUnSuccessNode = ref(false);
const needSave = ref(false);
const isRunning = ref(false);
const currentWorkflowStatus = ref<WorkflowStatus | "canceling">("idle");
const executionProgress = ref<{
    current: number;
    total: number;
    currentNode?: string;
}>({ current: 0, total: 0 });

const save = async () => {
    const data = workflowEditor.value?.getData();
    const update = {
        name: workflow.value.name,
        data: data!,
    };
    if (!workflow.value.id) {
        const id = await WorkflowService.insert(update);
        workflow.value.id = id.toString();
    } else {
        await WorkflowService.update(workflow.value.id, update);
    }
};

const doSave = async () => {
    await save();
    needSave.value = false;
    Dialog.tipSuccess(t("保存成功"));
};

const onWorkflowChange = async () => {
    needSave.value = true;
    const map = await workflowEditor.value?.getNodeStatusCount();
    hasUnSuccessNode.value = map!.success !== (map!.total || 0);
};

const doCancel = async () => {
    if (!workflowLog.value?.id) {
        Dialog.tipError(t("当前没有运行中的工作流"));
        return;
    }
    if (currentWorkflowStatus.value === "canceling") {
        Dialog.tipError(t("工作流取消请求已发送，请勿重复操作"));
        return;
    }
    currentWorkflowStatus.value = "canceling";
    workflowStore.cancel(workflowLog.value.id).then();
    Dialog.tipSuccess(t("工作流取消请求已发送，请稍后"));
};

const doRunToNode = async (nodeId: string) => {
    await doRun(true, nodeId);
};

const doRun = async (
    isContinue: boolean = false,
    stopNodeId: string | undefined = undefined,
) => {
    // 并发控制：如果正在运行，阻止重复执行
    if (isRunning.value) {
        Dialog.tipError(t("工作流正在执行中，请等待完成"));
        return;
    }
    // 如果当前状态是暂停或错误，且不是明确指定继续，则执行全新运行
    if (
        (currentWorkflowStatus.value === "pause" ||
            currentWorkflowStatus.value === "error" ||
            currentWorkflowStatus.value === "canceling") &&
        !isContinue
    ) {
        isContinue = false;
    }
    try {
        // 设置运行状态
        isRunning.value = true;
        await save();
        needSave.value = false;
        const data = workflowEditor.value?.getData();
        // 校验工作流
        const { valid, errors } = await workflowCheck(data!);
        if (!valid) {
            Dialog.tipError(
                t("工作流校验失败: {msg}", { msg: errors.join(",") }),
            );
            isRunning.value = false;
            return;
        }
        // 初始化进度
        const totalNodes = data!.nodes.length;
        executionProgress.value = { current: 0, total: totalNodes };
        // 提交任务
        if (!isContinue) {
            workflowLog.value = null;
        }
        workflowLog.value = await workflowStore.submit(
            parseInt(workflow.value.id),
            workflowLog.value?.id || 0,
            data!,
            { stopNodeId },
        );
        currentWorkflowStatus.value = "running";
    } catch (error) {
        // 处理执行过程中的错误
        isRunning.value = false;
        executionProgress.value = { current: 0, total: 0 };
        currentWorkflowStatus.value = "error";
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        Dialog.tipError(t("工作流执行失败: {msg}", { msg: errorMessage }));
    }
};
const isCurrentWorkflowLog = (workflowId, workflowLogId) => {
    return (
        "" + workflow.value.id === "" + workflowId &&
        "" + workflowLog.value?.id === "" + workflowLogId
    );
};
const workflowChangeCallback: Partial<WorkflowChangeCallbacksType> = {
    onNodeStatusChange: (
        workflowId,
        workflowLogId,
        data,
        nodeId,
        status,
        statusMsg,
    ) => {
        if (!isCurrentWorkflowLog(workflowId, workflowLogId)) {
            return;
        }
        console.log(
            "[onNodeStatusChange]",
            workflowId,
            workflowLogId,
            nodeId,
            status,
            statusMsg,
        );
        workflowEditor.value!.setNodeProperties(nodeId, {
            status: status,
            statusMsg: statusMsg,
        });
        if (status === "success" || status === "error") {
            executionProgress.value.current += 1;
            const node = data.nodes.find((n) => n.id === nodeId);
            executionProgress.value.currentNode = node?.properties.title;
        } else if (status === "idle") {
            workflowEditor.value!.setNodeProperties(nodeId, {
                runInputs: {},
                runOutputs: {},
                runData: {},
            });
        }
    },
    onNodeDataChange: (workflowId, workflowLogId, data, nodeId, properties) => {
        if (!isCurrentWorkflowLog(workflowId, workflowLogId)) {
            return;
        }
        console.log(
            "[onNodeDataChange]",
            workflowId,
            workflowLogId,
            nodeId,
            properties,
        );
        workflowEditor.value!.setNodeProperties(nodeId, {
            ...properties,
        });
    },
    onNodeStart: (workflowId, workflowLogId, data, nodeId, param) => {
        if (!isCurrentWorkflowLog(workflowId, workflowLogId)) {
            return;
        }
        console.log("[onNodeStart]", workflowId, workflowLogId, nodeId, param);
        workflowEditor.value!.setNodeProperties(nodeId, {
            runInputs: param.runInputs,
        });
        const node = data.nodes.find((n) => n.id === nodeId);
        executionProgress.value.currentNode = node?.properties.title;
    },
    onNodeFinish: (workflowId, workflowLogId, data, nodeId, result) => {
        if (!isCurrentWorkflowLog(workflowId, workflowLogId)) {
            return;
        }
        console.log(
            "[onNodeFinish]",
            workflowId,
            workflowLogId,
            nodeId,
            result,
        );
        workflowEditor.value!.setNodeProperties(nodeId, {
            runOutputs: result.runOutputs,
            runData: result.runData,
        });
        // if (result.pauseByType && result.pauseById) {
        //     WorkflowLogService.update(workflowLog.value!.id!, {
        //         pauseByType: result.pauseByType,
        //         pauseById: result.pauseById,
        //     });
        // }
    },
    onStatusChange: (workflowId, workflowLogId, data, status, statusMsg) => {
        if (!isCurrentWorkflowLog(workflowId, workflowLogId)) {
            return;
        }
        console.log(
            "[onStatusChange]",
            workflowId,
            workflowLogId,
            status,
            statusMsg,
        );
        currentWorkflowStatus.value = status;
        isRunning.value = status === "running";
    },
    onFinish: (workflowId, workflowLogId, data, success, errors, results) => {
        if (!isCurrentWorkflowLog(workflowId, workflowLogId)) {
            return;
        }
        console.log(
            "[onFinish]",
            workflowId,
            workflowLogId,
            success,
            errors,
            results,
        );
        // 清理超时
        if (workflowLog.value?.id) {
            // 显示执行结果
            if (success) {
                Dialog.tipSuccess(t("工作流执行完成"));
            } else {
                Dialog.alertError(
                    t("工作流执行失败") + ":" + errors?.join(";") || "",
                );
            }
        }
        // 重置状态
        isRunning.value = false;
        executionProgress.value = { current: 0, total: 0 };
    },
    onLog: (workflowId, workflowLogId, data, level, msg) => {
        if (!isCurrentWorkflowLog(workflowId, workflowLogId)) {
            return;
        }
        console.log("[onLog]", workflowId, workflowLogId, `[${level}]`, msg);
    },
};

const onEditTitle = (newTitle: string) => {
    workflow.value.name = newTitle;
    save();
    needSave.value = false;
};

const showHistory = () => {
    if (workflow.value.id) {
        workflowLogDialog.value?.show();
    }
};

const doShowResult = async () => {
    if (!workflowLog.value?.id || !workflow.value.id) {
        Dialog.tipError(t("当前没有运行记录"));
        return;
    }
    try {
        const logRecords = await WorkflowLogService.listByWorkflowId(
            parseInt(workflow.value.id),
        );
        const logRecord = logRecords.find(
            (record) => record.id === workflowLog.value?.id,
        );
        if (logRecord) {
            workflowLog.value = logRecord;
            workflowLogViewDialog.value?.show(logRecord);
        } else {
            Dialog.tipError(t("未找到运行记录"));
        }
    } catch (error) {
        Dialog.tipError(t("获取运行记录失败") + ": " + error);
    }
};

const doNewResult = () => {
    workflowLog.value = null;
    currentWorkflowStatus.value = "idle";
    isRunning.value = false;
    executionProgress.value = { current: 0, total: 0 };
    workflowEditor.value?.clearRunData();
    Dialog.tipSuccess(t("已清除当前运行记录"));
};

const setWorkflowLog = (log: WorkflowLogRecord) => {
    workflowLog.value = log;
    const statusMap: Record<
        string,
        "idle" | "running" | "pause" | "success" | "error"
    > = {
        running: "running",
        success: "success",
        error: "error",
        pause: "pause",
    };
    currentWorkflowStatus.value = statusMap[log.status] || "idle";
    workflowEditor.value?.setData(log.data);
};

const doLoad = async (id: string) => {
    const record = await WorkflowService.get(id);
    if (record) {
        workflow.value.id = id;
        workflow.value.name = record.name;
        workflow.value.data = record.data;
        const latestLog = await WorkflowLogService.getLatestByWorkflowId(
            parseInt(id),
        );
        if (latestLog) {
            setWorkflowLog(latestLog);
        } else {
            workflowEditor.value?.setData(record.data);
        }
        needSave.value = false;
    }
};

const onLoadLog = async (workflowLogId: number) => {
    const logRecord = await WorkflowLogService.get(workflowLogId);
    if (!logRecord) {
        Dialog.tipError("未找到运行记录");
        return;
    }
    if (logRecord.workflowId + "" !== workflow.value?.id + "") {
        Dialog.tipError("只能加载当前工作流的运行记录");
        return;
    }
    setWorkflowLog(logRecord);
};

const canContinue = computed(() => {
    if (!workflowLog.value?.id) {
        return false;
    }
    if (["idle", "pause", "error"].includes(currentWorkflowStatus.value)) {
        return true;
    }
    if (currentWorkflowStatus.value === "success" && hasUnSuccessNode.value) {
        return true;
    }
    return false;
});

onMounted(() => {
    const id = route.params.id as string;
    if (id === "new") {
        workflow.value.id = "";
        workflow.value.name = "新建工作流";
        workflow.value.data = null;
        currentWorkflowStatus.value = "idle";
        needSave.value = false;
    } else {
        doLoad(id);
    }
    workflowStore.onChange(workflowChangeCallback);
});
onUnmounted(() => {
    workflowStore.offChange(workflowChangeCallback);
});
</script>

<template>
    <div class="bg-white p-8 h-full overflow-hidden relative select-none">
        <div class="mb-4 flex items-center">
            <div>
                <a-button @click="$router.back()" class="mr-2">
                    <template #icon>
                        <icon-arrow-left />
                    </template>
                </a-button>
            </div>
            <div class="text-xl font-bold flex items-center mr-5">
                <div class="mr-2 text-gray-400">#{{ workflow.id }}</div>
                <div class="mr-2">
                    {{ workflow.name }}
                </div>
                <InputInlineEditor :value="workflow.name" @change="onEditTitle">
                    <a class="ml-1 text-lg text-gray-400" href="javascript:;">
                        <icon-pen />
                    </a>
                </InputInlineEditor>
            </div>
            <div class="flex items-center flex-grow text-left space-x-2">
                <div
                    v-if="isRunning"
                    class="flex-grow flex items-center space-x-2 mr-4"
                >
                    <a-progress
                        type="circle"
                        :percent="
                            (executionProgress.current /
                                executionProgress.total) *
                            100
                        "
                        :width="16"
                        :stroke-width="1"
                        status="success"
                    />
                    <div
                        class="text-xs text-gray-600 truncate flex items-center gap-2"
                    >
                        <div>
                            {{ $t("执行中") }}:
                            {{ executionProgress.currentNode || $t("准备中") }}
                        </div>
                        <div>
                            {{ executionProgress.current }}/{{
                                executionProgress.total
                            }}
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <a-button-group>
                    <a-button
                        v-if="canContinue"
                        size="small"
                        @click="doRun(false)"
                        type="primary"
                        status="success"
                    >
                        <template #icon>
                            <icon-refresh />
                        </template>
                        {{ $t("重新运行") }}
                    </a-button>
                    <a-button
                        v-else-if="!isRunning"
                        size="small"
                        @click="doRun(false)"
                        type="primary"
                        status="success"
                    >
                        <template #icon>
                            <icon-play-arrow />
                        </template>
                        {{ workflowLog?.id ? $t("重新运行") : $t("运行") }}
                    </a-button>
                    <a-button
                        v-else
                        size="small"
                        :disabled="currentWorkflowStatus === 'canceling'"
                        @click="doCancel"
                        type="primary"
                        status="danger"
                    >
                        <template #icon>
                            <icon-pause />
                        </template>
                        {{ $t("取消") }}
                    </a-button>
                    <a-button
                        size="small"
                        v-if="canContinue"
                        @click="doRun(true)"
                        type="primary"
                        status="warning"
                    >
                        <template #icon>
                            <icon-play-circle />
                        </template>
                        {{ $t("继续运行") }}
                        #{{ workflowLog?.seqId || "-" }}
                    </a-button>
                    <a-button
                        size="small"
                        @click="doShowResult"
                        :disabled="!workflowLog?.id"
                    >
                        <template #icon>
                            <icon-file />
                        </template>
                        <span v-if="workflowLog?.seqId">
                            {{ $t("结果") }}
                            #{{ workflowLog?.seqId || "-" }}
                        </span>
                        <span v-else>
                            {{ $t("没有运行") }}
                        </span>
                    </a-button>
                    <a-button
                        size="small"
                        v-if="!!workflowLog?.id"
                        @click="doNewResult"
                    >
                        <template #icon>
                            <icon-close />
                        </template>
                    </a-button>
                </a-button-group>
                <a-button v-if="workflow.id" size="small" @click="showHistory">
                    <template #icon>
                        <icon-history />
                    </template>
                    {{ $t("运行记录") }}
                </a-button>
                <a-button
                    size="small"
                    @click="doSave"
                    type="primary"
                    :disabled="!needSave"
                >
                    <template #icon>
                        <icon-save />
                    </template>
                    {{ $t("保存") }}
                </a-button>
            </div>
        </div>
        <div
            class="border border-gray-200 rounded-lg overflow-hidden h-[calc(100vh-9rem)]"
        >
            <WorkflowEditor
                ref="workflowEditor"
                @change="onWorkflowChange"
                @run-to-node="doRunToNode"
            />
        </div>
    </div>
    <WorkflowLogDialog
        ref="workflowLogDialog"
        :workflow-id="workflow.id"
        @on-load-log="onLoadLog"
    />
    <WorkflowLogViewDialog ref="workflowLogViewDialog" :record="workflowLog" />
</template>
