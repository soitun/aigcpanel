<script setup lang="ts">
import {Dialog} from "../../lib/dialog";
import {t} from "../../lang";
import {sleep} from "../../lib/util";
import {TaskRecord, TaskService} from "../../service/TaskService";

const props = defineProps<{
    record: TaskRecord,
}>()
const emit = defineEmits({
    update: () => true
})

const doDelete = async () => {
    const record = props.record
    Dialog.loadingOn(t('正在删除'))
    await sleep(500)
    await TaskService.delete(record)
    Dialog.loadingOff()
    emit('update')
}
</script>

<template>
    <a-tooltip :content="$t('删除')" mini>
        <a-button class="mr-2"
                  :disabled="record.status!=='success'&&record.status!=='fail'"
                  @click="doDelete()">
            <template #icon>
                <icon-delete/>
            </template>
        </a-button>
    </a-tooltip>
</template>
