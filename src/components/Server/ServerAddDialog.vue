<script setup lang="ts">
import {computed, ref} from "vue";
import {Dialog} from "../../lib/dialog";
import {t} from "../../lang";
import {functionToLabels} from "../../lib/aigcpanel";
import {EnumServerType, ServerRecord} from "../../types/Server";
import {useServerStore} from "../../store/modules/server";
import {VersionUtil} from "../../lib/util";
import {AppConfig} from "../../config";
import ServerAddResolvePanel from "./ServerAddResolvePanel.vue";

const resolvePanel = ref<InstanceType<typeof ServerAddResolvePanel> | null>(null);

const serverStore = useServerStore();
const visible = ref(false);
const loading = ref(false);
const modelInfo = ref({
    type: EnumServerType.LOCAL as EnumServerType,
    name: "",
    version: "",
    serverRequire: "",
    title: "",
    description: "",
    deviceDescription: "",
    path: "",
    platformName: "",
    platformArch: "",
    entry: "",
    functions: [],
    settings: [],
    setting: {},
    isSupport: false,
});
const isImporting = ref(false);
const logStatus = ref("");

const show = () => {
    emptyModelInfo();
    visible.value = true;
};

const platformInfo = computed(() => {
    const platformNameMap = {
        win: "Windows",
        osx: "macOS",
        linux: "Linux",
    };
    const platformName = platformNameMap[modelInfo.value.platformName] || modelInfo.value.platformName;
    return `${platformName} ${modelInfo.value.platformArch}`;
});
const functionLabels = computed(() => {
    return functionToLabels(modelInfo.value.functions);
});

const emptyModelInfo = () => {
    modelInfo.value.type = EnumServerType.LOCAL;
    modelInfo.value.name = "";
    modelInfo.value.version = "";
    modelInfo.value.title = "";
    modelInfo.value.description = "";
    modelInfo.value.serverRequire = "";
    modelInfo.value.deviceDescription = "";
    modelInfo.value.path = "";
    modelInfo.value.platformName = "";
    modelInfo.value.platformArch = "";
    modelInfo.value.entry = "";
    modelInfo.value.functions = [];
    modelInfo.value.settings = [];
    modelInfo.value.setting = {};
    modelInfo.value.isSupport = false;
    resolvePanel.value?.reset();
};

const doSubmitLocalDir = async () => {
    await serverStore.add({
        key: serverStore.generateServerKey({
            name: modelInfo.value.name,
            version: modelInfo.value.version,
        } as any),
        name: modelInfo.value.name,
        title: modelInfo.value.title,
        version: modelInfo.value.version,
        type: modelInfo.value.type,
        autoStart: modelInfo.value.entry === "__EasyServer__",
        functions: modelInfo.value.functions,
        localPath: modelInfo.value.path,
        settings: modelInfo.value.settings,
        setting: modelInfo.value.setting,
    } as ServerRecord);
};

const doSubmit = async () => {
    if (!modelInfo.value.path) {
        return;
    }
    const target = await window.$mapi.file.fullPath(`model/${modelInfo.value.name}-${modelInfo.value.version}`);
    const targetAbsolute = window.$mapi.file.absolutePath(target);
    if (await window.$mapi.file.exists(targetAbsolute)) {
        Dialog.tipError(t("模型相同版本已存在"));
        return;
    }
    const exists = await serverStore.getByNameVersion(modelInfo.value.name, modelInfo.value.version);
    if (exists) {
        Dialog.tipError(t("模型相同版本已存在"));
        return;
    }
    if (window.$mapi.app.platformName() !== modelInfo.value.platformName) {
        Dialog.tipError(t("模型平台不匹配"));
        return;
    }
    if (window.$mapi.app.platformArch() !== modelInfo.value.platformArch) {
        Dialog.tipError(t("模型架构不匹配"));
        return;
    }
    if (!VersionUtil.match(AppConfig.version, modelInfo.value.serverRequire)) {
        Dialog.tipError(t("软件不满足模型版本要求"));
        return;
    }
    isImporting.value = true;
    if (modelInfo.value.type === EnumServerType.LOCAL_DIR) {
        await doSubmitLocalDir();
    } else {
        Dialog.tipError(t("模型类型错误"));
        return;
    }
    Dialog.tipSuccess(t("模型添加成功"));
    visible.value = false;
    isImporting.value = false;
    emit("update");
};

const doSelectLocalDir = async () => {
    const configPath = await window.$mapi.file.openFile({
        filters: [{name: "config.json", extensions: ["json"]}],
    });
    if (!configPath) {
        return;
    }
    if (!/^[a-zA-Z0-9\/:\-\\._]+$/.test(configPath)) {
        Dialog.tipError(t("模型路径不能包含非英文、空格等特殊字符"));
        return;
    }
    emptyModelInfo();
    loading.value = true;
    try {
        const content = await window.$mapi.file.read(configPath, {
            isFullPath: true,
        });
        const serverPath = configPath.replace(/[\/\\]config.json$/, "");
        const json = JSON.parse(content);
        modelInfo.value.type = EnumServerType.LOCAL_DIR;
        modelInfo.value.name = json.name || "";
        modelInfo.value.version = json.version || "";
        modelInfo.value.serverRequire = json.serverRequire || "*";
        modelInfo.value.deviceDescription = json.deviceDescription || "";
        modelInfo.value.title = json.title || "";
        modelInfo.value.description = json.description || "";
        modelInfo.value.path = serverPath;
        modelInfo.value.platformName = json.platformName || "";
        modelInfo.value.platformArch = json.platformArch || "";
        modelInfo.value.entry = json.entry || "";
        modelInfo.value.functions = json.functions || [];
        modelInfo.value.settings = json.settings || {};
        modelInfo.value.setting = json.setting || {};
        modelInfo.value.isSupport = await window.$mapi.server.isSupport({
            localPath: serverPath,
            name: modelInfo.value.name,
        } as any);
        if (modelInfo.value.isSupport) {
            logStatus.value = "";
        } else {
            logStatus.value = t("模型不支持");
            if (modelInfo.value.platformName !== window.$mapi.app.platformName()) {
                logStatus.value += `(${t("平台不匹配")})`;
            }
            if (modelInfo.value.platformArch !== window.$mapi.app.platformArch()) {
                logStatus.value += `(${t("芯片架构不匹配")})`;
            }
        }
    } catch (e) {
        console.log("ServerImportLocalDialog.doSelectLocalDir.error", e);
        Dialog.tipError(t("模型目录识别失败，请选择正确的模型目录"));
    }
    loading.value = false;
};

