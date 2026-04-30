<script setup lang="ts">
import { onMounted, ref } from "vue";

const serverStatus = ref<{ running: boolean; port: number }>({
    running: false,
    port: 59999,
});
const port = ref(59999);
const enabled = ref(true);
const loading = ref(false);

onMounted(async () => {
    await loadStatus();
    port.value = await $mapi.httpserver.getPort();
    enabled.value = await $mapi.httpserver.getEnabled();
});

const loadStatus = async () => {
    serverStatus.value = await $mapi.httpserver.status();
};

const doStart = async () => {
    loading.value = true;
    await $mapi.httpserver.setPort(port.value);
    const ret = await $mapi.httpserver.start(port.value);
    await loadStatus();
    loading.value = false;
    if (ret.code !== 0) {
        $mapi.app.toast(ret.msg || "启动失败", { status: "error" });
    }
};

const doStop = async () => {
    loading.value = true;
    await $mapi.httpserver.stop();
    await loadStatus();
    loading.value = false;
};

const onPortChange = async (value: number) => {
    port.value = value;
};

const onPortBlur = async () => {
    await $mapi.httpserver.setPort(port.value);
};

const onEnabledChange = async (value: boolean) => {
    enabled.value = value;
    await $mapi.httpserver.setEnabled(value);
};

const doOpenDoc = async () => {
    await $mapi.app.openExternal(
        `http://localhost:${serverStatus.value.port}/doc`,
    );
};
</script>

<template>
    <a-form :model="{}" layout="vertical">
        <a-form-item label="自动启动">
            <a-switch :model-value="enabled" @change="onEnabledChange" />
            <span class="text-sm text-gray-500 ml-2"
                >应用启动时自动开启 HTTP 接口服务</span
            >
        </a-form-item>
        <a-form-item label="监听端口">
            <div class="flex items-center gap-3">
                <a-input-number
                    :model-value="port"
                    :min="1024"
                    :max="65535"
                    style="width: 160px"
                    @change="onPortChange"
                    @blur="onPortBlur"
                />
                <a-button
                    v-if="!serverStatus.running"
                    type="primary"
                    :loading="loading"
                    @click="doStart"
                >
                    启动服务
                </a-button>
                <a-button
                    v-else
                    status="danger"
                    :loading="loading"
                    @click="doStop"
                >
                    停止服务
                </a-button>
                <a-button
                    v-if="serverStatus.running"
                    type="outline"
                    @click="doOpenDoc"
                >
                    接口文档
                </a-button>
                <span class="flex items-center gap-1 text-sm">
                    <span
                        class="inline-block w-2 h-2 rounded-full"
                        :class="
                            serverStatus.running
                                ? 'bg-green-500'
                                : 'bg-gray-400'
                        "
                    ></span>
                    <span
                        :class="
                            serverStatus.running
                                ? 'text-green-600'
                                : 'text-gray-500'
                        "
                    >
                        {{
                            serverStatus.running
                                ? `运行中 (端口 ${serverStatus.port})`
                                : "已停止"
                        }}
                    </span>
                </span>
            </div>
        </a-form-item>
    </a-form>
</template>

<style scoped></style>
