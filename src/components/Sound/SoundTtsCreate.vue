<script setup lang="ts">

import ServerSelector from "../Server/ServerSelector.vue";
import {onMounted, ref, watch} from "vue";
import {useServerStore} from "../../store/modules/server";
import {Dialog} from "../../lib/dialog";
import {TaskRecord, TaskService} from "../../service/TaskService";
import {StorageUtil} from "../../lib/storage";
import {t} from "../../lang";
import {EnumServerStatus} from "../../types/Server";
import ParamForm from "../common/ParamForm.vue";
import {PermissionService} from "../../service/PermissionService";
import ServerContentInfoAction from "../Server/ServerContentInfoAction.vue";
import BatchTextareaInputAction from "../BatchTextareaInputAction.vue";

const serverStore = useServerStore()

const paramForm = ref<InstanceType<typeof ParamForm> | null>(null)
const modelConfig = ref(null)
const formData = ref({
    serverKey: '',
    text: '',
    param: {},
});
const formDataParam = ref([])

onMounted(() => {
    const old = StorageUtil.getObject('SoundTtsCreate.formData')
    formData.value.serverKey = old.serverKey || ''
    formData.value.text = old.text || ''
    formData.value.param = {}
})

watch(() => formData.value, async (value) => {
    StorageUtil.set('SoundTtsCreate.formData', value)
}, {
    deep: true
})

const onServerUpdate = async (config: any) => {
    formDataParam.value = config.functions.soundTts?.param || []
    modelConfig.value = config
}

const doSubmit = async () => {
    formData.value.param = paramForm.value?.getValue() || {}
    if (!formData.value.serverKey) {
        Dialog.tipError(t('请选择模型'))
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
    if (!formData.value.text) {
        Dialog.tipError(t('请输入合成内容'))
        return
    }
    const record: TaskRecord = {
        biz: 'SoundTts',
        title: await window.$mapi.file.textToName(formData.value.text),
        serverName: server.name,
        serverTitle: server.title,
        serverVersion: server.version,
        modelConfig: {
            text: formData.value.text,
        },
        param: formData.value.param,
    }
    if (!await PermissionService.checkForTask('SoundTts', record)) {
        return
    }
    const id = await TaskService.submit(record)
    formData.value.text = ''
    Dialog.tipSuccess(t('任务已经提交成功，等待合成完成'))
    emit('submitted')
}

const doSubmitBatch = async (records: { text: string }[]) => {
    formData.value.param = paramForm.value?.getValue() || {}
    const server = await serverStore.getByKey(formData.value.serverKey)
    if (!formData.value.serverKey) {
        Dialog.tipError(t('请选择模型'))
        return
    }
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
            biz: 'SoundTts',
            title: await window.$mapi.file.textToName(r.text),
            serverName: server.name,
            serverTitle: server.title,
            serverVersion: server.version,
            modelConfig: {
                text: r.text,
            },
            param: formData.value.param,
        }
        if (!await PermissionService.checkForTask('SoundTts', record)) {
            return
        }
        await TaskService.submit(record)
    }
    Dialog.tipSuccess(t('任务已经提交成功，等待合成完成'))
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
                <a-popover position="bottom">
                    <i class="iconfont icon-server"></i>
                    <template #content>
                        <div class="text-sm -my-2">
                            <div class="font-bold mb-2">{{ $t('模型') }}</div>
                        </div>
                    </template>
                </a-popover>
            </div>
            <div class="mr-3 w-96 flex-shrink-0">
                <ServerSelector v-model="formData.serverKey" @update="onServerUpdate" functionName="soundTts"/>
            </div>
        </div>
        <div class="flex items-center min-h-12" v-if="formDataParam.length>0">
            <ParamForm ref="paramForm" :param="formDataParam"/>
        </div>
        <div class="pt-2">
            <a-textarea v-model="formData.text"
                        :auto-size="{minRows:2}"
                        :placeholder="$t('输入语音内容开始合成')"></a-textarea>
        </div>
        <div class="pt-2 flex items-center">
            <a-button class="mr-2" type="primary" @click="doSubmit">
                {{ $t('开始合成') }}
            </a-button>
            <BatchTextareaInputAction :text="$t('批量合成')" :confirm-text="$t('开始合成')" @submit="doSubmitBatch"/>
            <ServerContentInfoAction :config="modelConfig as any" func="soundTts"/>
        </div>
    </div>
</template>
