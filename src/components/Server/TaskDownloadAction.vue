<script setup lang="ts">
import {Dialog} from "../../lib/dialog";
import {t} from "../../lang";
import {TaskRecord} from "../../service/TaskService";
import {computed} from "vue";
import {mapError} from "../../lib/error";

const props = defineProps<{
    record: TaskRecord,
}>()

const canDownload = computed(() => {
    if (!props.record) {
        return false
    }
    return props.record.status === 'success' && props.record.result.url
})

const doDownload = async () => {
    let filePath = await window.$mapi.file.openSave({
        defaultPath: props.record.title + '.wav'
    })
    if (!filePath) {
        return
    }
    let fromPath = props.record.result.url
    if (props.record.biz === 'SoundTts' || props.record.biz === 'SoundClone') {
        if (!filePath.endsWith('.wav')) {
            filePath = filePath + '.wav'
        }
    } else if (props.record.biz === 'VideoGen' || props.record.biz === 'VideoGenFlow') {
        if (!filePath.endsWith('.mp4')) {
            filePath = filePath + '.mp4'
        }
    }
    try {
        await window.$mapi.file.copy(fromPath, filePath, {
            isFullPath: true,
        })
    } catch (e) {
        Dialog.tipError(mapError(e))
        return
    }
    Dialog.tipSuccess(t('下载成功'))
}
</script>

<template>
    <a-tooltip :content="$t('下载')">
        <a-button class="mr-2"
                  :disabled="!canDownload"
                  @click="doDownload()">
            <template #icon>
                <icon-download/>
            </template>
        </a-button>
    </a-tooltip>
</template>
