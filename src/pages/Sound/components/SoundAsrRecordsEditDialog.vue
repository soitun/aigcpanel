<script setup lang="ts">
import {computed, nextTick, ref} from "vue";
import {t} from "../../../lang";
import {Dialog} from "../../../lib/dialog";
import {TimeUtil} from "../../../lib/util";
import ModelGenerateButton, {ModelGenerateButtonOptionType} from "../../../module/Model/ModelGenerateButton.vue";
import {SoundAsrResultOptimizedPrompt} from "../config/prompt";

interface AsrRecord {
    start: number;
    end: number;
    text: string;
}

interface EditingAsrRecord extends AsrRecord {
    startSeconds?: number;
    endSeconds?: number;
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
const currentAudio = ref<string>("");
const currentDuration = ref<number>(0);
const currentIndex = ref<number>(-1);
const audioRef = ref<HTMLAudioElement | null>(null);
const sliderMin = ref(0);
const sliderMax = ref(0);
const sliderValue = ref(0);
const selectedIndexes = ref<number[]>([]);
const lastSelectedIndex = ref<number>(-1);

// 计算属性：检查是否有连续的空白片段
const hasConsecutiveBlanks = computed(() => {
    for (let i = 0; i < editingRecords.value.length - 1; i++) {
        if (editingRecords.value[i].text.trim() === '' && editingRecords.value[i + 1].text.trim() === '') {
            return true;
        }
    }
    return false;
});

// 计算属性：总字数统计
const totalWords = computed(() => {
    return editingRecords.value.reduce((sum, record) => sum + record.text.length, 0);
});

const edit = (taskId: number, records: AsrRecord[], audio: string, duration: number) => {
    currentRecords.value = records;
    currentTaskId.value = taskId || 0;
    currentAudio.value = `file://${audio}`;
    currentDuration.value = duration || 0;
    currentIndex.value = -1;
    selectedIndexes.value = [];
    lastSelectedIndex.value = -1;
    initEditingRecords();
    visible.value = true;
};

// 初始化编辑记录，补全空白时间
const initEditingRecords = () => {
    if (!currentRecords.value || currentRecords.value.length === 0) {
        editingRecords.value = [];
        return;
    }

    const sortedRecords = [...currentRecords.value].sort((a, b) => a.start - b.start);
    const filledRecords: EditingAsrRecord[] = [];
    let currentTime = 0;
    sortedRecords.forEach(record => {
        if (record.start > currentTime) {
            filledRecords.push({
                start: currentTime,
                end: record.start - 1,
                text: "",
                startSeconds: currentTime / 1000,
                endSeconds: record.start / 1000 - 0.001,
            });
        }
        filledRecords.push({
            ...record,
            startSeconds: record.start / 1000,
            endSeconds: record.end / 1000,
        });
        currentTime = record.end + 1;
    });
    if (currentTime < currentDuration.value) {
        filledRecords.push({
            start: currentTime,
            end: currentDuration.value,
            text: "",
            startSeconds: currentTime / 1000,
            endSeconds: currentDuration.value / 1000,
        });
    }
    editingRecords.value = filledRecords;
};

// 从秒转换为毫秒
const secondsToMs = (seconds: number) => {
    return Math.round(seconds * 1000);
};

// 保存编辑，过滤空白条目
const doSave = () => {
    if (!editingRecords.value || editingRecords.value.length === 0) {
        Dialog.tipError("没有编辑记录");
        return;
    }
    // 过滤空白条目
    const finalRecords = editingRecords.value
        .filter(record => record.text.trim() !== "")
        .map(record => ({
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
    currentIndex.value = -1;
    selectedIndexes.value = [];
    lastSelectedIndex.value = -1;
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

// 点击记录跳转到音频时间
const onRecordClick = (record: EditingAsrRecord) => {
    if (audioRef.value) {
        audioRef.value.currentTime = record.startSeconds || 0;
    }
};

// 音频时间更新，高亮当前记录
const onTimeUpdate = () => {
    const currentTime = audioRef.value?.currentTime || 0;
    const newIndex = editingRecords.value.findIndex((record) =>
        (record.startSeconds || 0) <= currentTime && currentTime < (record.endSeconds || 0)
    );
    sliderValue.value = currentTime;
    if (newIndex !== currentIndex.value) {
        currentIndex.value = newIndex;
        const currentRecord = editingRecords.value[newIndex];
        sliderMin.value = currentRecord.startSeconds || 0;
        sliderMax.value = currentRecord.endSeconds || 0;
        if (newIndex !== -1) {
            nextTick(() => {
                const el = document.querySelector(`[data-record-index='${newIndex}']`) as HTMLElement;
                if (el) {
                    el.scrollIntoView({behavior: "smooth", block: "center"});
                }
            });
        }
    }
};

// 滑动条变化
const onSliderChange = (value: number) => {
    if (audioRef.value) {
        audioRef.value.currentTime = value;
    }
};

// 合并选中记录
const doMerge = () => {
    if (selectedIndexes.value.length < 2) {
        return;
    }
    // 检查必须是连续的片段才可以合并
    const sorted = selectedIndexes.value.sort((a, b) => a - b);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (last - first !== sorted.length - 1) {
        Dialog.tipError('只能合并连续的记录');
        return;
    }
    const text = editingRecords.value.slice(first, last + 1).map(r => r.text).join('；');
    const merged = {
        start: editingRecords.value[first].start,
        end: editingRecords.value[last].end,
        text: text,
        startSeconds: editingRecords.value[first].startSeconds,
        endSeconds: editingRecords.value[last].endSeconds,
    };
    editingRecords.value.splice(first, last - first + 1, merged);
    selectedIndexes.value = [];
    nextTick(() => {
        onTimeUpdate();
    });
};

// 一键合并空白
const doMergeBlanks = () => {
    const newRecords: EditingAsrRecord[] = [];
    let currentBlank: EditingAsrRecord | null = null;

    for (const record of editingRecords.value) {
        if (record.text.trim() === '') {
            if (currentBlank) {
                currentBlank.end = record.end;
                currentBlank.endSeconds = record.endSeconds;
            } else {
                currentBlank = {...record};
            }
        } else {
            if (currentBlank) {
                newRecords.push(currentBlank);
                currentBlank = null;
            }
            newRecords.push(record);
        }
    }

    if (currentBlank) {
        newRecords.push(currentBlank);
    }

    editingRecords.value = newRecords;
    Dialog.tipSuccess("已合并连续空白片段");
};

// 分割当前记录
const doSplit = () => {
    if (currentIndex.value === -1) {
        return;
    }
    const record = editingRecords.value[currentIndex.value];
    if (!(sliderValue.value > record.startSeconds! && sliderValue.value < record.endSeconds!)) {
        Dialog.tipError('时间范围不合法，必须在记录中间');
        return;
    }
    const newRecord = {
        start: Math.floor(sliderValue.value * 1000),
        end: record.end,
        text: record.text,
        startSeconds: sliderValue.value,
        endSeconds: record.endSeconds,
    };
    record.end = newRecord.start - 1;
    record.endSeconds = newRecord.startSeconds - 0.01;
    editingRecords.value.splice(currentIndex.value + 1, 0, newRecord);
    nextTick(() => {
        onTimeUpdate();
    });
};

// 记录选择
const onRecordSelect = (index: number, event: MouseEvent) => {
    const record = editingRecords.value[index];
    if (event.shiftKey && lastSelectedIndex.value !== -1) {
        const start = Math.min(lastSelectedIndex.value, index);
        const end = Math.max(lastSelectedIndex.value, index);
        selectedIndexes.value = [];
        for (let i = start; i <= end; i++) {
            selectedIndexes.value.push(i);
        }
    } else {
        if (event.ctrlKey || event.metaKey) {
            if (selectedIndexes.value.includes(index)) {
                selectedIndexes.value = selectedIndexes.value.filter(i => i !== index);
            } else {
                selectedIndexes.value.push(index);
            }
        } else {
            selectedIndexes.value = [index];
        }
        lastSelectedIndex.value = index;
    }
};

// 复选框变化
const onCheckboxChange = (index: number, checked: boolean) => {
    if (checked) {
        if (!selectedIndexes.value.includes(index)) {
            selectedIndexes.value.push(index);
        }
    } else {
        selectedIndexes.value = selectedIndexes.value.filter(i => i !== index);
    }
    lastSelectedIndex.value = index;
};

const aiIndex = ref(0);

const aiOption: ModelGenerateButtonOptionType = {
    mode: 'repeat',
    promptDefault: SoundAsrResultOptimizedPrompt,
    onStart: async () => {
        console.log('AI优化开始');
        aiIndex.value = 0;
    },
    onEnd: async () => {
        console.log('AI优化结束');
    },
    onGetParam: async () => {
        console.log('AI优化获取参数, index=', aiIndex.value);
        // get next none empty record
        while (aiIndex.value < editingRecords.value.length) {
            const record = editingRecords.value[aiIndex.value];
            aiIndex.value++;
            if (record.text.trim()) {
                return {
                    content: record.text.trim(),
                };
            }
        }
        return null;
    },
    onResult: async (result: string, param: Record<string, any>) => {
        const index = aiIndex.value - 1;
        console.log('AI优化结果:', {index, result, param});
        onRecordClick(editingRecords.value[index]);
        setTimeout(() => {
            editingRecords.value[index].text = result.trim();
        }, 1000);
    },
}

defineExpose({
    edit,
});
</script>

<template>
    <a-modal v-model:visible="visible" width="95vw" title-align="start">
        <template #title>
            {{ $t("编辑识别结果") }}
        </template>
        <template #footer>
            <a-button @click="doCancel">{{ $t("取消") }}</a-button>
            <a-button type="primary" @click="doSave">{{ props.saveTitle }}</a-button>
        </template>
        <div v-if="visible" class="flex flex-col gap-1 h-full -mx-4 -my-5" style="height:calc(100vh - 12rem);">

            <div class="bg-gray-100 p-2 border-b rounded-lg">
                <audio
                    ref="audioRef"
                    :src="currentAudio"
                    controls
                    class="w-full"
                    @timeupdate="onTimeUpdate"
                ></audio>
            </div>

            <div class="bg-white rounded-lg p-2 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <a-input
                        v-model="findText"
                        :placeholder="$t('查找')"
                        size="small"
                        style="width:100px"
                        allow-clear
                    />
                    <a-input
                        v-model="replaceText"
                        :placeholder="$t('替换')"
                        size="small"
                        style="width:100px"
                        allow-clear
                    />
                    <a-button size="small" @click="onFindReplace" :disabled="!findText.trim()">
                        {{ $t("批量替换") }}
                    </a-button>
                    <a-button size="small" type="primary" @click="doMergeBlanks" :disabled="!hasConsecutiveBlanks">
                        {{ $t("一键合并空白") }}
                    </a-button>
                    <a-button size="small" type="primary" @click="doSplit" :disabled="currentIndex === -1">
                        {{ $t("分割") }}
                    </a-button>
                    <a-button size="small" type="primary" @click="doMerge" :disabled="selectedIndexes.length < 2">
                        {{ $t("合并") }}
                    </a-button>
                    <ModelGenerateButton
                        biz="SoundReplaceAsrResultOptimizedPrompt"
                        title="AI一键优化"
                        :option="aiOption"
                    />
                </div>
                <div class="text-sm text-gray-500">{{ $t("共{count}字", {count: totalWords}) }}</div>
            </div>

            <div class="flex-grow overflow-y-auto border rounded-lg p-2">
                <!-- 没有数据提示 -->
                <div v-if="editingRecords.length === 0" class="text-center text-gray-500 py-4">
                    {{ $t("没有可编辑的数据") }}
                </div>
                <!-- 表格编辑 -->
                <div v-else class="space-y-1">
                    <div
                        v-for="(record, index) in editingRecords"
                        :key="index"
                        :data-record-index="index + ''"
                        :class="[
                            'border rounded p-2 hover:shadow cursor-pointer',
                            selectedIndexes.includes(index) ? 'border-red-400 bg-red-50' : '',
                            index === currentIndex ? 'bg-blue-50 border-blue-400' : ''
                        ]"
                        @click="onRecordClick(record)"
                    >
                        <div class="flex items-start">
                            <div class="flex-grow">
                                <div class="flex items-center mb-1">
                                    <a-tag class="rounded-lg mr-3">
                                        {{ index + 1 }}
                                    </a-tag>
                                    <div class="text-xs text-gray-600 font-mono select-none"
                                         @click.stop="onRecordSelect(index, $event)">
                                        {{ TimeUtil.msToTime(record.start) }} - {{ TimeUtil.msToTime(record.end) }}
                                    </div>
                                </div>
                                <div class="text-sm">
                                    <a-textarea
                                        v-model="record.text"
                                        :max-length="1000"
                                        :auto-size="{minRows: 1, maxRows: 3}"
                                        show-word-limit
                                        size="mini"
                                        :textarea-attrs="{tabindex:index}"
                                        placeholder="输入文本"
                                    />
                                </div>
                                <div v-if="index === currentIndex" class="px-2">
                                    <a-slider
                                        :min="sliderMin"
                                        :max="sliderMax"
                                        :step="0.001"
                                        :model-value="sliderValue"
                                        @change="onSliderChange"
                                    />
                                </div>
                            </div>
                            <a-checkbox
                                :checked="selectedIndexes.includes(index)"
                                @change="(checked) => onCheckboxChange(index, checked)"
                                class="ml-2 self-start"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a-modal>
</template>
