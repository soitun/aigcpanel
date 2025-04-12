<script setup lang="ts">
import {ref} from "vue";
import {useModelStore} from "../store/model";
import {Dialog} from "../../../lib/dialog";
import {mapError} from "../../../lib/error";
import {t} from "../../../lang";

const modelStore = useModelStore()
const props = defineProps({
    provider: {
        type: Object,
        default: () => {
            return null
        }
    }
})
const visible = ref(false)
const data = ref({
    modelId: '',
})
const show = () => {
    data.value.modelId = ''
    if (props.provider) {
        if (props.provider.data.models.length > 0) {
            data.value.modelId = props.provider.data.models[0].id
        }
    }
    visible.value = true
}
const doSubmit = async () => {
    if (!data.value.modelId) {
        return
    }
    try {
        await modelStore.test(props.provider.id, data.value.modelId)
        Dialog.tipSuccess(t('测试成功'))
    } catch (e) {
        Dialog.tipError(mapError(e))
    }
}
defineExpose({
    show,
})

</script>

<template>
    <a-modal
        v-model:visible="visible"
        width="20rem"
        :esc-to-close="false"
        :mask-closable="false"
        title-align="start">
        <template #title>
            {{ $t('请选择要检测的模型') }}
        </template>
        <template #footer>
            <a-button type="primary" @click="doSubmit">{{ $t('测试') }}</a-button>
            <a-button @click="visible = false">{{ $t('关闭') }}</a-button>
        </template>
        <div style="max-height:50vh;" class="overflow-y-auto" v-if="props.provider">
            <a-form
                :model="data"
                layout="vertical"
                class="mt-4">
                <a-form-item name="modelId">
                    <a-select v-model:model-value="data.modelId">
                        <a-option v-for="model in props.provider.data.models" :key="model.id" :value="model.id">
                            {{ model.name }}
                        </a-option>
                    </a-select>
                </a-form-item>
            </a-form>
        </div>
    </a-modal>
</template>

<style scoped>

</style>
