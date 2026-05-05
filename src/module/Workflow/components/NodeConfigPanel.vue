<template>
    <div
        v-if="visible"
        class="pb-node-config-panel absolute right-4 top-4 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-[1000] max-h-[calc(100%-2rem)] flex flex-col"
    >
        <div
            class="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg"
        >
            <div class="flex items-center gap-2 font-medium text-gray-900">
                <template v-if="nodeIcon">
                    <component
                        :is="typeof nodeIcon === 'string' ? 'img' : nodeIcon"
                        :src="
                            typeof nodeIcon === 'string' ? nodeIcon : undefined
                        "
                        class="w-5 h-5"
                    />
                </template>
                <icon-settings class="w-5 h-5" v-else />
                <div>
                    <div>{{ properties?.title || t("节点配置") }}</div>
                    <div class="text-gray-400" style="font-size: 8px">
                        <icon-tag />
                        {{ node?.id }}
                    </div>
                </div>
            </div>
            <a-button @click="onClose" size="mini" shape="circle">
                <template #icon>
                    <icon-close />
                </template>
            </a-button>
        </div>
        <div class="flex-1 overflow-y-auto text-left">
            <div
                v-if="
                    node?.type !== 'Start' &&
                    properties?.inputFields &&
                    properties?.inputFields.length
                "
                class="p-2"
            >
                <div class="font-bold pb-1 flex gap-1 items-center">
                    <svg
                        class="w-4 h-4"
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
                    {{ t("输入") }}
                </div>
                <div class="space-y-2">
                    <div
                        v-for="field in properties.inputFields"
                        :key="node!.id + '|' + field.name"
                        class="flex flex-col"
                    >
                        <div class="flex items-center text-xs mb-1 gap-1">
                            <FieldIcon :type="field.type" :field="field" />
                            <div class="flex-grow">{{ field.name }}</div>
                        </div>
                        <div
                            v-if="field.type === 'file'"
                            class="flex items-center space-x-2"
                        >
                            <TextVariableInput
                                class="flex-grow"
                                :model-value="field.value as string"
                                :placeholder="field.placeholder"
                                @change="onFieldValueChange(field, $event)"
                                :node-id="node?.id"
                            />
                            <a-button @click="doFileSelect(field)" size="small">
                                <template #icon>
                                    <icon-file />
                                </template>
                                选择
                            </a-button>
                        </div>
                        <div v-else-if="field.type === 'files'">
                            <TextsVariableInput
                                class="flex-grow"
                                :model-value="field.value as string[]"
                                :placeholder="field.placeholder"
                                @change="onFieldValueChange(field, $event)"
                                :node-id="node?.id"
                            />
                            <div class="mt-2">
                                <a-button
                                    @click="doFileSelect(field)"
                                    size="small"
                                >
                                    <template #icon>
                                        <icon-file />
                                    </template>
                                    选择
                                </a-button>
                            </div>
                        </div>
                        <a-select
                            size="small"
                            v-else-if="field.type === 'select'"
                            :model-value="field.value"
                            :placeholder="field.placeholder || '请选择'"
                            @change="onFieldValueChange(field, $event)"
                        >
                            <a-option
                                v-for="option in field.selectOptions"
                                :key="option"
                                :value="option"
                                :label="option"
                            />
                        </a-select>
                        <div v-else-if="field.type === 'json'">
                            <a-textarea
                                class="pb-input-textarea"
                                size="small"
                                :placeholder="field.placeholder"
                                :default-value="getFieldValue(field)"
                                @input="onFieldValueChange(field, $event)"
                                :textarea-attrs="{
                                    'data-input-name': field.name,
                                }"
                                :auto-size="{ minRows: 1, maxRows: 4 }"
                            />
                        </div>
                        <div v-else-if="field.type === 'textarea'">
                            <TextareaVariableInput
                                :model-value="field.value as string"
                                :placeholder="field.placeholder"
                                @change="onFieldValueChange(field, $event)"
                                :node-id="node?.id"
                            />
                        </div>
                        <div v-else>
                            <TextVariableInput
                                :model-value="field.value as string"
                                :placeholder="field.placeholder"
                                @change="onFieldValueChange(field, $event)"
                                :node-id="node?.id"
                            />
                        </div>
                        <div
                            v-if="fieldInputMsgMap[field.name]"
                            class="text-red-500 text-xs"
                        >
                            {{ fieldInputMsgMap[field.name] }}
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-2" v-if="configComponent || node?.type === 'Start'">
                <div
                    v-if="node?.type !== 'Start'"
                    class="font-bold pb-1 flex gap-1 items-center"
                >
                    <svg
                        class="w-4 h-4"
                        viewBox="0 0 1024 1024"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        p-id="996"
                        width="200"
                        height="200"
                    >
                        <path
                            d="M904.80517578 98.36474609H119.19482422C103.13555908 98.36474609 90.125 111.38354492 90.125 127.43457031v558.10272217c0 16.05102539 13.01055908 29.06982422 29.06982422 29.06982422h363.73535156v152.88024902H292.24597167c-16.05926513 0-29.06982422 13.01879883-29.0698242 29.06982422S276.18670654 925.63525391 292.24597167 925.63525391h439.50805666c16.05926513 0 29.06982422-13.01879883 29.0698242-29.06982422s-13.01055908-29.06982422-29.06982421-29.06982422H541.06982422V714.6071167h363.73535156c16.05926513 0 29.06982422-13.01879883 29.06982422-29.06982422V127.43457031C933.875 111.38354492 920.86444092 98.36474609 904.80517578 98.36474609z m-29.06982422 558.10272217H148.26464844V156.51263428h727.46246338v499.95483398z"
                            fill="#231815"
                            p-id="997"
                        ></path>
                        <path
                            d="M279.43316651 412.11779785v159.19189454c0 16.05102539 13.01055908 29.06982422 29.06982421 29.06982421s29.06982422-13.01879883 29.06982422-29.06982422v-159.19189452c23.33496094-10.96710205 39.60021973-34.51629638 39.60021973-62.00408937s-16.26525879-51.03698731-39.60021973-62.00408935v-46.43920898c0-16.05102539-13.01055908-29.06982422-29.06982422-29.06982422s-29.06982422 13.01879883-29.06982421 29.06982422v46.43096924c-23.33496094 10.96710205-39.60021973 34.51629638-39.60021974 62.00408935s16.25701904 51.04522705 39.60021974 62.01232911zM482.93017578 528.40533448v42.9043579c0 16.05102539 13.01055908 29.06982422 29.06982422 29.06982423s29.06982422-13.01879883 29.06982422-29.06982423v-42.90435791c23.33496094-10.96710205 39.60021973-34.51629638 39.60021973-62.00408936s-16.26525879-51.03698731-39.60021973-62.00408935v-162.73498535c0-16.05102539-13.01055908-29.06982422-29.06982422-29.06982422s-29.06982422 13.01879883-29.06982422 29.06982422V404.38891602c-23.33496094 10.96710205-39.60021973 34.51629638-39.60021973 62.00408935s16.25701904 51.04522705 39.60021973 62.01232911zM686.42718506 412.11779785v159.19189454c0 16.05102539 13.01055908 29.06982422 29.06982422 29.06982421 16.05926513 0 29.06982422-13.01879883 29.06982421-29.06982422v-159.19189452c23.33496094-10.96710205 39.60021973-34.51629638 39.60021974-62.00408937s-16.26525879-51.03698731-39.60021974-62.00408935v-46.43920898c0-16.05102539-13.01055908-29.06982422-29.06982421-29.06982422-16.05926513 0-29.06982422 13.01879883-29.06982422 29.06982422v46.43096924c-23.33496094 10.96710205-39.60021973 34.51629638-39.60021973 62.00408935s16.26525879 51.04522705 39.60021973 62.01232911z"
                            fill="#231815"
                            p-id="998"
                        ></path>
                    </svg>
                    {{ t("配置") }}
                </div>
                <div v-else class="font-bold pb-1 flex gap-1 items-center">
                    <icon-command />
                    {{ t("启动参数") }}
                </div>
                <div class="border rounded-lg">
                    <component
                        :ref="onConfigComponentMounted"
                        v-if="configComponent"
                        :is="configComponent"
                        :node="props.selectedNode"
                        :properties="properties || undefined"
                        @updateProperties="onUpdateProperties"
                    />
                </div>
            </div>
            <div
                v-if="
                    node?.type !== 'Start' &&
                    properties?.outputFields &&
                    properties?.outputFields.length
                "
                class="p-2"
            >
                <div class="font-bold pb-1 flex gap-1 items-center">
                    <svg
                        class="w-4 h-4"
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
                    {{ t("输出") }}
                </div>
                <div class="space-y-2">
                    <div
                        v-for="field in properties.outputFields"
                        :key="node!.id + '|' + field.name"
                        class="border mb-1 rounded-lg flex px-2 py-1 items-center"
                    >
                        <div
                            class="text-xs flex-grow font-mono cursor-pointer"
                            @click="
                                doCopy(
                                    '${' +
                                        properties?.title +
                                        '.' +
                                        field.name +
                                        '}',
                                )
                            "
                        >
                            {{
                                "${" +
                                properties?.title +
                                "." +
                                field.name +
                                "}"
                            }}
                        </div>
                        <FieldIcon :type="field.type" :field="field" />
                    </div>
                </div>
            </div>
            <div
                v-if="
                    properties?.status === 'success' &&
                    (properties?.runInputs || properties?.runOutputs)
                "
            >
                <NodeConfigPanelResult :properties="properties" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { EventType } from "@logicflow/core";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { doCopy, doOpenFile } from "../../../components/common/util";
