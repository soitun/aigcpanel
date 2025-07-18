<script setup lang="ts">

import ServerSelector from "../Server/ServerSelector.vue";
import {onMounted, ref, watch} from "vue";
import {useServerStore} from "../../store/modules/server";
import {Dialog} from "../../lib/dialog";
import {StorageUtil} from "../../lib/storage";
import {t} from "../../lang";
import {VideoTemplateRecord, VideoTemplateService} from "../../service/VideoTemplateService";
import {EnumServerStatus} from "../../types/Server";
import ParamForm from "../common/ParamForm.vue";
import {PermissionService} from "../../service/PermissionService";
import {TaskRecord, TaskService} from "../../service/TaskService";
import {StorageRecord, StorageService} from "../../service/StorageService";
import AudioPlayerButton from "../common/AudioPlayerButton.vue";

const serverStore = useServerStore()
const videoParamForm = ref<InstanceType<typeof ParamForm> | null>(null)
const soundTtsParamForm = ref<InstanceType<typeof ParamForm> | null>(null)
const soundCloneParamForm = ref<InstanceType<typeof ParamForm> | null>(null)

const videoModelConfig = ref(null)
const soundTtsModelConfig = ref(null)
const soundCloneModelConfig = ref(null)
const videoParam = ref([])
const soundTtsParam = ref([])
const soundCloneParam = ref([])
const videoTemplateRecords = ref<VideoTemplateRecord[]>([])

const soundPrompts = ref<StorageRecord[]>([])
const formData = ref({
    videoServerKey: '',
    soundTtsServerKey: '',
    soundCloneServerKey: '',
    videoTemplateId: 0,
    soundType: 'soundTts',
    soundPromptId: 0,
    text: '',
});

onMounted(async () => {
    const old = StorageUtil.getObject('VideoGenFlowCreate.formData')
    formData.value.videoServerKey = old.videoServerKey || ''
    formData.value.soundTtsServerKey = old.soundTtsServerKey || ''
    formData.value.soundCloneServerKey = old.soundCloneServerKey || ''
    formData.value.videoTemplateId = old.videoTemplateId || 0
    formData.value.soundType = old.soundType || 'soundTts'
    formData.value.soundPromptId = old.soundPromptId || 0
    formData.value.text = old.text || ''
    soundPrompts.value = await StorageService.list('SoundPrompt')
})

watch(() => formData.value, async (value) => {
    StorageUtil.set('VideoGenFlowCreate.formData', value)
}, {
    deep: true
})

const onVideoServerUpdate = async (config: any) => {
    videoParam.value = config.functions.videoGen?.param || []
    videoModelConfig.value = config
}

const onSoundTtsServerUpdate = async (config: any) => {
    soundTtsParam.value = config.functions.soundTts?.param || []
    soundTtsModelConfig.value = config
}

const onSoundCloneServerUpdate = async (config: any) => {
    soundCloneParam.value = config.functions.soundClone?.param || []
    soundCloneModelConfig.value = config
}

onMounted(async () => {
    videoTemplateRecords.value = await VideoTemplateService.list()
})

