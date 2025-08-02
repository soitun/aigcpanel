<script setup lang="ts">
import ServerSelector from "../../../components/Server/ServerSelector.vue";
import {onMounted, ref, watch} from "vue";
import {useServerStore} from "../../../store/modules/server";
import {Dialog} from "../../../lib/dialog";
import {StorageUtil} from "../../../lib/storage";
import {t} from "../../../lang";
import {VideoTemplateRecord, VideoTemplateService} from "../../../service/VideoTemplateService";
import {EnumServerStatus} from "../../../types/Server";
import ParamForm from "../../../components/common/ParamForm.vue";
import {PermissionService} from "../../../service/PermissionService";
import ServerContentInfoAction from "../../../components/Server/ServerContentInfoAction.vue";
import {TaskRecord, TaskService} from "../../../service/TaskService";
import {TimeUtil} from "../../../lib/util";
import SoundGenerateSelector from "../../Sound/Components/SoundGenerateSelector.vue";

const serverStore = useServerStore();
const paramForm = ref<InstanceType<typeof ParamForm> | null>(null);

const modelConfig = ref(null);
const formData = ref({
    serverKey: "",
    videoTemplateId: 0,
    soundType: "soundGenerate",
    soundGenerateId: 0,
    soundCustomFile: "",
    param: {},
});
const formDataParam = ref([]);

const soundTtsRecords = ref<TaskRecord[]>([]);
const soundCloneRecords = ref<TaskRecord[]>([]);
const videoTemplateRecords = ref<VideoTemplateRecord[]>([]);

onMounted(() => {
    const old = StorageUtil.getObject("VideoGenCreate.formData");
    formData.value.serverKey = old.serverKey || "";
    formData.value.videoTemplateId = old.videoTemplateId || 0;
    formData.value.soundType = old.soundType || "soundGenerate";
    formData.value.soundGenerateId = old.soundGenerateId || 0;
    formData.value.soundCustomFile = old.soundCustomFile || "";
});

watch(
    () => formData.value,
    async value => {
        StorageUtil.set("VideoGenCreate.formData", value);
    },
    {
        deep: true,
    }
);

watch(
    () => formData.value.soundType,
    async value => {
        if (value === "soundTts") {
            soundTtsRecords.value = await TaskService.list("SoundTts");
        } else if (value === "soundClone") {
            soundCloneRecords.value = await TaskService.list("SoundClone");
        }
    },
    {
        immediate: true,
    }
);

const onServerUpdate = async (config: any) => {
    formDataParam.value = config.functions.videoGen?.param || [];
    modelConfig.value = config;
};

onMounted(async () => {
    videoTemplateRecords.value = await VideoTemplateService.list();
});

