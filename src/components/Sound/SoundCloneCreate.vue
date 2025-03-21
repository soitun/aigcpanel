<script setup lang="ts">

import ServerSelector from "../Server/ServerSelector.vue";
import {onMounted, ref, watch} from "vue";
import {useServerStore} from "../../store/modules/server";
import {Dialog} from "../../lib/dialog";
import {StorageUtil} from "../../lib/storage";
import {useSoundClonePromptStore} from "../../store/modules/soundClonePrompt";
import {t} from "../../lang";
import {EnumServerStatus} from "../../types/Server";
import ParamForm from "../common/ParamForm.vue";
import {mapError} from "../../lib/error";
import {PermissionService} from "../../service/PermissionService";
import ServerContentInfoAction from "../Server/ServerContentInfoAction.vue";
import {TaskRecord, TaskService} from "../../service/TaskService";

const modelConfig = ref(null)
const paramForm = ref<InstanceType<typeof ParamForm> | null>(null)
const soundClonePromptStore = useSoundClonePromptStore()
const serverStore = useServerStore()

const formData = ref({
    serverKey: '',
    promptName: '',
    text: '',
    param: {}
});
const formDataParam = ref([])

onMounted(() => {
    const old = StorageUtil.getObject('SoundCloneCreate.formData')
    formData.value.serverKey = old.serverKey || ''
    formData.value.promptName = old.promptName || ''
    formData.value.text = old.text || ''
    formData.value.param = old.param || {}
})

watch(() => formData.value, async (value) => {
    StorageUtil.set('SoundCloneCreate.formData', value)
}, {
    deep: true
})

watch(() => formData.value.serverKey, async (value) => {
    // console.log('formData.serverKey', value)
    const server = await serverStore.getByKey(value)
    if (server) {
        const res = await window.$mapi.server.config(await serverStore.serverInfo(server))
        if (res.code) {
            Dialog.tipError(mapError(res.msg))
            return
        }
        formDataParam.value = res.data.functions.soundClone?.param || []
        modelConfig.value = res.data
    }
})

const doSubmit = async () => {
    formData.value.param = paramForm.value?.getValue() || {}
    if (!formData.value.serverKey) {
        Dialog.tipError(t('请选择模型'))
        return
    }
    if (!formData.value.promptName) {
        Dialog.tipError(t('请选择声音角色'))
        return
    }
    const prompt = await soundClonePromptStore.getByName(formData.value.promptName)
    if (!prompt) {
        Dialog.tipError(t('声音角色不存在'))
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
        biz:'SoundClone',
        serverName: server.name,
        serverTitle: server.title,
        serverVersion: server.version,
        modelConfig: {
            promptName: prompt.name,
            promptWav: prompt.promptWav,
            promptText: prompt.promptText,
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
                <ServerSelector v-model="formData.serverKey" functionName="soundClone"/>
            </div>
            <div class="mr-1">
                <a-tooltip :content="$t('声音角色')">
                    <i class="iconfont icon-sound-prompt"></i>
                </a-tooltip>
            </div>
            <div class="mr-3 w-48">
                <a-select :placeholder="$t('声音角色')" size="small"
                          v-model="formData.promptName">
                    <a-option v-for="s in soundClonePromptStore.records">
                        {{ s.name }}
                    </a-option>
                </a-select>
            </div>
        </div>
        <div class="flex items-center min-h-12" v-if="formDataParam.length>0">
            <ParamForm ref="paramForm" :param="formDataParam"/>
        </div>
        <div class="pt-4">
            <a-textarea v-model="formData.text" :placeholder="$t('输入语音内容开始克隆')"></a-textarea>
        </div>
        <div class="pt-2">
            <a-button class="mr-2" type="primary" @click="doSubmit">
                {{ $t('开始克隆') }}
            </a-button>
            <ServerContentInfoAction :config="modelConfig as any" func="soundClone"/>
        </div>
    </div>
</template>

