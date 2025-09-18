<script setup lang="ts">
import { ref } from "vue";
import { t } from "../../lang";
import { Dialog } from "../../lib/dialog";
import ModelGenerator from "./ModelGenerator.vue";

const props = withDefaults(defineProps<{
    biz: string,
    title: string,
    promptDefault: string,
    placeholder: string,
}>(), {
    title: t('AI生成'),
    placeholder: t('请输入你的需求'),
});

const emit = defineEmits<{
    (e: 'result', result: string): void
}>();

const modelGenerator = ref<InstanceType<typeof ModelGenerator> | null>(null);
const visible = ref(false);
const userInput = ref('');
const loading = ref(false);
const buttonLoading = ref(false);

const showDialog = () => {
    visible.value = true;
};

const doGenerate = async () => {
    if (!modelGenerator.value) {
        Dialog.tipError(t("请先选择模型"));
        return;
    }
    if (!userInput.value.trim()) {
        Dialog.tipError(t("请输入内容"));
        return;
    }
    loading.value = true;
    buttonLoading.value = true;
    try {
        let prompt = props.promptDefault.replace('{content}', userInput.value);
        const ret = await modelGenerator.value.chat(prompt, {});
        if (ret.code) {
            Dialog.tipError(ret.msg);
            return;
        }
        emit('result', ret.data?.content!);
        visible.value = false;
        userInput.value = '';
    } catch (e) {
        console.error(e);
        Dialog.tipError(t("生成失败") + ":" + e);
    } finally {
        loading.value = false;
        buttonLoading.value = false;
    }
};
</script>

<template>
    <a-button class="mr-1" @click="showDialog" :loading="buttonLoading">
        <template #icon>
            <icon-robot/>
        </template>
        {{ title }}
    </a-button>
    <a-modal v-model:visible="visible" :title="title" @ok="doGenerate" :confirm-loading="loading">
        <a-textarea v-model="userInput" :placeholder="placeholder" :rows="4"/>
    </a-modal>
    <ModelGenerator ref="modelGenerator" :biz="biz"/>
</template>

<style scoped>

</style>
