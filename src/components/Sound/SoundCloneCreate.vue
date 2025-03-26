<script setup lang="ts">

import ServerSelector from "../Server/ServerSelector.vue";
import {onMounted, ref, watch} from "vue";
import {useServerStore} from "../../store/modules/server";
import {Dialog} from "../../lib/dialog";
import {StorageUtil} from "../../lib/storage";
import {t} from "../../lang";
import {EnumServerStatus} from "../../types/Server";
import ParamForm from "../common/ParamForm.vue";
import {PermissionService} from "../../service/PermissionService";
import ServerContentInfoAction from "../Server/ServerContentInfoAction.vue";
import {TaskRecord, TaskService} from "../../service/TaskService";
import {StorageRecord, StorageService} from "../../service/StorageService";
import BatchTextareaInputAction from "../BatchTextareaInputAction.vue";

const modelConfig = ref(null)
const paramForm = ref<InstanceType<typeof ParamForm> | null>(null)
const serverStore = useServerStore()
const soundPrompts = ref<StorageRecord[]>([])

const formData = ref({
    serverKey: '',
    promptId: 0,
    text: '',
    param: {}
});
const formDataParam = ref([])

onMounted(async () => {
    const old = StorageUtil.getObject('SoundCloneCreate.formData')
    formData.value.serverKey = old.serverKey || ''
    formData.value.promptId = old.promptName || 0
    formData.value.text = old.text || ''
    formData.value.param = old.param || {}
    soundPrompts.value = await StorageService.list('SoundPrompt')
})

watch(() => formData.value, async (value) => {
    StorageUtil.set('SoundCloneCreate.formData', value)
}, {
    deep: true
})

const onServerUpdate = async (config: any) => {
    formDataParam.value = config.functions.soundClone?.param || []
    modelConfig.value = config
}

const doSubmit = async () => {
    formData.value.param = paramForm.value?.getValue() || {}
    if (!formData.value.serverKey) {
        Dialog.tipError(t('请选择模型'))
        return
    }
    if (!formData.value.promptId) {
        Dialog.tipError(t('请选择音色'))
        return
    }
    const prompt = await StorageService.get(formData.value.promptId)
    if (!prompt) {
        Dialog.tipError(t('音色不存在'))
        return
    }
    if (!formData.value.text) {
        Dialog.tipError(t('请输入合成内容'))
        return
    }
    const server = await serverStore.getByKey(formData.value.serverKey)
    if (!server) {
        Dialog.tipError(t('模型不存在'))
        return
    }
    if (server.status !== EnumServerStatus.RUNNING) {
        Dialog.tipError(t('模型未启动'))
        return
    }
    const record: TaskRecord = {
        biz: 'SoundClone',
        serverName: server.name,
        serverTitle: server.title,
        serverVersion: server.version,
        modelConfig: {
            promptId: prompt.id,
            promptName: prompt.title,
            promptWav: prompt.content.url,
            promptText: prompt.content.promptText,
            text: formData.value.text,
        },
        param: formData.value.param,
    }
    if (!await PermissionService.checkForTask('SoundClone', record)) {
        return
    }
    const id = await TaskService.submit(record)
    formData.value.text = ''
    Dialog.tipSuccess(t('任务已经提交成功，等待克隆完成'))
    emit('submitted')
}

const doSubmitBatch = async (records: { text: string }[]) => {
    formData.value.param = paramForm.value?.getValue() || {}
    if (!formData.value.serverKey) {
        Dialog.tipError(t('请选择模型'))
        return
    }
    if (!formData.value.promptId) {
        Dialog.tipError(t('请选择音色'))
        return
    }
    const prompt = await StorageService.get(formData.value.promptId)
    if (!prompt) {
        Dialog.tipError(t('音色不存在'))
        return
    }
    const server = await serverStore.getByKey(formData.value.serverKey)
    if (!server) {
        Dialog.tipError(t('模型不存在'))
        return
    }
    if (server.status !== EnumServerStatus.RUNNING) {
        Dialog.tipError(t('模型未启动'))
        return
    }
    for (const r of records) {
        const record: TaskRecord = {
            biz: 'SoundClone',
            serverName: server.name,
            serverTitle: server.title,
            serverVersion: server.version,
            modelConfig: {
                promptId: prompt.id,
                promptName: prompt.title,
                promptWav: prompt.content.url,
                promptText: prompt.content.promptText,
                text: r.text,
            },
            param: formData.value.param,
        }
        if (!await PermissionService.checkForTask('SoundClone', record)) {
            return
        }
        await TaskService.submit(record)
    }
    Dialog.tipSuccess(t('任务已经提交成功，等待克隆完成'))
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
                <a-tooltip :content="$t('模型')">
                    <i class="iconfont icon-server"></i>
                </a-tooltip>
            </div>
            <div class="mr-3 w-96 flex-shrink-0">
                <ServerSelector v-model="formData.serverKey" @update="onServerUpdate" functionName="soundClone"/>
            </div>
            <div class="mr-1">
                <a-tooltip :content="$t('音色')">
                    <i class="iconfont icon-sound-prompt"></i>
                </a-tooltip>
            </div>
            <div class="mr-3 w-48">
                <a-select :placeholder="$t('音色')" size="small"
                          v-model="formData.promptId">
                    <a-option :value="0">
                        {{ $t('请选择') }}
                    </a-option>
                    <a-option v-for="s in soundPrompts"
                              :value="s.id">
                        {{ s.title }}
                    </a-option>
                </a-select>
            </div>
        </div>
        <div class="flex items-center min-h-12" v-if="formDataParam.length>0">
            <ParamForm ref="paramForm" :param="formDataParam"/>
        </div>
        <div class="pt-2">
            <a-textarea v-model="formData.text" :placeholder="$t('输入语音内容开始克隆')"></a-textarea>
        </div>
        <div class="pt-2 flex">
            <a-button class="mr-2" type="primary" @click="doSubmit">
                {{ $t('开始克隆') }}
            </a-button>
            <BatchTextareaInputAction :text="$t('批量克隆')" :confirm-text="$t('开始克隆')" @submit="doSubmitBatch"/>
            <ServerContentInfoAction :config="modelConfig as any" func="soundClone"/>
        </div>
    </div>
</template>