import { t } from "../../../lang";
import { ObjectUtil } from "../../../lib/util";
import {
    getGraphModel,
    getNodePropertiesById,
    setNodePropertiesById,
} from "../core/global";
import { WorkflowNodeDefs } from "../core/node";
import { NodeField, NodeProperties } from "../core/type";
import { vueNodesMap } from "../registry";
import { FunctionCallNodes } from "../../../pages/Workflow/lib";
import FieldIcon from "./FieldIcon.vue";
import NodeConfigPanelResult from "./NodeConfigPanelResult.vue";
import TextVariableInput from "./TextVariableInput.vue";
import TextsVariableInput from "./TextsVariableInput.vue";
import TextareaVariableInput from "./TextareaVariableInput.vue";

const configComponent = computed(() => {
    const nodeType = node.value?.type;
    for (const wn of WorkflowNodeDefs) {
        if (wn.type === nodeType && wn.configComponent) {
            return wn.configComponent;
        }
    }
    return null;
});

const nodeIcon = computed(() => {
    if (!node.value) return null;
    const nodeType = node.value.type;
    if (nodeType === "FunctionCall") {
        const funcName = properties.value?.functionCallName;
        if (funcName) {
            const fc = FunctionCallNodes.find((f) => f.name === funcName);
            if (fc?.icon) return fc.icon;
        }
    }
    const wn = WorkflowNodeDefs.find((w) => w.type === nodeType);
    return wn?.icon || null;
});