const doSubmit = async () => {
    let videoParam = videoParamForm.value?.getValue() || {}
    let soundTtsParam = soundTtsParamForm.value?.getValue() || {}
    let soundCloneParam = soundCloneParamForm.value?.getValue() || {}
    let videoServer, soundTtsServer, soundCloneServer
    let soundPrompt
    if (!formData.value.videoServerKey) {
        Dialog.tipError(t('请选择模型'))
        return
    }
    videoServer = await serverStore.getByKey(formData.value.videoServerKey)
    if (!videoServer) {
        Dialog.tipError(t('模型不存在'))
        return
    }
    if (videoServer.status !== EnumServerStatus.RUNNING) {
        Dialog.tipError(t('模型未启动'))
        return
    }
    if (!formData.value.videoTemplateId) {
        Dialog.tipError(t('请选择视频'))
        return
    }
    const videoTemplate = await VideoTemplateService.get(formData.value.videoTemplateId)
    if (!videoTemplate) {
        Dialog.tipError(t('请选择视频'))
        return
    }
    if (formData.value.soundType === 'soundTts') {
        if (!formData.value.soundTtsServerKey) {
            Dialog.tipError(t('请选择声音模型'))
            return
        }
        soundTtsServer = await serverStore.getByKey(formData.value.soundTtsServerKey)
        if (!soundTtsServer) {
            Dialog.tipError(t('声音模型不存在'))
            return
        }
        if (soundTtsServer.status !== EnumServerStatus.RUNNING) {
            Dialog.tipError(t('声音模型未启动'))
            return
        }
    } else if (formData.value.soundType === 'soundClone') {
        if (!formData.value.soundCloneServerKey) {
            Dialog.tipError(t('请选择声音模型'))
            return
        }
        soundCloneServer = await serverStore.getByKey(formData.value.soundCloneServerKey)
        if (!soundCloneServer) {
            Dialog.tipError(t('声音模型不存在'))
            return
        }
        if (soundCloneServer.status !== EnumServerStatus.RUNNING) {
            Dialog.tipError(t('声音模型未启动'))
            return
        }
        soundPrompt = await StorageService.get(formData.value.soundPromptId)
        if (!soundPrompt) {
            Dialog.tipError(t('请选择音色'))
            return
        }
    }
    const record: TaskRecord = {
        biz: 'VideoGenFlow',
        title: await window.$mapi.file.textToName(formData.value.text),
        serverName: videoServer.name,
        serverTitle: videoServer.title,
        serverVersion: videoServer.version,
        modelConfig: {
            videoTemplateId: videoTemplate?.id as number,
            videoTemplateName: videoTemplate?.name,
            soundType: formData.value.soundType,
            soundTts: {
                serverName: soundTtsServer?.name,
                serverTitle: soundTtsServer?.title,
                serverVersion: soundTtsServer?.version,
                param: soundTtsParam,
            },
            soundClone: {
                serverName: soundCloneServer?.name,
                serverTitle: soundCloneServer?.title,
                serverVersion: soundCloneServer?.version,
                promptId: soundPrompt?.id,
                promptName: soundPrompt?.title,
                promptWav: soundPrompt?.content.url,
                promptText: soundPrompt?.content.promptText,
                param: soundCloneParam,
            },
            text: formData.value.text,
        },
        param: videoParam,
    }
    if (!await PermissionService.checkForTask('VideoGenFlow', record)) {
        return
    }
    // console.log('VideoGenFlow.submit',JSON.stringify(record))
    const id = await TaskService.submit(record)
    Dialog.tipSuccess(t('任务已经提交成功，等待视频生成完成'))
    formData.value.text = ''
    emit('submitted')
}

const emit = defineEmits({
    submitted: () => true
})
</script>

