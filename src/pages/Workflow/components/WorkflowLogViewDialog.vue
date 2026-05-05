<script setup lang="ts">
import { computed, ref } from "vue";
import { TimeUtil } from "../../../lib/util";
import { WorkflowLogRecord } from "../../../service/WorkflowService";
import {
    getNodeStatusColor,
    getNodeStatusText,
} from "../../../module/Workflow/core/util";
import { doCopy, doSaveFile } from "../../../components/common/util";
import { t } from "../../../lang";
import FieldIcon from "../../../module/Workflow/components/FieldIcon.vue";
import NodeIcon from "../../../module/Workflow/components/NodeIcon.vue";
import FieldPreviewButton from "../../../module/Workflow/components/FieldPreviewButton.vue";

interface Props {
    record?: WorkflowLogRecord | null;
}

const props = defineProps<Props>();

const visible = ref(false);
const currentRecord = ref<WorkflowLogRecord | null>(null);

const displayRecord = computed(() => currentRecord.value || props.record);

const show = (record: WorkflowLogRecord) => {
    currentRecord.value = record;
    visible.value = true;
};

const getNodeInputs = (node: any) => {
    const runInputs = node.properties?.runInputs || {};
    return Object.keys(runInputs).map((key) => {
        return {
            key,
            field: node.properties?.inputFields?.find(
                (input: any) => input.name === key,
            ),
            value: runInputs[key],
        };
    });
};

const getNodeOutputs = (node: any) => {
    const runOutputs = node.properties?.runOutputs || {};
    return Object.keys(runOutputs).map((key) => {
        return {
            key,
            field: node.properties?.outputFields?.find(
                (output: any) => output.name === key,
            ),
            value: runOutputs[key],
        };
    });
};

const formatValue = (value: any) => {
    if (true === value) return "true";
    if (false === value) return "false";
    if (value === null || value === undefined) {
        return "null";
    }
    if (typeof value === "object") {
        return JSON.stringify(value, null, 2);
    }
    if ("" === value) {
        return t("空");
    }
    return String(value);
};

defineExpose({
    show,
});
</script>

