<script setup lang="ts">
import { ref } from "vue";
import { Dialog } from "../../../lib/dialog";

interface AsrRecord {
    start: number;
    end: number;
    text: string;
}

interface EditingAsrRecord extends AsrRecord {
    startSeconds?: number;  // 开始时间的秒数（包含小数部分）
    endSeconds?: number;    // 结束时间的秒数（包含小数部分）
}

const emit = defineEmits<{
    save: [records: AsrRecord[], taskId?: string];
}>();

const visible = ref(false);
const editingRecords = ref<EditingAsrRecord[]>([]);
const currentRecords = ref<AsrRecord[]>([]);
const currentTaskId = ref<string>('');

const show = (records: AsrRecord[], taskId?: string) => {
    currentRecords.value = records;
    currentTaskId.value = taskId || '';
    initEditingRecords();
    visible.value = true;
};

const edit = (records: AsrRecord[], taskId?: string) => {
    show(records, taskId);
};

// 初始化编辑记录
const initEditingRecords = () => {
    if (!currentRecords.value || currentRecords.value.length === 0) {
        editingRecords.value = [];
        return;
    }

    editingRecords.value = currentRecords.value.map(record => {
        return {
            ...record,
            startSeconds: record.start / 1000,  // 毫秒转换为秒
            endSeconds: record.end / 1000,      // 毫秒转换为秒
        };
    });
};

// 从秒转换为毫秒
const secondsToMs = (seconds: number) => {
    return Math.round(seconds * 1000);
};

// 保存编辑
const doSave = () => {
    if (!editingRecords.value || editingRecords.value.length === 0) {
        Dialog.tipError('没有编辑记录');
        return;
    }
    // 转换为原始格式
    const finalRecords = editingRecords.value.map(record => ({
        start: secondsToMs(record.startSeconds || 0),
        end: secondsToMs(record.endSeconds || 0),
        text: record.text
    }));
    emit('save', finalRecords, currentTaskId.value);
    visible.value = false;
};

// 取消编辑
const doCancel = () => {
    visible.value = false;
    editingRecords.value = [];
};

// 删除记录
const doDelete = (index: number) => {
    editingRecords.value.splice(index, 1);
};

// 在指定记录前插入
const doInsertBefore = (index: number) => {
    const currentRecord = editingRecords.value[index];
    const prevRecord = editingRecords.value[index - 1];

    const startSeconds = prevRecord ? (prevRecord.endSeconds || 0) : 0;
    const endSeconds = currentRecord.startSeconds || 0;

    const newRecord: EditingAsrRecord = {
        start: secondsToMs(startSeconds),
        end: secondsToMs(endSeconds),
        text: '',
        startSeconds: startSeconds,
        endSeconds: endSeconds,
    };

    editingRecords.value.splice(index, 0, newRecord);
};

// 上移记录
const doMoveUp = (index: number) => {
    if (index > 0) {
        [editingRecords.value[index - 1], editingRecords.value[index]] =
            [editingRecords.value[index], editingRecords.value[index - 1]];
    }
};

// 下移记录
const doMoveDown = (index: number) => {
    if (index < editingRecords.value.length - 1) {
        [editingRecords.value[index], editingRecords.value[index + 1]] =
            [editingRecords.value[index + 1], editingRecords.value[index]];
    }
};

defineExpose({
    show,
    edit,
});
</script>

<template>
    <a-modal v-model:visible="visible" width="900px" title-align="start">
        <template #title>
            {{ $t("编辑识别结果") }}
        </template>
        <template #footer>
            <a-button @click="doCancel">{{ $t("取消") }}</a-button>
            <a-button type="primary" @click="doSave">{{ $t("保存") }}</a-button>
        </template>
        <div class="-m-4">
            <!-- 没有数据提示 -->
            <div v-if="editingRecords.length === 0" class="text-center text-gray-500 py-4">
                {{ $t("没有可编辑的数据") }}
            </div>
            <!-- 表格编辑 -->
            <a-table v-else :data="editingRecords" :scroll="{ y: 'calc(100vh - 20rem)' }" :pagination="false"
                size="small">
                <template #columns>
                    <a-table-column :title="$t('序号')" :width="60">
                        <template #cell="{ rowIndex }">
                            {{ rowIndex + 1 }}
                        </template>
                    </a-table-column>

                    <a-table-column :title="$t('开始时间')" :width="120">
                        <template #cell="{ record }">
                            <a-input-number v-model="record.startSeconds" :precision="3" :step="0.001" :min="0"
                                size="mini" placeholder="0.000" style="width: 100px" />
                        </template>
                    </a-table-column>

                    <a-table-column :title="$t('结束时间')" :width="120">
                        <template #cell="{ record }">
                            <a-input-number v-model="record.endSeconds" :precision="3" :step="0.001" :min="0"
                                size="mini" placeholder="0.000" style="width: 100px" />
                        </template>
                    </a-table-column>

                    <a-table-column :title="$t('句子')">
                        <template #cell="{ record }">
                            <a-textarea size="mini" v-model="record.text" :auto-size="{ minRows: 1, maxRows: 3 }" />
                        </template>
                    </a-table-column>

                    <a-table-column :title="$t('操作')" :width="140">
                        <template #cell="{ rowIndex }">
                            <a-button-group size="mini">
                                <a-tooltip :content="$t('上移')" mini>
                                    <a-button @click="doMoveUp(rowIndex)" :disabled="rowIndex === 0">
                                        <template #icon>
                                            <icon-up />
                                        </template>
                                    </a-button>
                                </a-tooltip>
                                <a-tooltip :content="$t('下移')" mini>
                                    <a-button @click="doMoveDown(rowIndex)"
                                        :disabled="rowIndex === editingRecords.length - 1">
                                        <template #icon>
                                            <icon-down />
                                        </template>
                                    </a-button>
                                </a-tooltip>
                                <a-tooltip :content="$t('前插入')" mini>
                                    <a-button @click="doInsertBefore(rowIndex)">
                                        <template #icon>
                                            <icon-plus />
                                        </template>
                                    </a-button>
                                </a-tooltip>
                                <a-tooltip :content="$t('删除')" mini>
                                    <a-button status="danger" @click="doDelete(rowIndex)">
                                        <template #icon>
                                            <icon-delete />
                                        </template>
                                    </a-button>
                                </a-tooltip>
                            </a-button-group>
                        </template>
                    </a-table-column>
                </template>
            </a-table>
        </div>
    </a-modal>
</template>
