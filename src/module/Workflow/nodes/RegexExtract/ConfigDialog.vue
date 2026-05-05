<script setup lang="ts">
import { computed, ref } from "vue";
import { t } from "../../../../lang";
import { NodeProperties } from "../../core/type";
import ModelAgentButton from "../../../Model/ModelAgentButton.vue";
import { WorkflowNodeRegexGeneratePrompt } from "./prompt";

const visible = ref(false);

const props = defineProps<{
    properties: NodeProperties;
}>();
const emit = defineEmits<{
    update: [val: any];
}>();

const regex = computed({
    get: () => props.properties?.data?.regex || "",
    set: (val: string) =>
        onUpdate({ data: { ...(props.properties?.data || {}), regex: val } }),
});

const testText = ref("");
const matchResults = computed(() => {
    if (!regex.value || !testText.value) return [];
    try {
        const reg = new RegExp(regex.value);
        const matches = testText.value.match(reg);
        if (matches) {
            let results;
            if (matches.length > 1) {
                results = matches.slice(1);
            } else {
                results = [matches[0]];
            }
            // 如果结果为空或只包含空字符串，显示未匹配到
            if (results.length === 0 || results.every((r) => r === "")) {
                return [t("未匹配到")];
            }
            return results;
        } else {
            return [t("未匹配到")];
        }
    } catch (e) {
        return [t("无效的正则表达式")];
    }
});

const presets = [
    { label: "提取数字", value: "(\\d+)" },
    { label: "提取路径文件名", value: "([^\\/]+)$" },
    { label: "提取【】里面的值", value: "【(.*?)】" },
];

const onUpdate = (val: any) => {
    emit("update", { ...val });
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
        :footer="false"
        :title="t('配置正则提取')"
        width="600px"
    >
        <div
            class="-mx-4 -my-5 p-4 overflow-y-auto"
            style="height: calc(100vh - 20rem)"
        >
            <div class="space-y-2">
                <div>
                    <label class="block text-sm font-medium mb-1">{{
                        $t("正则表达式")
                    }}</label>
                    <a-textarea
                        size="small"
                        :model-value="regex"
                        @input="(val) => (regex = val)"
                        :auto-size="{ minRows: 3, maxRows: 6 }"
                        :placeholder="t('输入正则表达式，如 /(\\d+)/g')"
                    />
                    <div class="flex gap-1">
                        <a-select
                            @change="(val) => (regex = val)"
                            class="w-auto"
                            :options="presets"
                            placeholder="选择预设"
                        />
                        <ModelAgentButton
                            biz="WorkflowNodeRegexGeneratePrompt"
                            :prompt-default="WorkflowNodeRegexGeneratePrompt"
                            placeholder="请输入您需要完成的正则表达式任务，如：提取文本中的数字"
                            @result="(val) => (regex = val)"
                        />
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">{{
                        $t("测试文本")
                    }}</label>
                    <a-textarea
                        size="small"
                        v-model="testText"
                        :auto-size="{ minRows: 3, maxRows: 6 }"
                        :placeholder="t('输入测试文本')"
                    />
                </div>
                <div v-if="matchResults.length > 0">
                    <label class="block text-sm font-medium mb-1">{{
                        $t("匹配结果")
                    }}</label>
                    <div>{{ matchResults[0] }}</div>
                </div>
            </div>
        </div>
    </a-modal>
</template>
