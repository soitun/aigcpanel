<script setup lang="ts">
import {onMounted, ref, watch} from "vue";
import ParamForm from "../../../components/common/ParamForm.vue";
import ServerContentInfoAction from "../../../components/Server/ServerContentInfoAction.vue";
import ServerSelector from "../../../components/Server/ServerSelector.vue";
import {t} from "../../../lang";
import {Dialog} from "../../../lib/dialog";
import {StorageUtil} from "../../../lib/storage";
import {useServerStore} from "../../../store/modules/server";
import {EnumServerStatus} from "../../../types/Server";

const serverStore = useServerStore();
const formData = ref({
    serverKey: "",
});
const paramForm = ref<InstanceType<typeof ParamForm>>();
const param = ref([]);
const modelConfig = ref(null);

const onServerUpdate = async (config: any) => {
    param.value = config.functions.asr?.param || [];
    modelConfig.value = config;
};

onMounted(async () => {
    const old = StorageUtil.getObject("SoundAsrForm.formData");
    formData.value.serverKey = old.serverKey || "";
});

watch(
    () => formData.value,
    async value => {
        StorageUtil.set("SoundAsrForm.formData", value);
    },
    {
        deep: true,
    }
);

const getValue = async (): Promise<SoundAsrParamType | undefined> => {
    const data: any = {};
    data.type = "SoundAsr";
    data.serverKey = formData.value.serverKey;

    const server = await serverStore.getByKey(data.serverKey);
    if (!server) {
        Dialog.tipError(t("请选择语音识别模型"));
        return;
    }
    if (server.status !== EnumServerStatus.RUNNING) {
        Dialog.tipError(t("语音识别模型未启动"));
        return;
    }

    data.serverName = server.name;
    data.serverTitle = server.title;
    data.serverVersion = server.version;
    data.param = paramForm.value?.getValue();

    if (!data.param) {
        Dialog.tipError(t("语音识别参数不正确"));
        return;
    }

    return data;
};

defineExpose({
    getValue,
});
</script>

<template>
    <div class="flex items-center h-12">
        <div class="mr-1">
            <a-tooltip :content="$t('语音识别')" mini>
                <i class="iconfont icon-server"></i>
            </a-tooltip>
        </div>
        <div class="mr-2 w-96 flex-shrink-0">
            <ServerSelector v-model="formData.serverKey" @update="onServerUpdate" functionName="asr" />
        </div>
        <div>
            <ServerContentInfoAction :config="modelConfig as any" func="asr" />
        </div>
    </div>
    <div class="flex items-center">
        <ParamForm ref="paramForm" :param="param" />
    </div>
</template>
