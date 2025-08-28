<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import ParamForm from "../../../components/common/ParamForm.vue";
import ServerContentInfoAction from "../../../components/Server/ServerContentInfoAction.vue";
import ServerSelector from "../../../components/Server/ServerSelector.vue";
import {t} from "../../../lang";
import {Dialog} from "../../../lib/dialog";
import {StorageUtil} from "../../../lib/storage";
import {StorageService} from "../../../service/StorageService";
import {useServerStore} from "../../../store/modules/server";
import {EnumServerStatus} from "../../../types/Server";
import SoundPromptDialog from "./SoundPromptDialog.vue";
import SoundPromptSelector from "./SoundPromptSelector.vue";

const serverStore = useServerStore();
const formData = ref({
    type: "SoundTts",
    ttsServerKey: "",
    cloneServerKey: "",
    promptId: 0,
});
const ttsParamForm = ref<InstanceType<typeof ParamForm>>();
const cloneParamForm = ref<InstanceType<typeof ParamForm>>();
const ttsParam = ref([]);
const cloneParam = ref([]);
const ttsModelConfig = ref(null);
const cloneModelConfig = ref(null);
const onSoundTtsServerUpdate = async (config: any) => {
    ttsParam.value = config.functions.soundTts?.param || [];
    ttsModelConfig.value = config;
};

const onSoundCloneServerUpdate = async (config: any) => {
    cloneParam.value = config.functions.soundClone?.param || [];
    cloneModelConfig.value = config;
};
onMounted(async () => {
    const old = StorageUtil.getObject("SoundGenerateForm.formData");
    formData.value.type = old.type || "SoundTts";
    formData.value.ttsServerKey = old.ttsServerKey || "";
    formData.value.cloneServerKey = old.cloneServerKey || "";
    formData.value.promptId = old.promptId || 0;
});
watch(
    () => formData.value,
    async value => {
        StorageUtil.set("SoundGenerateForm.formData", value);
    },
    {
        deep: true,
    }
);

const getValue = async (): Promise<SoundGenerateParamType | undefined> => {
    const data: any = {};
    data.type = formData.value.type;
    if (!data.type) {
        Dialog.tipError(t("请选择合成类型"));
        return;
    }
    if (data.type === "SoundTts") {
        data.ttsServerKey = formData.value.ttsServerKey;
        const server = await serverStore.getByKey(data.ttsServerKey);
        if (!server) {
            Dialog.tipError(t("请选择声音模型"));
            return;
        }
        if (server.status !== EnumServerStatus.RUNNING) {
            Dialog.tipError(t("声音模型未启动"));
            return;
        }
        data.serverName = server.name;
        data.serverTitle = server.title;
        data.serverVersion = server.version;
        data.ttsParam = ttsParamForm.value ? ttsParamForm.value.getValue() : {};
        if (!data.ttsParam) {
            Dialog.tipError(t("声音合成参数不正确"));
            return;
        }
        if (ttsParamForm.value) {
            if (!ttsParamForm.value.validate()) {
                return;
            }
        }
    } else if (data.type === "SoundClone") {
        data.cloneServerKey = formData.value.cloneServerKey;
        data.promptId = formData.value.promptId;
        const server = await serverStore.getByKey(data.cloneServerKey);
        if (!server) {
            Dialog.tipError(t("请选择声音模型"));
            return;
        }
        if (server.status !== EnumServerStatus.RUNNING) {
            Dialog.tipError(t("声音模型未启动"));
            return;
        }
        data.serverName = server.name;
        data.serverTitle = server.title;
        data.serverVersion = server.version;
        data.cloneParam = cloneParamForm.value ? cloneParamForm.value.getValue() : {};
        if (!data.cloneParam) {
            Dialog.tipError(t("声音合成参数不正确"));
            return;
        }
        if (cloneParamForm.value) {
            if (!cloneParamForm.value.validate()) {
                return;
            }
        }
        if (!data.promptId) {
            Dialog.tipError(t("请选择声音音色"));
            return;
        }
        const prompt = await StorageService.get(data.promptId);
        if (!prompt) {
            Dialog.tipError(t("声音音色不存在"));
            return;
        }
        data.promptTitle = prompt.title;
        data.promptUrl = prompt.content.url;
        data.promptText = prompt.content.promptText;
    }
    return data;
};

defineExpose({
    getValue,
});
</script>

<template>
    <div class="mb-4">
        <div class="font-bold mb-2">
            <div class="inline-block w-5">
                <icon-settings />
            </div>
            {{ $t("声音合成配置") }}
        </div>
        <div class="flex items-start min-h-8">
            <div class="mr-1">
                <a-tooltip :content="$t('合成类型')" mini>
                    <i class="iconfont icon-sound"></i>
                </a-tooltip>
            </div>
            <div class="mr-1">
                <a-radio-group v-model="formData.type">
                    <a-radio value="SoundTts">
                        <i class="iconfont icon-sound-generate"></i>
                        {{ $t("声音合成") }}
                    </a-radio>
                    <a-radio value="SoundClone">
                        <i class="iconfont icon-sound-clone"></i>
                        {{ $t("声音克隆") }}
                    </a-radio>
                </a-radio-group>
            </div>
        </div>
        <div v-if="formData.type === 'SoundTts'" class="flex items-start min-h-8">
            <div class="mr-1 pt-2">
                <a-tooltip :content="$t('声音合成模型')" mini>
                    <i class="iconfont icon-server"></i>
                </a-tooltip>
            </div>
            <div class="flex flex-wrap gap-1">
                <div>
                    <ServerSelector
                        v-model="formData.ttsServerKey"
                        @update="onSoundTtsServerUpdate"
                        functionName="soundTts"
                    />
                </div>
                <div>
                    <ServerContentInfoAction :config="ttsModelConfig as any" func="soundTts" />
                </div>
            </div>
        </div>
        <div v-if="formData.type === 'SoundClone'" class="flex items-start min-h-8 gap-1">
            <div class="mr-1 pt-2">
                <a-tooltip :content="$t('声音克隆模型')" mini>
                    <i class="iconfont icon-server"></i>
                </a-tooltip>
            </div>
            <div class="flex flex-wrap gap-1">
                <div>
                    <ServerSelector
                        v-model="formData.cloneServerKey"
                        @update="onSoundCloneServerUpdate"
                        functionName="soundClone"
                    />
                </div>
                <div class="">
                    <ServerContentInfoAction :config="cloneModelConfig as any" func="soundClone" />
                </div>
            </div>
        </div>
        <div v-if="formData.type === 'SoundClone'" class="flex items-center min-h-8 mt-2 gap-2">
            <div class="">
                <a-tooltip :content="$t('声音音色')" mini>
                    <i class="iconfont icon-sound-prompt"></i>
                </a-tooltip>
            </div>
            <div class="mr-2 flex items-center">
                <SoundPromptSelector v-model="formData.promptId" />
            </div>
        </div>
        <div
            class="flex flex-wrap items-center mt-2"
            v-if="formData.type === 'SoundTts' && ttsParam && ttsParam.length > 0"
        >
            <ParamForm ref="ttsParamForm" :param="ttsParam" />
        </div>
        <div
            class="flex flex-wrap items-center mt-2"
            v-else-if="formData.type === 'SoundClone' && cloneParam && cloneParam.length > 0"
        >
            <ParamForm ref="cloneParamForm" :param="cloneParam" />
        </div>
    </div>
    <SoundPromptDialog />
</template>
