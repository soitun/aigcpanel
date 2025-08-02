<script setup lang="ts">
import {Dialog} from "../../lib/dialog";
import {t} from "../../lang";
import {sleep} from "../../lib/util";
import {TaskRecord} from "../../service/TaskService";
import {computed} from "vue";
import {useServerStore} from "../../store/modules/server";

const serverStore = useServerStore();

const props = defineProps<{
    record: TaskRecord;
}>();

const doCancel = async () => {
    const record = props.record;
    Dialog.loadingOn(t("正在停止运行"));
    try {
        await sleep(500);
        await serverStore.cancelByNameVersion(record.serverName, record.serverVersion);
        Dialog.loadingOff();
        Dialog.tipSuccess(t("停止运行成功"));
    } catch (e) {
        Dialog.loadingOff();
        Dialog.tipError(t("停止运行失败"));
    }
};
const isCloud = computed(() => {
    return props.record.serverName.startsWith("Cloud");
});
</script>

<template>
    <a-tooltip v-if="!isCloud && record.status === 'running'" :content="$t('停止运行')" mini>
        <a-button class="mr-2" type="primary" status="danger" @click="doCancel()">
            <template #icon>
                <icon-record-stop />
            </template>
        </a-button>
    </a-tooltip>
</template>