<template>
    <a-modal
        v-model:visible="visible"
        width="80vw"
        :footer="false"
        title-align="start"
    >
        <template #title>
            <div class="flex items-center">
                <div class="font-bold mr-2">
                    {{ $t("执行结果详情") }}
                </div>
            </div>
        </template>
        <div style="height: calc(100vh - 12rem)" class="-m-4 overflow-auto">
            <div v-if="displayRecord" class="p-2">
                <div class="p-4 bg-gray-100 rounded-lg mb-6 font-bold text-lg">
                    {{ displayRecord.name || displayRecord.id }}
                </div>
                <div
                    class="grid grid-cols-4 gap-4 p-4 bg-gray-100 rounded-lg mb-6"
                >
                    <div>
                        <label
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >{{ $t("状态") }}</label
                        >
                        <a-tag
                            :color="getNodeStatusColor(displayRecord.status)"
                        >
                            {{ getNodeStatusText(displayRecord.status) }}
                        </a-tag>
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >{{ $t("开始时间") }}</label
                        >
                        <div class="text-sm">
                            {{ TimeUtil.format(displayRecord.startTime || 0) }}
                        </div>
                    </div>
                    <div v-if="displayRecord.endTime">
                        <label
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >{{ $t("结束时间") }}</label
                        >
                        <div class="text-sm">
                            {{ TimeUtil.format(displayRecord.endTime) }}
                        </div>
                    </div>
                    <div>
                        <label
                            class="block text-sm font-medium text-gray-700 mb-1"
                            >{{ $t("状态信息") }}</label
                        >
                        <div class="text-sm">
                            {{ displayRecord.statusMsg || "无" }}
                        </div>
                    </div>
                </div>

                <!-- 节点执行结果 -->
                <div v-if="displayRecord.data?.nodes" class="space-y-6">
                    <div
                        v-for="node in displayRecord.data.nodes"
                        :key="node.id"
                        class="bg-gray-100 rounded-lg p-4"
                    >
                        <div class="font-bold pb-3 flex items-center gap-1">
                            <NodeIcon :type="node.type" />
                            <span>{{ node.properties?.title || node.id }}</span>
                            <a-tag
                                size="small"
                                class="ml-2"
                                :color="
                                    getNodeStatusColor(
                                        node.properties?.status || 'idle',
                                    )
                                "
                            >
                                {{
                                    getNodeStatusText(
                                        node.properties?.status || "idle",
                                    )
                                }}
                            </a-tag>
                        </div>

                        <!-- 输入输出区域 -->
                        <div class="flex gap-6">
                            <!-- 输入 -->
                            <div
                                v-if="getNodeInputs(node).length"
                                class="flex-1 bg-white rounded-lg p-3 min-w-0"
                            >
                                <div
                                    class="font-medium text-sm mb-3 flex items-center"
                                >
                                    <svg
                                        class="w-4 h-4 mr-1"
                                        viewBox="0 0 1024 1024"
                                        version="1.1"
                                        xmlns="http://www.w3.org/2000/svg"
                                        p-id="965"
                                        width="200"
                                        height="200"
                                    >
                                        <path
                                            d="M156.04296875 274.6953125c-23.73046875 0-39.55078125-15.8203125-39.55078125-39.55078125v-39.55078125C116.4921875 152.08789062 152.08789062 116.4921875 195.59375 116.4921875h632.8125c43.50585938 0 79.1015625 35.59570313 79.1015625 79.1015625v632.8125c0 43.50585938-35.59570313 79.1015625-79.1015625 79.1015625H195.59375C152.08789062 907.5078125 116.4921875 871.91210938 116.4921875 828.40625v-39.55078125c0-23.73046875 15.8203125-39.55078125 39.55078125-39.55078125 23.73046875 0 39.55078125 15.8203125 39.55078125 39.55078125v39.55078125h632.8125V195.59375H195.59375v39.55078125c0 23.73046875-15.8203125 39.55078125-39.55078125 39.55078125zM512 512c0-3.95507813 0-11.86523438-3.95507813-15.8203125 0-3.95507813-3.95507813-7.91015625-7.91015624-11.86523438L389.39257812 373.57226562a38.21594239 38.21594239 0 0 0-55.37109374 1e-8c-15.8203125 15.8203125-15.8203125 39.55078125 0 55.37109375l43.50585937 43.50585937H156.04296875c-23.73046875 0-39.55078125 15.8203125-39.55078125 39.55078125 0 23.73046875 15.8203125 39.55078125 39.55078125 39.55078125h221.484375l-43.50585938 43.50585938c-15.8203125 15.8203125-15.8203125 39.55078125 0 55.37109375 15.8203125 15.8203125 39.55078125 15.8203125 55.37109375 0l110.74218751-110.74218751c3.95507813-3.95507813 7.91015625-7.91015625 7.91015625-11.86523437C512 523.86523438 512 515.95507813 512 512z"
                                        ></path>
                                    </svg>
                                    {{ $t("输入") }}
                                </div>
                                <div class="space-y-3">
                                    <div
                                        v-for="item in getNodeInputs(node)"
                                        :key="item.key"
                                        class="bg-white rounded-lg p-3 border"
                                    >
                                        <div
                                            class="flex items-center justify-between mb-2"
                                        >
                                            <div
                                                class="flex items-center gap-1"
                                            >
                                                <FieldIcon
                                                    :type="item.field?.type"
                                                    :field="item.field"
                                                />
                                                <div class="text-sm">
                                                    {{ item.key }}
                                                </div>
                                            </div>
                                            <div class="flex space-x-1">
                                                <a-button
                                                    @click="doCopy(item.value)"
                                                    size="mini"
                                                    shape="circle"
                                                >
                                                    <template #icon>
                                                        <icon-copy />
                                                    </template>
                                                </a-button>
                                                <a-button
                                                    @click="
                                                        doSaveFile(item.value)
                                                    "
                                                    size="mini"
                                                    shape="circle"
                                                >
                                                    <template #icon>
                                                        <icon-download />
                                                    </template>
                                                </a-button>
                                                <FieldPreviewButton
                                                    v-if="item.field"
                                                    :value="item.value"
                                                    :field="item.field"
                                                />
                                            </div>
                                        </div>
                                        <div
                                            class="text-xs text-gray-600 bg-gray-100 p-2 rounded break-all"
                                        >
                                            {{ formatValue(item.value) }}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 输出 -->
                            <div
                                v-if="getNodeOutputs(node).length"
                                class="flex-1 bg-white rounded-lg p-3 min-w-0"
                            >
                                <div
                                    class="font-medium text-sm mb-3 flex items-center"
                                >
                                    <svg
                                        class="w-4 h-4 mr-1"
                                        viewBox="0 0 1024 1024"
                                        version="1.1"
                                        xmlns="http://www.w3.org/2000/svg"
                                        p-id="1116"
                                        width="200"
                                        height="200"
                                    >
                                        <path
                                            d="M867.95703125 749.3046875c23.73046875 0 39.55078125 15.8203125 39.55078125 39.55078125v39.55078125c0 43.50585938-35.59570313 79.1015625-79.1015625 79.1015625H195.59375C152.08789062 907.5078125 116.4921875 871.91210938 116.4921875 828.40625V195.59375C116.4921875 152.08789062 152.08789062 116.4921875 195.59375 116.4921875h632.8125c43.50585938 0 79.1015625 35.59570313 79.1015625 79.1015625v39.55078125c0 23.73046875-15.8203125 39.55078125-39.55078125 39.55078125-23.73046875 0-39.55078125-15.8203125-39.55078125-39.55078125v-39.55078125H195.59375v632.8125h632.8125v-39.55078125c0-23.73046875 15.8203125-39.55078125 39.55078125-39.55078125zM907.5078125 512c0-3.95507813 0-11.86523438-3.95507813-15.8203125 0-3.95507813-3.95507813-7.91015625-7.91015624-11.86523438L784.90039063 373.57226562a38.21594239 38.21594239 0 0 0-55.37109376 1e-8c-15.8203125 15.8203125-15.8203125 39.55078125 0 55.37109375l43.50585938 43.50585937H551.55078125c-23.73046875 0-39.55078125 15.8203125-39.55078125 39.55078125 0 23.73046875 15.8203125 39.55078125 39.55078125 39.55078125h221.484375l-43.50585938 43.50585938c-15.8203125 15.8203125-15.8203125 39.55078125 0 55.37109375 15.8203125 15.8203125 39.55078125 15.8203125 55.37109375 0l110.74218751-110.74218751c3.95507813-3.95507813 7.91015625-7.91015625 7.91015625-11.86523437 3.95507813-3.95507813 3.95507813-11.86523438 3.95507812-15.8203125z"
                                        ></path>
                                    </svg>
                                    {{ $t("输出") }}
                                </div>
                                <div class="space-y-3">
                                    <div
                                        v-for="item in getNodeOutputs(node)"
                                        :key="item.key"
                                        class="bg-white rounded-lg p-3 border"
                                    >
                                        <div
                                            class="flex items-center justify-between mb-2"
                                        >
                                            <div
                                                class="flex items-center gap-1"
                                            >
                                                <FieldIcon
                                                    :type="item.field?.type"
                                                    :field="item.field"
                                                />
                                                <div class="text-sm">
                                                    {{ item.key }}
                                                </div>
                                            </div>
                                            <div class="flex space-x-1">
                                                <a-button
                                                    @click="doCopy(item.value)"
                                                    size="mini"
                                                    shape="circle"
                                                >
                                                    <template #icon>
                                                        <icon-copy />
                                                    </template>
                                                </a-button>
                                                <a-button
                                                    @click="
                                                        doSaveFile(item.value)
                                                    "
                                                    size="mini"
                                                    shape="circle"
                                                >
                                                    <template #icon>
                                                        <icon-download />
                                                    </template>
                                                </a-button>
                                                <FieldPreviewButton
                                                    v-if="item.field"
                                                    :value="item.value"
                                                    :field="item.field"
                                                />
                                            </div>
                                        </div>
                                        <div
                                            class="text-xs text-gray-600 bg-gray-100 p-2 rounded break-all"
                                        >
                                            {{ formatValue(item.value) }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="text-center text-gray-500 py-8">
                    {{ $t("无节点执行数据") }}
                </div>
            </div>
        </div>
    </a-modal>
</template>
