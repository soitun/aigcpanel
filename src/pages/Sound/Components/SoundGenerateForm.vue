<script setup lang="ts">

import {onMounted, ref, watch} from "vue";
import ServerSelector from "../../../components/Server/ServerSelector.vue";
import {StorageUtil} from "../../../lib/storage";
import ParamForm from "../../../components/common/ParamForm.vue";
import SoundPromptSelector from "./SoundPromptSelector.vue";
import SoundPromptDialog from "./SoundPromptDialog.vue";
import ServerContentInfoAction from "../../../components/Server/ServerContentInfoAction.vue";
import {Dialog} from "../../../lib/dialog";
import {t} from "../../../lang";
import {useServerStore} from "../../../store/modules/server";
import {EnumServerStatus} from "../../../types/Server";
import {StorageService} from "../../../service/StorageService";

const serverStore = useServerStore()
const formData = ref({
    type: 'SoundTts',
    ttsServerKey: '',
    cloneServerKey: '',
    promptId: 0,
});
const ttsParamForm = ref<InstanceType<typeof ParamForm>>()
const cloneParamForm = ref<InstanceType<typeof ParamForm>>()
const ttsParam = ref([])
const cloneParam = ref([])
const ttsModelConfig = ref(null)
const cloneModelConfig = ref(null)
const onSoundTtsServerUpdate = async (config: any) => {
    ttsParam.value = config.functions.soundTts?.param || []
    ttsModelConfig.value = config
}

const onSoundCloneServerUpdate = async (config: any) => {
    cloneParam.value = config.functions.soundClone?.param || []
    cloneModelConfig.value = config
}
onMounted(async () => {
    const old = StorageUtil.getObject('SoundGenerateForm.formData')
    formData.value.type = old.type || 'SoundTts'
    formData.value.ttsServerKey = old.ttsServerKey || ''
    formData.value.cloneServerKey = old.cloneServerKey || ''
    formData.value.promptId = old.promptId || 0
})
watch(() => formData.value, async (value) => {
    StorageUtil.set('SoundGenerateForm.formData', value)
}, {
    deep: true
})

const getValue = async (): Promise<{
    serverName: string,
    serverTitle: string,
    serverVersion: string,
    type: 'SoundTts' | 'SoundClone',
    ttsServerKey?: string,
    ttsParam?: any[],
    cloneServerKey?: string,
    cloneParam?: any[],
    promptId?: number,
    promptTitle?: string,
    promptUrl?: string,
    promptText?: string,
} | undefined> => {
    const data: any = {}
    data.type = formData.value.type
    if (!data.type) {
        Dialog.tipError(t('请选择合成类型'))
        return
    }
    if (data.type === 'SoundTts') {
        data.ttsServerKey = formData.value.ttsServerKey
        const server = await serverStore.getByKey(data.ttsServerKey)
        if (!server) {
            Dialog.tipError(t('请选择声音模型'))
            return
        }
        if (server.status !== EnumServerStatus.RUNNING) {
            Dialog.tipError(t('声音模型未启动'))
            return
        }
        data.serverName = server.name
        data.serverTitle = server.title
        data.serverVersion = server.version
        data.ttsParam = ttsParamForm.value?.getValue()
        if (!data.ttsParam) {
            Dialog.tipError(t('声音合成参数不正确'))
            return
        }
    } else if (data.type === 'SoundClone') {
        data.cloneServerKey = formData.value.cloneServerKey
        data.promptId = formData.value.promptId
        const server = await serverStore.getByKey(data.cloneServerKey)
        if (!server) {
            Dialog.tipError(t('请选择声音模型'))
            return
        }
        if (server.status !== EnumServerStatus.RUNNING) {
            Dialog.tipError(t('声音模型未启动'))
            return
        }
        data.serverName = server.name
        data.serverTitle = server.title
        data.serverVersion = server.version
        data.cloneParam = cloneParamForm.value?.getValue()
        console.log('data.cloneParam', data.cloneParam)
        if (!data.cloneParam) {
            Dialog.tipError(t('声音合成参数不正确'))
            return
        }
        if (!data.promptId) {
            Dialog.tipError(t('请选择声音音色'))
            return
        }
        const prompt = await StorageService.get(data.promptId)
        if (!prompt) {
            Dialog.tipError(t('声音音色不存在'))
            return
        }
        data.promptTitle = prompt.title
        data.promptUrl = prompt.content.url
        data.promptText = prompt.content.promptText
    }
    return data
}

defineExpose({
    getValue
})

</script>

<template>
    <div class="flex items-center h-12">
        <div class="mr-1">
            <a-tooltip :content="$t('合成类型')" mini>
                <i class="iconfont icon-sound"></i>
            </a-tooltip>
        </div>
        <div class="mr-1">
            <a-radio-group v-model="formData.type">
                <a-radio value="SoundTts">
                    <i class="iconfont icon-sound-generate"></i>
                    {{ $t('声音合成') }}
                </a-radio>
                <a-radio value="SoundClone">
                    <i class="iconfont icon-sound-clone"></i>
                    {{ $t('声音克隆') }}
                </a-radio>
            </a-radio-group>
        </div>
    </div>
    <div v-if="formData.type==='SoundTts'" class="flex items-center h-12">
        <div class="mr-1">
            <a-tooltip :content="$t('声音模型')" mini>
                <i class="iconfont icon-server"></i>
            </a-tooltip>
        </div>
        <div class="mr-2 w-96 flex-shrink-0">
            <ServerSelector v-model="formData.ttsServerKey"
                            @update="onSoundTtsServerUpdate"
                            functionName="soundTts"/>
        </div>
        <div>
            <ServerContentInfoAction :config="ttsModelConfig as any" func="soundTts"/>
        </div>
    </div>
    <div v-if="formData.type==='SoundClone'" class="flex items-center h-12">
        <div class="mr-1">
            <a-tooltip :content="$t('声音模型')" mini>
                <i class="iconfont icon-server"></i>
            </a-tooltip>
        </div>
        <div class="mr-2 w-96 flex-shrink-0">
            <ServerSelector v-model="formData.cloneServerKey"
                            @update="onSoundCloneServerUpdate"
                            functionName="soundClone"/>
        </div>
        <div>
            <ServerContentInfoAction :config="cloneModelConfig as any" func="soundClone"/>
        </div>
    </div>
    <div v-if="formData.type==='SoundClone'" class="flex items-center h-12">
        <div class="mr-1">
            <a-tooltip :content="$t('声音音色')" mini>
                <i class="iconfont icon-sound-prompt"></i>
            </a-tooltip>
        </div>
        <div class="mr-2 w-96 flex-shrink-0 flex items-center">
            <SoundPromptSelector v-model="formData.promptId"/>
        </div>
    </div>
    <div class="flex items-center"
         v-if="formData.type==='SoundTts'">
        <ParamForm ref="ttsParamForm" :param="ttsParam"/>
    </div>
    <div class="flex items-center"
         v-if="formData.type==='SoundClone'">
        <ParamForm ref="cloneParamForm" :param="cloneParam"/>
    </div>
    <SoundPromptDialog/>
</template>
