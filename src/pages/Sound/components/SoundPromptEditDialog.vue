<script setup lang="ts">
import {ref} from "vue";
import AudioPlayer from "../../../components/common/AudioPlayer.vue";
import {AudioUtil} from "../../../lib/audio";
import WebFileSelectButton from "../../../components/common/WebFileSelectButton.vue";
import {Dialog} from "../../../lib/dialog";
import {t} from "../../../lang";
import {StorageService} from "../../../service/StorageService";
import {DataService} from "../../../service/DataService";

const visible = ref(false);
const audioPlayer = ref<InstanceType<typeof AudioPlayer>>();

const formData = ref({
    name: "",
    promptWav: "",
    promptText: "",
});

const add = () => {
    formData.value.name = "";
    formData.value.promptWav = "";
    formData.value.promptText = "";
    visible.value = true;
};

const onSelectFile = async file => {
    await audioPlayer.value?.setRecordFromFile(file);
};

const doSave = async () => {
    if (!formData.value.name) {
        Dialog.tipError(t("请输入名称"));
        return;
    }
    const audioBuffer = audioPlayer.value?.getAudioBuffer();
    if (!audioBuffer) {
        Dialog.tipError(t("请录制声音"));
        return;
    }
    if (!formData.value.promptText) {
        Dialog.tipError(t("请输入参考文字"));
        return;
    }
    const exists = await StorageService.getByTitle("SoundPrompt", formData.value.name);
    if (exists) {
        Dialog.tipError(t("名称重复"));
        return;
    }
    const duration = AudioUtil.audioBufferDuration(audioBuffer);
    if (duration > 20 || duration < 6) {
        Dialog.tipError(t("参考声音需要大于 6s 小于 20s，保证声音清晰可见"));
        return;
    }
    const wav = AudioUtil.audioBufferToWav(audioBuffer);
    formData.value.promptWav = await DataService.saveBuffer("wav", wav);
    await StorageService.add("SoundPrompt", {
        title: formData.value.name,
        content: {
            url: formData.value.promptWav,
            promptText: formData.value.promptText,
        },
    });
    visible.value = false;
    emit("update");
};

defineExpose({
    add,
});

const emit = defineEmits({
    update: () => true,
});
</script>

<template>
    <a-modal v-model:visible="visible" width="800px" title-align="start">
        <template #title>
            {{ $t("添加音色") }}
        </template>
        <template #footer>
            <a-button type="primary" @click="doSave">
                {{ $t("保存") }}
            </a-button>
        </template>
        <div style="max-height: 60vh">
            <div class="flex">
                <div class="w-1/2 flex-shrink-0 mr-5">
                    <a-form :model="{}" layout="vertical">
                        <a-form-item :label="$t('名称')" required>
                            <a-input v-model="formData.name" />
                        </a-form-item>
                        <a-form-item :label="$t('参考声音')" required>
                            <div class="w-full">
                                <div class="mb-3">
                                    <a-alert>
                                        {{ $t("参考声音控制在 6～20s，保证声音清晰可见") }}
                                    </a-alert>
                                </div>
                                <div class="mb-3">
                                    <AudioPlayer ref="audioPlayer" show-wave trim-enable record-enable />
                                </div>
                                <div class="mb-3 text-gray-400 flex items-center">
                                    <div class="flex-grow text-sm">
                                        <icon-info-circle />
                                        {{ $t("支持 wav/mp3 格式") }}
                                    </div>
                                    <div>
                                        <WebFileSelectButton @select-file="onSelectFile" accept="audio/wav,audio/mp3">
                                            <a-button>
                                                <template #icon>
                                                    <icon-upload />
                                                </template>
                                                {{ $t("选择声音文件") }}
                                            </a-button>
                                        </WebFileSelectButton>
                                    </div>
                                </div>
                            </div>
                        </a-form-item>
                        <a-form-item :label="$t('参考文字')" required>
                            <div class="w-full">
                                <div class="mb-3">
                                    <a-input v-model="formData.promptText" />
                                </div>
                                <div class="text-gray-400 text-sm">
                                    <icon-info-circle />
                                    {{ $t("需要输入参考声音的完整文字内容，部分模型需要使用") }}
                                </div>
                            </div>
                        </a-form-item>
                    </a-form>
                </div>
                <div class="flex-grow">
                    <div class="text-lg font-bold">{{ $t("音色说明") }}</div>
                    <div class="bg-gray-100 mt-2 p-3 rounded-lg leading-6 text-xs">
                        <div>{{ $t("1. 请在安静的环境下进行录音，避免噪音干扰") }}</div>
                        <div>{{ $t("2. 请使用标准普通话，吐字清晰，语速适当") }}</div>
                        <div>{{ $t("3. 录音时长控制在 6～20秒 最佳，最多不超过20秒") }}</div>
                        <div>{{ $t("4. 录制完成后先试听看是否达到要求再提交") }}</div>
                    </div>
                </div>
            </div>
        </div>
    </a-modal>
</template>
