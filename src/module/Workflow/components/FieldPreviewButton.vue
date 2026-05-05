<script setup lang="ts">
import { stat } from "fs/promises";
import { computed, ref } from "vue";
import { t } from "../../../lang";
import { FileUtil } from "../../../lib/file";
import { NodeField } from "../core/type";

const props = defineProps<{
    field: NodeField;
    value: any;
}>();
const canPreview = computed(() => {
    const field: NodeField = props.field || {};
    if (field.type === "file" && props.value) {
        return true;
    }
    return false;
});
const fileType = computed(() => {
    const field: NodeField = props.field || {};
    if (field.type === "file") {
        const ext = FileUtil.getExt(props.value);
        if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) {
            return "image";
        }
        if (["mp4", "webm", "ogg", "mov", "avi", "mkv"].includes(ext)) {
            return "video";
        }
        if (["mp3", "wav", "flac", "aac", "m4a", "ogg"].includes(ext)) {
            return "audio";
        }
        if (["srt", "txt"].includes(ext)) {
            return "text";
        }
    }
    return null;
});
const doPreview = async () => {
    previewVisible.value = true;
    try {
        const stats = await stat(props.value);
        fileSize.value = stats.size;
    } catch (error) {
        // Handle error if needed
    }
    if (fileType.value === "text") {
        loadingContent.value = true;
        contentError.value = "";
        try {
            const content = await $mapi.file.read(props.value);
            fileContent.value = content;
        } catch (error) {
            contentError.value = t("读取文件失败");
        } finally {
            loadingContent.value = false;
        }
    }
};
const doOpenFolder = () => {
    $mapi.app.showItemInFolder(props.value);
};
const previewVisible = ref(false);
const fileContent = ref("");
const loadingContent = ref(false);
const contentError = ref("");
const fileSize = ref(0);

const doShowFile = () => {
    $mapi.app.showItemInFolder(props.value);
};
</script>

<template>
    <a-button v-if="canPreview" @click="doPreview" size="mini" shape="circle">
        <template #icon>
            <icon-eye />
        </template>
    </a-button>
    <a-modal
        v-model:visible="previewVisible"
        width="80%"
        title-align="start"
        :footer="false"
    >
        <template #title>
            <div class="flex items-center gap-2">
                <div class="font-bold">{{ $t("文件预览") }}</div>
                <div class="text-xs text-gray-400">
                    {{ FileUtil.formatSize(fileSize) }}
                </div>
                <div
                    class="text-xs text-gray-400 cursor-pointer"
                    @click="doShowFile"
                >
                    {{ value }}
                </div>
            </div>
        </template>
        <div v-if="previewVisible" class="-mx-4 -my-5">
            <div
                class="h-[calc(100vh-200px)] overflow-hidden relative flex items-center justify-center bg-black/10"
            >
                <img
                    v-if="field?.type === 'file' && fileType === 'image'"
                    :src="`file://${value}`"
                    style="width: 100%; height: 100%; object-fit: contain"
                />
                <video
                    v-else-if="field?.type === 'file' && fileType === 'video'"
                    :src="`file://${value}`"
                    controls
                    style="width: 100%; height: 100%"
                />
                <audio
                    v-else-if="field?.type === 'file' && fileType === 'audio'"
                    :src="`file://${value}`"
                    controls
                    style="width: 100%"
                />
                <div
                    v-else-if="field?.type === 'file' && fileType === 'text'"
                    class="w-full h-full p-4 overflow-auto bg-gray-50"
                >
                    <div
                        v-if="loadingContent"
                        class="flex items-center justify-center h-full"
                    >
                        <icon-loading class="animate-spin mr-2" />
                        加载中...
                    </div>
                    <div
                        v-else-if="contentError"
                        class="flex items-center justify-center h-full text-red-500"
                    >
                        {{ contentError }}
                    </div>
                    <pre v-else class="whitespace-pre-wrap text-sm">{{
                        fileContent
                    }}</pre>
                </div>
                <div
                    v-else
                    class="w-full h-full flex items-center justify-center bg-gray-200"
                >
                    <div class="text-center">
                        <div class="mb-4">
                            <icon-file />
                            文件路径
                        </div>
                        <div class="mb-4">
                            <pre>{{ value }}</pre>
                        </div>
                        <div>
                            <a-button
                                size="small"
                                type="primary"
                                @click="doOpenFolder"
                            >
                                <template #icon>
                                    <icon-folder />
                                </template>
                                打开文件位置
                            </a-button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a-modal>
</template>

<script lang="ts">
export default {
    name: "FieldPreviewButton",
};
</script>