const configComponentInstance = ref<InstanceType<any> | null>(null);

const props = defineProps<{
    selectedNode?: any;
}>();
const emit = defineEmits<{
    (e: "close"): void;
}>();

const fieldInputMsgMap = ref<Record<string, string>>({});

const visible = ref(false);
const node = ref<{
    id: string;
    type: string;
} | null>(null);
const properties = ref<NodeProperties | null>(null);
watch(
    () => props.selectedNode,
    (newNode) => {
        if (newNode) {
            visible.value = true;
            node.value = {
                id: newNode.id,
                type: newNode.type,
            };
            properties.value = ObjectUtil.clone(
                getNodePropertiesById(newNode.id) as any,
            );
        } else {
            visible.value = false;
            properties.value = null;
        }
    },
);

const watchProperties = (eventData: any) => {
    if (!node.value) {
        return;
    }
    if (eventData.id !== node.value.id) {
        return;
    }
    const content = vueNodesMap[node.value.type];
    if (content) {
        properties.value = ObjectUtil.clone(
            getNodePropertiesById(node.value.id) as any,
        );
    }
};

onMounted(() => {
    const graphModel = getGraphModel();
    if (graphModel) {
        graphModel.eventCenter.on(
            EventType.NODE_PROPERTIES_CHANGE,
            watchProperties,
        );
    }
});

