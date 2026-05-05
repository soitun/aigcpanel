<script setup lang="ts">
import { debounce } from "lodash-es";
import { ref, watch } from "vue";
import { t } from "../../../../lang";
import { NodeField, NodeProperties } from "../../core/type";

const visible = ref(false);

const presets = [{ label: "FocusAny", url: "http://127.0.0.1:61000/mcp" }];

const props = defineProps<{
    properties: NodeProperties;
}>();
const emit = defineEmits<{
    update: [val: any];
}>();

const onUpdate = (val: any) => {
    emit("update", { ...val });
};
const tools = ref<any[]>([]);
const loading = ref(false);
const serverError = ref<string | null>(null);

const doFetchTools = debounce(async () => {
    if (!props.properties?.data?.serverUrl) {
        return;
    }
    loading.value = true;
    serverError.value = null;
    try {
        const res = await window.$mapi.misc.request({
            url: props.properties?.data?.serverUrl,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            data: {
                jsonrpc: "2.0",
                id: 1,
                method: "tools/list",
                params: {},
            },
        });
        if (res.result && res.result.tools) {
            tools.value = res.result.tools;
        } else {
            serverError.value = "获取失败: 无效的响应";
        }
    } catch (error) {
        serverError.value =
            "获取失败" + (error instanceof Error ? ": " + error.message : "");
    } finally {
        loading.value = false;
    }
}, 500);
watch(() => props.properties?.data?.serverUrl, doFetchTools, {
    immediate: true,
});

const onSelectTool = (value: string) => {
    const inputFields: NodeField[] = [];
    const tool = tools.value.find((t) => t.name === value);
    if (tool && tool.inputSchema?.properties) {
        for (const [key, prop] of Object.entries(tool.inputSchema.properties)) {
            let type = "text";
            if ((prop as any).type === "object") {
                type = "json";
            }
            inputFields.push({
                type: type as any,
                name: key,
            });
        }
    }
    onUpdate({
        data: { ...(props.properties?.data || {}), selectedTool: value },
        inputFields,
    });
};
defineExpose({
    show: () => {
        visible.value = true;
    },
});
</script>

<template>
    <a-modal v-model:visible="visible" title="配置" width="600px">
        <div class="">
            <a-form :model="{}" layout="vertical">
                <a-form-item :label="t('MCP服务器地址')">
                    <a-input
                        :model-value="props.properties?.data?.serverUrl"
                        @input="
                            onUpdate({
                                data: {
                                    ...(props.properties?.data || {}),
                                    serverUrl: $event,
                                },
                            })
                        "
                        size="small"
                        :placeholder="t('输入MCP服务器URL')"
                    />
                    <template #help>
                        <a-select
                            size="small"
                            placeholder="选择预设"
                            @change="
                                (val) =>
                                    onUpdate({
                                        data: {
                                            ...(props.properties?.data || {}),
                                            serverUrl:
                                                presets.find(
                                                    (p) => p.label === val,
                                                )?.url || '',
                                        },
                                    })
                            "
                            style="margin-bottom: 8px"
                        >
                            <a-option
                                v-for="preset in presets"
                                :key="preset.label"
                                :value="preset.label"
                            >
                                {{ preset.label }}
                            </a-option>
                        </a-select>
                    </template>
                </a-form-item>
                <a-form-item label="Tools">
                    <div v-if="loading" class="text-xs">
                        <a-spin />
                        {{ t("加载工具列表...") }}
                    </div>
                    <div v-else-if="serverError" class="text-xs">
                        <icon-info-circle class="text-red-500 mr-1" />
                        {{ serverError }}
                    </div>
                    <a-select
                        v-else
                        size="small"
                        :model-value="props.properties?.data?.selectedTool"
                        @change="onSelectTool"
                        :placeholder="t('选择工具')"
                    >
                        <a-option
                            v-for="tool in tools"
                            :key="tool.name"
                            :value="tool.name"
                        >
                            {{ tool.name }} - {{ tool.description }}
                        </a-option>
                    </a-select>
                </a-form-item>
            </a-form>
        </div>
    </a-modal>
</template>
