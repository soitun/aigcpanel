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
    const fileExt = await window.$mapi.file.ext(props.record.result.url)
    let filePath = await window.$mapi.file.openSave({
        defaultPath: props.record.title + `.${fileExt}`
    })
    if (!filePath) {
        return
    }
    if (!filePath.endsWith(`.${fileExt}`)) {
        filePath = filePath + `.${fileExt}`
    }
    let fromPath = props.record.result.url
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
    <a-tooltip :content="$t('下载')" mini>
        <a-button class="mr-2"
                  :disabled="!canDownload"
                  @click="doDownload()">
            <template #icon>
                <icon-download/>
            </template>
        </a-button>
    </a-tooltip>
</template>