const doSelectCloud = async () => {
    Dialog.tipError(t("请升级Pro版使用"));
};
defineExpose({
    show,
    doSelectCloud,
});

const emit = defineEmits({
    update: () => true,
});
</script>

<template>
    <a-modal
        v-model:visible="visible"
        width="40rem"
        :footer="false"
        :esc-to-close="false"
        :mask-closable="false"
        title-align="start"
    >
        <template #title>
            {{ $t("添加模型服务") }}
        </template>
        <div>
            <div class="select-none" style="max-height: 70vh">
                <div v-if="!modelInfo.name">
                    <div class="px-3">
                        <div>
                            <img class="w-48 h-48 object-contain m-auto" src="./../../assets/image/server-folder.svg" />
                        </div>
                        <div class="flex gap-4">
                            <a-button @click="doSelectLocalDir" class="block w-full" :loading="loading">
                                <template #icon>
                                    <icon-folder />
                                </template>
                                {{ t("选择本地模型") }}
                                config.json
                            </a-button>
                            <a
                                href="https://aigcpanel.com/zh/asset"
                                target="_blank"
                                class="arco-btn arco-btn-secondary arco-btn-shape-square arco-btn-size-medium arco-btn-status-normal block w-full text-center py-1"
                            >
                                <icon-cloud />
                                {{ t("模型市场") }}
                            </a>
                        </div>
                        <div class="mt-2">
                            <div class="text-sm bg-gray-100 p-5 rounded-lg text-gray-500 leading-6">
                                <div>
                                    {{ $t("模型运行在本地，对电脑性能有要求") }}
                                </div>
                                <div>
                                    {{ "① " + $t("访问模型市场，下载模型到本地") }}
                                </div>
                                <div>
                                    {{ "② " + $t("解压模型压缩包，选择目录中的config.json文件") }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else>
                    <div class="border rounded-lg py-4 leading-10">
                        <div class="flex">
                            <div class="pr-3 text-right w-20">{{ t("名称") }}</div>
                            <div class="flex flex-wrap items-center">
                                <div class="mr-2 mb-1">{{ modelInfo.title }}</div>
                                <div class="mr-2 text-sm bg-gray-100 px-2 leading-6 inline-block rounded-lg mb-1">
                                    v{{ modelInfo.version }}
                                </div>
                                <div class="mr-2 text-xs bg-gray-100 px-2 leading-6 inline-block rounded-lg mb-1">
                                    {{ modelInfo.name }}
                                </div>
                            </div>
                        </div>
                        <div class="flex">
                            <div class="pr-3 text-right w-20 flex-shrink-0">{{ t("描述") }}</div>
                            <div>{{ modelInfo.description }}</div>
                        </div>
                        <div class="flex">
                            <div class="pr-3 text-right w-20 flex-shrink-0">{{ $t("适配") }}</div>
                            <div>{{ platformInfo }}</div>
                        </div>
                        <div class="flex">
                            <div class="pr-3 text-right w-20 flex-shrink-0">{{ $t("功能") }}</div>
                            <div>
                                <a-tag v-for="label in functionLabels" class="mr-1">
                                    {{ label }}
                                </a-tag>
                            </div>
                        </div>
                        <div class="flex">
                            <div class="pr-3 text-right w-20 flex-shrink-0">{{ t("硬件要求") }}</div>
                            <div>{{ modelInfo.deviceDescription }}</div>
                        </div>
                        <div class="flex">
                            <div class="pr-3 text-right w-20 flex-shrink-0">{{ t("版本要求") }}</div>
                            <div>{{ modelInfo.serverRequire === "*" ? t("无") : modelInfo.serverRequire }}</div>
                        </div>
                    </div>
                    <div>
                        <ServerAddResolvePanel ref="resolvePanel" :root="modelInfo.path" />
                    </div>
                    <div class="pt-4 flex items-center">
                        <div>
                            <a-button
                                class="mr-2"
                                type="primary"
                                :disabled="(!modelInfo.isSupport||!resolvePanel?.isSuccess().value) as boolean"
                                :loading="isImporting"
                                @click="doSubmit"
                            >
                                <template #icon>
                                    <icon-check />
                                </template>
                                {{ $t("确认提交") }}
                            </a-button>
                            <a-button class="mr-2" v-if="!isImporting" @click="emptyModelInfo" :loading="loading">
                                <template #icon>
                                    <icon-redo />
                                </template>
                                {{ $t("重新选择") }}
                            </a-button>
                        </div>
                        <div class="flex-grow pl-3 text-sm truncate text-red-600">
                            {{ logStatus }}
                        </div>
                    </div>
                </div>
                <div class="h-5"></div>
            </div>
        </div>
    </a-modal>
</template>