onBeforeUnmount(() => {
    const graphModel = getGraphModel();
    if (graphModel) {
        graphModel.eventCenter.off(
            EventType.NODE_PROPERTIES_CHANGE,
            watchProperties,
        );
    }
});

const onConfigComponentMounted = (el: InstanceType<any> | null) => {
    configComponentInstance.value = el;
    if (el && el.onShow) {
        el.onShow().then();
    }
};

const onUpdateProperties = (newProperties: NodeProperties) => {
    setNodePropertiesById(node.value!.id, newProperties);
    setTimeout(() => {
        if (
            configComponentInstance.value &&
            configComponentInstance.value.onUpdate
        ) {
            configComponentInstance.value.onUpdate().then();
        }
    }, 100);
};

const changeFieldValue = (field: NodeField, value: any) => {
    field.value = value;
    if (properties.value) {
        onUpdateProperties(properties.value);
    }
};

const getFieldValue = (field: NodeField) => {
    if (field.type === "json") {
        // @RAW(${视频信息获取.Value})
        if (/^@RAW\(\s*\$\{.+\}\s*\)$/.test(field.value + "")) {
            return field.value + "";
        }
        return JSON.stringify(field.value);
    }
    return field.value + "";
};

const onFieldValueChange = (field: NodeField, value: NodeField["value"]) => {
    if (typeof value === "string") {
        value = value.trim();
    } else if (Array.isArray(value)) {
        value = value.map((v) => v.trim());
    }
    fieldInputMsgMap.value[field.name] = "";
    if (field.type === "json") {
        value = value + "";
        // @RAW(${视频信息获取.Value})
        if (/^@RAW\(\s*\$\{.+\}\s*\)$/.test(value)) {
            changeFieldValue(field, value);
            return;
        }
        try {
            const json = JSON.parse(value || "{}");
            changeFieldValue(field, json);
        } catch (e) {
            fieldInputMsgMap.value[field.name] = t("无效的 JSON 格式");
        }
        return;
    }
    if (field.type === "files") {
        changeFieldValue(field, value);
        return;
    }
    changeFieldValue(field, value);
};

const doFileSelect = async (field: NodeField) => {
    const result = await doOpenFile({
        extensions: field.fileExtensions || [],
        multiple: field.type === "files",
    });
    if (result) {
        if (field.type === "files") {
            changeFieldValue(field, [
                ...((field.value as string[]) || []),
                ...result,
            ]);
        } else {
            changeFieldValue(field, result);
        }
    }
};

const onClose = () => {
    emit("close");
};
</script>

<script lang="ts">
export default {
    name: "NodeConfigPanel",
};
</script>
<style lang="less" scoped>
.pb-node-config-panel {
    .pb-input-textarea {
        line-height: 14px;
    }

    :deep(.pb-input-textarea textarea) {
        font-size: 12px;
    }

    :deep(.arco-textarea-mirror) {
    }
}
</style>