<template>
    <div class="rounded-xl shadow border p-4">
        <div class="flex items-center h-12">
            <div class="mr-1">
                <a-tooltip :content="$t('视频模型')" mini>
                    <i class="iconfont icon-server"></i>
                    {{ $t('视频模型') }}
                </a-tooltip>
            </div>
            <div class="mr-3 w-96 flex-shrink-0">
                <ServerSelector v-model="formData.videoServerKey" @update="onVideoServerUpdate"
                                functionName="videoGen"/>
            </div>
        </div>
        <div class="flex items-center h-12">
            <div class="mr-1">
                <a-tooltip :content="$t('视频形象')" mini>
                    <i class="iconfont icon-video-template"></i>
                    {{ $t('视频形象') }}
                </a-tooltip>
            </div>
            <div class="mr-3 w-56 flex-shrink-0">
                <a-select v-model="formData.videoTemplateId">
                    <a-option :value="0">{{ $t('请选择') }}</a-option>
                    <a-option v-for="record in videoTemplateRecords" :key="record.id" :value="record.id">
                        <div>
                            {{ record.name }}
                        </div>
                    </a-option>
                </a-select>
            </div>
        </div>
        <div class="flex items-center min-h-12" v-if="videoParam.length>0">
            <ParamForm ref="videoParamForm" :param="videoParam"/>
        </div>
        <div class="flex items-center h-12">
            <div class="mr-1">
                <a-tooltip :content="$t('声音类型')" mini>
                    <i class="iconfont icon-sound"></i>
                    {{ $t('声音类型') }}
                </a-tooltip>
            </div>
            <div class="mr-1">
                <a-radio-group v-model="formData.soundType">
                    <a-radio value="soundTts">
                        <i class="iconfont icon-sound-generate"></i>
                        {{ $t('声音合成') }}
                    </a-radio>
                    <a-radio value="soundClone">
                        <i class="iconfont icon-sound-clone"></i>
                        {{ $t('声音克隆') }}
                    </a-radio>
                </a-radio-group>
            </div>
        </div>
        <div v-if="formData.soundType==='soundTts'" class="flex items-center h-12">
            <div class="mr-1">
                <a-tooltip :content="$t('声音模型')" mini>
                    <i class="iconfont icon-server"></i>
                    {{ $t('声音模型') }}
                </a-tooltip>
            </div>
            <div class="mr-3 w-96 flex-shrink-0">
                <ServerSelector v-model="formData.soundTtsServerKey" @update="onSoundTtsServerUpdate"
                                functionName="soundTts"/>
            </div>
        </div>
        <div v-if="formData.soundType==='soundClone'" class="flex items-center h-12">
            <div class="mr-1">
                <a-tooltip :content="$t('声音模型')" mini>
                    <i class="iconfont icon-server"></i>
                    {{ $t('声音模型') }}
                </a-tooltip>
            </div>
            <div class="mr-3 w-96 flex-shrink-0">
                <ServerSelector v-model="formData.soundCloneServerKey" @update="onSoundCloneServerUpdate"
                                functionName="soundClone"/>
            </div>
        </div>
        <div v-if="formData.soundType==='soundClone'" class="flex items-center h-12">
            <div class="mr-1">
                <a-tooltip :content="$t('声音音色')" mini>
                    <i class="iconfont icon-server"></i>
                    {{ $t('声音音色') }}
                </a-tooltip>
            </div>
            <div class="mr-3 w-96 flex-shrink-0 flex items-center">
                <div class="flex-grow">
                    <a-select :placeholder="$t('音色')" size="small"
                              v-model="formData.soundPromptId">
                        <a-option :value="0">
                            {{ $t('请选择') }}
                        </a-option>
                        <a-option v-for="s in soundPrompts"
                                  :value="s.id">
                            {{ s.title }}
                        </a-option>
                    </a-select>
                </div>
                <div class="pl-2" v-if="formData.soundPromptId > 0">
                    <AudioPlayerButton :source="'file://'+soundPrompts.find(s => s.id === formData.soundPromptId)?.content?.url"/>
                </div>
            </div>
        </div>
        <div class="flex items-center min-h-12" v-if="formData.soundType==='soundTts' && soundTtsParam.length>0">
            <ParamForm ref="soundTtsParamForm" :param="soundTtsParam"/>
        </div>
        <div class="flex items-center min-h-12" v-if="formData.soundType==='soundClone' && soundCloneParam.length>0">
            <ParamForm ref="soundCloneParamForm" :param="soundCloneParam"/>
        </div>
        <div class="pt-2">
            <a-textarea v-model="formData.text"
                        :auto-size="{minRows:2}"
                        :placeholder="$t('输入语音内容开始生成视频')"></a-textarea>
        </div>
        <div class="pt-2">
            <a-button class="mr-2" type="primary" @click="doSubmit">
                {{ $t('开始生成视频') }}
            </a-button>
        </div>
    </div>
</template>
