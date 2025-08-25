<script setup lang="ts">
import {ref} from "vue";
import {t} from "../../../lang";
import {Dialog} from "../../../lib/dialog";

interface AsrRecord {
    start: number;
    end: number;
    text: string;
}

interface EditingAsrRecord extends AsrRecord {
    startSeconds?: number; // 开始时间的秒数（包含小数部分）
    endSeconds?: number; // 结束时间的秒数（包含小数部分）
}

const props = defineProps({
    saveTitle: {
        type: String,
        default: t("保存"),
    },
});

const emit = defineEmits<{
    save: [taskId: number, records: AsrRecord[]];
}>();

const visible = ref(false);
const editingRecords = ref<EditingAsrRecord[]>([]);
const currentRecords = ref<AsrRecord[]>([]);
const currentTaskId = ref<number>(0);

const edit = (taskId: number, records: AsrRecord[]) => {
    currentRecords.value = records;
    currentTaskId.value = taskId || 0;
    initEditingRecords();
    visible.value = true;
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
            startSeconds: record.start / 1000, // 毫秒转换为秒
            endSeconds: record.end / 1000, // 毫秒转换为秒
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
        Dialog.tipError("没有编辑记录");
        return;
    }
    // 转换为原始格式
    const finalRecords = editingRecords.value.map(record => ({
        start: secondsToMs(record.startSeconds || 0),
        end: secondsToMs(record.endSeconds || 0),
        text: record.text,
    }));
    emit("save", currentTaskId.value, finalRecords);
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

    const startSeconds = prevRecord ? prevRecord.endSeconds || 0 : 0;
    const endSeconds = currentRecord.startSeconds || 0;

    const newRecord: EditingAsrRecord = {
        start: secondsToMs(startSeconds),
        end: secondsToMs(endSeconds),
        text: "",
        startSeconds: startSeconds,
        endSeconds: endSeconds,
    };

    editingRecords.value.splice(index, 0, newRecord);
};

// 上移记录
const doMoveUp = (index: number) => {
    if (index > 0) {
        [editingRecords.value[index - 1], editingRecords.value[index]] = [
            editingRecords.value[index],
            editingRecords.value[index - 1],
        ];
    }
};

// 下移记录
const doMoveDown = (index: number) => {
    if (index < editingRecords.value.length - 1) {
        [editingRecords.value[index], editingRecords.value[index + 1]] = [
            editingRecords.value[index + 1],
            editingRecords.value[index],
        ];
    }
};

// 查找替换功能
const findText = ref("");
const replaceText = ref("");

const onFindReplace = () => {
    if (!findText.value.trim()) {
        Dialog.tipError("请输入查找内容");
        return;
    }

    let replaceCount = 0;
    editingRecords.value.forEach(record => {
        if (record.text.includes(findText.value)) {
            record.text = record.text.replace(new RegExp(findText.value, "g"), replaceText.value);
            replaceCount++;
        }
    });

    if (replaceCount > 0) {
        Dialog.tipSuccess(`已替换 ${replaceCount} 条记录`);
    } else {
        Dialog.tipError("未找到匹配的内容");
    }
};

defineExpose({
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
            <a-button type="primary" @click="doSave">{{ props.saveTitle }}</a-button>
        </template>
        <div class="-m-4">
            <!-- 快捷操作区域 -->
            <div class="bg-gray-50 p-4 border-b">
                <div class="flex items-center gap-3">
                    <div class="text-sm font-medium text-gray-700 min-w-max">{{ $t("批量替换") }}:</div>
                    <a-input
                        v-model="findText"
                        :placeholder="$t('查找')"
                        size="small"
                        style="width: 150px"
                        allow-clear
                    />
                    <a-input
                        v-model="replaceText"
                        :placeholder="$t('替换')"
                        size="small"
                        style="width: 150px"
                        allow-clear
                    />
                    <a-button size="small" @click="onFindReplace" :disabled="!findText.trim()">
                        {{ $t("执行") }}
                    </a-button>
                </div>
            </div>

            <!-- 没有数据提示 -->
            <div v-if="editingRecords.length === 0" class="text-center text-gray-500 py-4">
                {{ $t("没有可编辑的数据") }}
            </div>
            <!-- 表格编辑 -->
            <a-table
                v-else
                :data="editingRecords"
                :scroll="{y: 'calc(100vh - 20rem)'}"
                :pagination="false"
                size="small"
            >
                <template #columns>
                    <a-table-column :title="$t('序号')" :width="60">
                        <template #cell="{rowIndex}">
                            {{ rowIndex + 1 }}
                        </template>
                    </a-table-column>

                    <a-table-column :title="$t('开始时间')" :width="120">
                        <template #cell="{record}">
                            <a-input-number
                                v-model="record.startSeconds"
                                :precision="3"
                                :step="0.001"
                                :min="0"
                                size="mini"
                                placeholder="0.000"
                                style="width: 100px"
                            />
                        </template>
                    </a-table-column>

                    <a-table-column :title="$t('结束时间')" :width="120">
                        <template #cell="{record}">
                            <a-input-number
                                v-model="record.endSeconds"
                                :precision="3"
                                :step="0.001"
                                :min="0"
                                size="mini"
                                placeholder="0.000"
                                style="width: 100px"
                            />
                        </template>
                    </a-table-column>

                    <a-table-column :title="$t('句子')">
                        <template #cell="{record}">
                            <a-textarea
                                size="mini"
                                v-model="record.text"
                                :max-length="20000"
                                :auto-size="{minRows: 1}"
                                show-word-limit
                            />
                        </template>
                    </a-table-column>

                    <a-table-column :title="$t('操作')" :width="140">
                        <template #cell="{rowIndex}">
                            <a-button-group size="mini">
                                <a-tooltip :content="$t('上移')" mini>
                                    <a-button @click="doMoveUp(rowIndex)" :disabled="rowIndex === 0">
                                        <template #icon>
                                            <icon-up />
                                        </template>
                                    </a-button>
                                </a-tooltip>
                                <a-tooltip :content="$t('下移')" mini>
                                    <a-button
                                        @click="doMoveDown(rowIndex)"
                                        :disabled="rowIndex === editingRecords.length - 1"
                                    >
                                        <template #icon>
                                            <icon-down />
                                        </template>
                                    </a-button>
                                </a-tooltip>
                                <a-tooltip :content="$t('再之前插入')" mini>
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