const doSubmit = async () => {
    formData.value.param = paramForm.value?.getValue() || {};
    if (!formData.value.serverKey) {
        Dialog.tipError(t("请选择模型"));
        return;
    }
    let soundRecord: TaskRecord | null = null;
    let soundCustomFile: string | null = null;
    if (formData.value.soundType === "soundGenerate") {
        if (!formData.value.soundGenerateId) {
            Dialog.tipError(t("请选择声音"));
            return;
        }
        soundRecord = await TaskService.get(formData.value.soundGenerateId);
        if (!soundRecord) {
            Dialog.tipError(t("请选择声音"));
            return;
        }
    } else if (formData.value.soundType === "soundCustom") {
        soundCustomFile = formData.value.soundCustomFile;
        if (!soundCustomFile) {
            Dialog.tipError(t("请选择声音"));
            return;
        }
        soundCustomFile = await window.$mapi.file.hubSave(soundCustomFile, {
            isFullPath: true,
            returnFullPath: true,
        });
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
    const server = await serverStore.getByKey(formData.value.serverKey);
    if (!server) {
        Dialog.tipError(t("模型不存在"));
        return;
    }
    if (server.status !== EnumServerStatus.RUNNING) {
        Dialog.tipError(t("模型未启动"));
        return;
    }
    const record: TaskRecord = {
        biz: "VideoGen",
        title: await window.$mapi.file.textToName(videoTemplate.name + "_" + TimeUtil.datetimeString()),
        serverName: server.name,
        serverTitle: server.title,
        serverVersion: server.version,
        modelConfig: {
            videoTemplateId: videoTemplate.id as number,
            videoTemplateName: videoTemplate.name,
            soundType: formData.value.soundType,
            soundGenerateId: formData.value.soundGenerateId as number,
            soundGenerateText: soundRecord ? soundRecord.modelConfig.text : "",
            soundCustomFile: soundCustomFile || "",
        },
        param: formData.value.param,
    };
    if (!(await PermissionService.checkForTask("VideoGen", record))) {
        return;
    }
    const id = await TaskService.submit(record);
    Dialog.tipSuccess(t("任务已经提交成功，等待视频生成完成"));
    emit("submitted");
};

const refresh = async (type: "videoTemplate") => {
    if (type === "videoTemplate") {
        videoTemplateRecords.value = await VideoTemplateService.list();
    }
};

const doSoundCustomSelect = async () => {
    const path = await window.$mapi.file.openFile({
        filters: [
            {name: "*.wav", extensions: ["wav"]},
            {name: "*.mp3", extensions: ["mp3"]},
        ],
    });
    if (!path) {
        return;
    }
    formData.value.soundCustomFile = path;
};

const fileName = (fullPath: string) => {
    return fullPath.replace(/\\/g, "/").split("/").pop() || "";
};

const emit = defineEmits({
    submitted: () => true,
});

defineExpose({
    refresh,
});
</script>

<template>
    <div class="rounded-xl shadow border p-4">
        <div class="flex items-center h-12">
            <div class="mr-1">
                <a-tooltip :content="$t('模型')" mini>
                    <i class="iconfont icon-server"></i>
                    {{ $t("模型") }}
                </a-tooltip>
            </div>
            <div class="mr-3 w-96 flex-shrink-0">
                <ServerSelector v-model="formData.serverKey" @update="onServerUpdate" functionName="videoGen" />
            </div>
        </div>
        <div class="flex items-center h-12">
            <div class="mr-1">
                <a-tooltip :content="$t('形象')" mini>
                    <i class="iconfont icon-video-template"></i>
                    {{ $t("形象") }}
                </a-tooltip>
            </div>
            <div class="mr-3 w-56 flex-shrink-0">
                <a-select v-model="formData.videoTemplateId">
                    <a-option :value="0">{{ $t("请选择") }}</a-option>
                    <a-option v-for="record in videoTemplateRecords" :key="record.id" :value="record.id">
                        <div>
                            {{ record.name }}
                        </div>
                    </a-option>
                </a-select>
            </div>
        </div>
        <div class="flex items-center h-12">
            <div class="mr-1">
                <a-tooltip :content="$t('声音')" mini>
                    <i class="iconfont icon-sound"></i>
                    {{ $t("声音") }}
                </a-tooltip>
            </div>
            <div class="mr-1">
                <a-radio-group v-model="formData.soundType">
                    <a-radio value="soundGenerate">
                        <i class="iconfont icon-sound-generate"></i>
                        {{ $t("声音合成") }}
                    </a-radio>
                    <a-radio value="soundCustom">
                        <icon-file />
                        {{ $t("本地文件") }}
                    </a-radio>
                </a-radio-group>
            </div>
            <div class="mr-3 w-96 flex-shrink-0" v-if="formData.soundType === 'soundGenerate'">
                <SoundGenerateSelector v-model="formData.soundGenerateId" />
            </div>
            <div class="mr-3 w-96 flex-shrink-0" v-if="formData.soundType === 'soundCustom'">
                <a-button @click="doSoundCustomSelect">
                    <div v-if="formData.soundCustomFile">
                        {{ fileName(formData.soundCustomFile) }}
                    </div>
                    <div v-else>{{ $t("选择本地文件") }}</div>
                </a-button>
            </div>
        </div>
        <div class="flex items-center min-h-12" v-if="formDataParam.length > 0">
            <ParamForm ref="paramForm" :param="formDataParam" />
        </div>
        <div class="pt-2">
            <a-button class="mr-2" type="primary" @click="doSubmit">
                {{ $t("开始生成视频") }}
            </a-button>
            <ServerContentInfoAction :config="modelConfig as any" func="videoGen" />
        </div>
    </div>
</template>
