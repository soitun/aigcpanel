<script setup lang="ts">
import {onMounted, ref} from "vue";
import {StorageRecord, StorageService} from "../../../service/StorageService";
import AudioPlayerButton from "../../../components/common/AudioPlayerButton.vue";
import SoundPromptDialog from "./SoundPromptDialog.vue";

const soundPromptDialog = ref<InstanceType<typeof SoundPromptDialog>>()
const records = ref<StorageRecord[]>([])
onMounted(async () => {
    await doRefresh()
})
const doRefresh = async () => {
    records.value = await StorageService.list('SoundPrompt')
}
const props = defineProps({
    modelValue: {
        type: Number,
        required: true,
        default: 0
    }
})
const emit = defineEmits(['update:modelValue'])
const onSelect = (id: number) => {
    emit('update:modelValue', id)
}

</script>

<template>
    <div class="flex items-center">
        <div @click="soundPromptDialog?.show()"
             class="w-96 mr-2 h-8 leading-8 px-3 rounded-lg cursor-pointer truncate bg-gray-100 hover:bg-gray-200">
            {{ records.find(s => s.id === props.modelValue)?.title || '选择音色' }}
        </div>
        <AudioPlayerButton
            v-if="props.modelValue"
            class="mr-2 arco-btn arco-btn-secondary arco-btn-shape-square arco-btn-size-medium arco-btn-status-normal"
            :source="'file://'+records.find(s => s.id === props.modelValue)?.content?.url"/>
    </div>
    <SoundPromptDialog ref="soundPromptDialog" @update="doRefresh" @select="onSelect"/>
</template>
