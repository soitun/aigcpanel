<script setup lang="ts">
import {ref} from "vue";
import SoundGenerateForm from "../../../Sound/components/SoundGenerateForm.vue";

const soundGenerateForm = ref<InstanceType<typeof SoundGenerateForm> | null>(null);

const visible = ref(false);
const emit = defineEmits<{
    update: [
        data: {
            soundGenerate: SoundGenerateParamType,
        }
    ];
}>();
const doSubmit = async () => {
    const soundGenerateValue = await soundGenerateForm.value?.getValue();
    if (!soundGenerateValue) {
        return;
    }
    visible.value = false;
    emit("update", {
        soundGenerate: soundGenerateValue,
    });
};

defineExpose({
    show: () => {
        visible.value = true;
    },
});

</script>

<template>
    <a-modal
        v-model:visible="visible"
        title-align="start"
        :title="$t('长文本转音频设置')"
        width="600px"
        :destroyOnClose="true">
        <template #footer>
            <div class="flex justify-end space-x-2">
                <a-button type="primary" @click="doSubmit">{{ $t("保存") }}</a-button>
            </div>
        </template>
        <div v-if="visible" class="space-y-4 overflow-y-auto" style="max-height: calc(100vh - 10rem)">
            <SoundGenerateForm ref="soundGenerateForm"/>
        </div>
    </a-modal>
</template>
