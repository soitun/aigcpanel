<script setup lang="ts">
import { ref } from "vue";
import { Dialog } from "../../../../lib/dialog";

const formData = ref({
    position: "start",
    duration: 3,
    animation: "none",
    zoomPercent: 5,
});

type VideoMergeImageForm = {
    position: "start" | "end";
    duration: number;
    animation: "none" | "zoom";
    zoomPercent?: number;
};

const durationPresets = [
    { label: "1s", value: 1 },
    { label: "2s", value: 2 },
    { label: "3s", value: 3 },
    { label: "5s", value: 5 },
    { label: "10s", value: 10 },
];

const getValue = async (): Promise<VideoMergeImageForm | undefined> => {
    const data: any = {};

    data.duration = formData.value.duration;
    if (data.duration <= 0 || isNaN(data.duration)) {
        Dialog.tipError("请设置有效的片头图片时长");
        return;
    }
    data.position = formData.value.position;
    data.animation = formData.value.animation;
    if (data.animation === "zoom") {
        data.zoomPercent = formData.value.zoomPercent;
        if (data.zoomPercent <= 0 || isNaN(data.zoomPercent)) {
            Dialog.tipError("请设置有效的放大百分比");
            return;
        }
    }

    return data;
};

const setValue = (data: Partial<VideoMergeImageForm>) => {
    if (data.position !== undefined) {
        formData.value.position = data.position;
    }
    if (data.duration !== undefined) {
        formData.value.duration = data.duration;
    }
    if (data.animation !== undefined) {
        formData.value.animation = data.animation;
    }
    if (data.zoomPercent !== undefined) {
        formData.value.zoomPercent = data.zoomPercent;
    }
};

defineExpose({
    getValue,
    setValue,
});
</script>

<template>
    <div>
        <div class="mb-4 flex items-start">
            <div class="pt-1 w-20">
                <a-tooltip :content="'片头图片'" mini> 位置 </a-tooltip>
            </div>
            <div class="flex items-center gap-2">
                <a-radio-group v-model="formData.position" type="button">
                    <a-radio value="start">片头</a-radio>
                    <a-radio value="end">片尾</a-radio>
                </a-radio-group>
            </div>
        </div>
        <div class="mb-4 flex items-start">
            <div class="pt-1 w-20">
                <a-tooltip :content="'片头图片'" mini> 长度 </a-tooltip>
            </div>
            <div class="flex items-center gap-2">
                <a-input-number
                    v-model="formData.duration"
                    :min="0.1"
                    :max="60"
                    :step="0.1"
                    :precision="1"
                    style="width: 80px"
                />
                <span class="text-gray-500">秒</span>
                <div class="flex gap-1">
                    <a-button
                        v-for="preset in durationPresets"
                        :key="preset.value"
                        size="mini"
                        class="px-1"
                        :type="
                            formData.duration === preset.value
                                ? 'primary'
                                : 'outline'
                        "
                        @click="formData.duration = preset.value"
                    >
                        {{ preset.label }}
                    </a-button>
                </div>
            </div>
        </div>
        <div class="mb-4 flex items-start">
            <div class="pt-1 w-20">
                <a-tooltip :content="'图片动画'" mini> 动画 </a-tooltip>
            </div>
            <div class="flex items-center gap-2">
                <a-radio-group v-model="formData.animation" type="button">
                    <a-radio value="none">无</a-radio>
                    <a-radio value="zoom">放大</a-radio>
                </a-radio-group>
            </div>
        </div>
        <div v-if="formData.animation === 'zoom'" class="mb-4 flex items-start">
            <div class="pt-1 w-20">
                <a-tooltip :content="'放大百分比'" mini> 放大% </a-tooltip>
            </div>
            <div class="flex items-center gap-2">
                <a-input-number
                    v-model="formData.zoomPercent"
                    :min="1"
                    :max="100"
                    :step="1"
                    :precision="0"
                    style="width: 80px"
                />
                <span class="text-gray-500">%</span>
            </div>
        </div>
    </div>
</template>
