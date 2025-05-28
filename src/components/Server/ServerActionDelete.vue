<script setup lang="ts">
import {EnumServerStatus, EnumServerType, ServerRecord} from "../../types/Server";
import {Dialog} from "../../lib/dialog";
import {t} from "../../lang";
import {sleep} from "../../lib/util";
import {useServerStore} from "../../store/modules/server";

const serverStore = useServerStore()

const props = defineProps<{
    record: ServerRecord,
}>()
const emit = defineEmits({
    update: () => true
})

const doDelete = async () => {
    const record = props.record
    await Dialog.confirm(t('确定删除模型 {title} v{version} 吗？', {title: record.title, version: record.version}))
    Dialog.loadingOn(t('正在删除'))
    await sleep(500)
    await serverStore.delete(record)
    Dialog.loadingOff()
    emit('update')
}
</script>

<template>
    <a-tooltip :content="$t('删除')" mini>
        <a-button class="mr-2"
                  :disabled="record.type===EnumServerType.LOCAL_DIR&&record.status!==EnumServerStatus.STOPPED&&record.status!==EnumServerStatus.ERROR"
                  @click="doDelete()">
            <template #icon>
                <icon-delete/>
            </template>
        </a-button>
    </a-tooltip>
</template>
