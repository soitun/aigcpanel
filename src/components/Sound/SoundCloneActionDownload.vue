<script setup lang="ts">
import {Dialog} from "../../lib/dialog";
import {t} from "../../lang";
import {mapError} from "../../lib/error";
import {contentToFilenamePathPart} from "../../lib/aigcpanel";
import {TaskRecord} from "../../service/TaskService";

const props = defineProps<{
    record: TaskRecord,
}>()

const doDownload = async () => {
    const record = props.record
    const title = `${t('声音克隆')}_${record.id}_${contentToFilenamePathPart(record.text)}.wav`
    let filePath = await window.$mapi.file.openSave({
        defaultPath: title
    })
    if (filePath) {
        if (!filePath.endsWith('.wav')) {
            filePath = filePath + '.wav'
        }
        // console.log('filePath', record.resultWav, filePath)
        try {
            await window.$mapi.file.copy(record.resultWav as string, filePath, {isFullPath: true})
        } catch (e) {
            console.error(e)
            Dialog.tipError(mapError(e))
            return
        }
        Dialog.tipSuccess(t('下载成功'))
    }
}
</script>

<template>
    <a-tooltip :content="$t('下载')">
        <a-button class="mr-2"
                  :disabled="!record.resultWav"
                  @click="doDownload()">
            <template #icon>
                <icon-download/>
            </template>
        </a-button>
    </a-tooltip>
</template>
