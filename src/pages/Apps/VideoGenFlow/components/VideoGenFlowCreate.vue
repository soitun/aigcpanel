<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import ParamForm from "../../../../components/common/ParamForm.vue";
import ServerSelector from "../../../../components/Server/ServerSelector.vue";
import { t } from "../../../../lang";
import { Dialog } from "../../../../lib/dialog";
import { StorageUtil } from "../../../../lib/storage";
import { PermissionService } from "../../../../service/PermissionService";
import { TaskRecord, TaskService } from "../../../../service/TaskService";
import { VideoTemplateService } from "../../../../service/VideoTemplateService";
import { useServerStore } from "../../../../store/modules/server";
import { EnumServerStatus } from "../../../../types/Server";
import SoundGenerateForm from "../../../Sound/components/SoundGenerateForm.vue";
import VideoTemplateSelector from "../../../Video/components/VideoTemplateSelector.vue";

const serverStore = useServerStore();
const soundGenerateForm = ref<InstanceType<typeof SoundGenerateForm> | null>(null);
const videoParamForm = ref<InstanceType<typeof ParamForm> | null>(null);

const videoModelConfig = ref(null);
const videoParam = ref([]);

const formData = ref({
    videoServerKey: "",
    videoTemplateId: 0,
    text: "",
});

onMounted(async () => {
    const old = StorageUtil.getObject("VideoGenFlowCreate.formData");
    formData.value.videoServerKey = old.videoServerKey || "";
    formData.value.videoTemplateId = old.videoTemplateId || 0;
    formData.value.text = old.text || "";
});

watch(
    () => formData.value,
    async value => {
        StorageUtil.set("VideoGenFlowCreate.formData", value);
    },
    {
        deep: true,
    }
);

const onVideoServerUpdate = async (config: any) => {
    videoParam.value = config.functions.videoGen?.param || [];
    videoModelConfig.value = config;
};

const doSubmit = async () => {
    let videoParam = videoParamForm.value?.getValue() || {};
    let soundGenerateValue = await soundGenerateForm.value?.getValue();
    if (!soundGenerateValue) {
        return;
    }
    if (!formData.value.videoServerKey) {
        Dialog.tipError(t("请选择模型"));
        return;
    }
    const videoServer = await serverStore.getByKey(formData.value.videoServerKey);
    if (!videoServer) {
        Dialog.tipError(t("模型不存在"));
        return;
    }
    if (videoServer.status !== EnumServerStatus.RUNNING) {
        Dialog.tipError(t("模型未启动"));
        return;
    }
    if (!formData.value.videoTemplateId) {
        Dialog.tipError(t("请选择视频"));
        return;
    }
    const videoTemplate = await VideoTemplateService.get(formData.value.videoTemplateId);
    if (!videoTemplate) {
        Dialog.tipError(t("请选择视频"));
        return;
    }
    const record: TaskRecord = {
        biz: "VideoGenFlow",
        title: await window.$mapi.file.textToName(formData.value.text),
        serverName: videoServer.name,
        serverTitle: videoServer.title,
        serverVersion: videoServer.version,
        modelConfig: {
            videoTemplateId: videoTemplate?.id as number,
            videoTemplateName: videoTemplate?.name,
            videoUrl: videoTemplate?.video,
            soundGenerate: soundGenerateValue,
            text: formData.value.text,
        },
        param: videoParam,
    };
    if (!(await PermissionService.checkForTask("VideoGenFlow", record))) {
        return;
    }
    // console.log('VideoGenFlow.submit',JSON.stringify(record))
    const id = await TaskService.submit(record);
    Dialog.tipSuccess(t("任务已经提交成功，等待视频生成完成"));
    formData.value.text = "";
    emit("submitted");
};

const emit = defineEmits({
    submitted: () => true,
});
</script>

<template>
    <div class="rounded-xl shadow border p-4">
        <div class="font-bold">
            <i class="iconfont icon-video"></i>
            {{ $t('视频设置') }}
        </div>
        <div class="flex items-center h-12">
            <div class="mr-1">
                <a-tooltip :content="$t('视频模型')" mini>
                    <i class="iconfont icon-server"></i>
                </a-tooltip>
            </div>
            <div class="mr-3 w-96 flex-shrink-0">
                <ServerSelector v-model="formData.videoServerKey" @update="onVideoServerUpdate"
                    functionName="videoGen" />
            </div>
        </div>
        <div class="flex items-center h-12">
            <div class="mr-1">
                <a-tooltip :content="$t('视频形象')" mini>
                    <i class="iconfont icon-video-template"></i>
                </a-tooltip>
            </div>
            <div class="mr-3 w-56 flex-shrink-0">
                <VideoTemplateSelector v-model="formData.videoTemplateId" />
            </div>
        </div>
        <div class="flex items-center min-h-12" v-if="videoParam.length > 0">
            <ParamForm ref="videoParamForm" :param="videoParam" />
        </div>
        <div class="font-bold pt-4">
            <i class="iconfont icon-video"></i>
            {{ $t('声音设置') }}
        </div>
        <SoundGenerateForm ref="soundGenerateForm" />
        <div class="pt-2">
            <a-textarea v-model="formData.text" :auto-size="{ minRows: 2 }"
                :placeholder="$t('输入语音内容开始生成视频')"></a-textarea>
        </div>
        <div class="pt-2">
            <a-button class="mr-2" type="primary" @click="doSubmit">
                {{ $t("开始生成视频") }}
            </a-button>
        </div>
    </div>
</template>
