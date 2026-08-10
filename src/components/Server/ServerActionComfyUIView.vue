<script setup lang="ts">
import { ref, watch } from "vue";
import { useServerStore } from "../../store/modules/server";
import { EnumServerStatus, ServerRecord } from "../../types/Server";

const serverStore = useServerStore();

const props = defineProps<{
    record: ServerRecord;
}>();

const isComfyUI = () => {
    return (props.record as any)?.config?.type === "comfyui";
};

const doView = async () => {
    if (!isComfyUI()) {
        return;
    }
    const record = props.record;
    const serverInfo = await serverStore.serverInfo(record);
    // 获取服务运行地址（通过 config 接口获取 httpUrl）
    const configRes = await $mapi.server.config(serverInfo);
    const httpUrl = configRes?.data?.httpUrl;
    if (!httpUrl) {
        // 兜底：尝试从日志提取或使用默认端口提示
        console.log("comfyui-view: no httpUrl", configRes);
        return;
    }
    await $mapi.app.windowOpen("comfyui-view", {
        url: httpUrl,
        title: `${props.record.title} - ComfyUI`,
    });
};
</script>

<template>
    <a-tooltip
        v-if="isComfyUI()"
        :content="$t('model.comfyuiView') || '查看'"
        mini
    >
        <a-button
            class="mr-2"
            type="primary"
            status="normal"
            :disabled="record.status !== EnumServerStatus.RUNNING"
            @click="doView()"
        >
            <template #icon>
                <icon-eye />
            </template>
        </a-button>
    </a-tooltip>
</template>
