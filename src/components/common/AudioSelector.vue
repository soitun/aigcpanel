<script setup lang="ts">
import { t } from "../../lang";
import { doOpenFile } from "./util";
import { computed, ref } from "vue";
import { FileUtil } from "../../lib/file";
import AudioPlayerButton from "./AudioPlayerButton.vue";

const props = defineProps<{
    modelValue: string;
    extensions: string[];
}>();
const emit = defineEmits<{
    "update:modelValue": [string];
}>();

const AUDIO_EXTS = [
    "mp3", "wav", "flac", "ogg", "aac",
    "m4a", "wma", "opus", "wv", "aiff",
];

const effectiveExts = computed(() => {
    if (props.extensions && props.extensions.length > 0) {
        return props.extensions;
    }
    return AUDIO_EXTS;
});

const doSelectFile = async () => {
    const result = await doOpenFile({ extensions: effectiveExts.value });
    if (!result) {
        return;
    }
    emit("update:modelValue", result as string);
};

const doClear = () => {
    emit("update:modelValue", "");
};

const name = computed(() => {
    if (!props.modelValue) return "";
    return FileUtil.getBaseName(props.modelValue, true);
});
</script>

<template>
    <div class="flex items-center gap-2 min-w-64">
        <template v-if="modelValue">
            <AudioPlayerButton :source="modelValue" />
            <a-tooltip :content="modelValue" mini>
                <span class="text-sm text-gray-700 truncate max-w-40">
                    {{ name }}
                </span>
            </a-tooltip>
            <a-button size="mini" @click="doClear" class="flex-shrink-0">
                <icon-close />
            </a-button>
            <a-button @click="doSelectFile" size="mini" class="flex-shrink-0">
                {{ t("common.reselect") }}
            </a-button>
        </template>
        <template v-else>
            <a-button @click="doSelectFile" class="min-w-64">
                <i-mdi-music-note />
                {{ t("common.selectAudio") }}
                ({{ effectiveExts.join(", ") }})
            </a-button>
        </template>
    </div>
</template>