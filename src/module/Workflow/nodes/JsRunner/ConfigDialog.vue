<script setup lang="ts">
import { computed, ref } from "vue";
import { t } from "../../../../lang";
import ModelAgentButton from "../../../Model/ModelAgentButton.vue";
import { NodeProperties } from "../../core/type";
import { WorkflowNodeJsGeneratePrompt } from "./prompt";

const visible = ref(false);

const props = defineProps<{
    properties: NodeProperties;
}>();
const emit = defineEmits<{
    update: [val: any];
}>();

const code = computed({
    get: () =>
        props.properties?.data?.code ||
        `function (input){
    return input;
}`,
    set: (val: string) =>
        onUpdate({ data: { ...(props.properties?.data || {}), code: val } }),
});

const testInput = ref('{"foo":"bar"}');
const testOutput = ref("");
const isRunning = ref(false);

const runTest = async () => {
    if (!code.value) {
        testOutput.value = t("代码为空");
        return;
    }
    isRunning.value = true;
    try {
        let inputData;
        try {
            inputData = JSON.parse(testInput.value);
        } catch (e) {
            testOutput.value = t("输入JSON无效") + " " + (e as Error).message;
            return;
        }

        // 执行代码
        let result;
        const trimmedCode = code.value.trim();
        if (
            trimmedCode.startsWith("function") ||
            trimmedCode.startsWith("async function")
        ) {
            // 完整的函数定义：创建函数并调用
            const func = new Function(
                "input",
                `return (${trimmedCode})(input);`,
            );
            result = func(inputData);
        } else {
            // 函数体：使用原有逻辑
            const func = new Function("input", code.value);
            result = func(inputData);
        }

        // 如果结果是Promise，等待它
        const finalResult = result instanceof Promise ? await result : result;

        // 格式化输出
        testOutput.value = JSON.stringify(finalResult, null, 2);
    } catch (e) {
        testOutput.value = t("执行错误") + " " + (e as Error).message;
    } finally {
        isRunning.value = false;
    }
};

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
        :title="t('配置JS执行器')"
        width="800px"
    >
        <div
            class="-mx-4 -my-5 p-4 overflow-y-auto"
            style="height: calc(100vh - 15rem)"
        >
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-1">{{
                        $t("JavaScript代码")
                    }}</label>
                    <a-textarea
                        size="small"
                        :model-value="code"
                        @input="(val) => (code = val)"
                        :auto-size="{ minRows: 8, maxRows: 15 }"
                        :placeholder="
                            t(
                                '输入JavaScript代码，可以是完整的函数定义（function或async function）或函数体，参数名为input，返回值将作为输出',
                            )
                        "
                    />
                </div>
                <div class="flex gap-1">
                    <a-button
                        type="primary"
                        :loading="isRunning"
                        @click="runTest"
                    >
                        <template #icon>
                            <icon-play-circle />
                        </template>
                        {{ $t("运行测试") }}
                    </a-button>
                    <ModelAgentButton
                        biz="WorkflowNodeJsGeneratePrompt"
                        :prompt-default="WorkflowNodeJsGeneratePrompt"
                        title="生成JS代码"
                        placeholder="请输入您需要生成JS代码的功能描述"
                        @result="(val) => (code = val)"
                    />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">{{
                        $t("测试输入JSON")
                    }}</label>
                    <a-textarea
                        size="small"
                        v-model="testInput"
                        :auto-size="{ minRows: 3, maxRows: 6 }"
                        :placeholder="t('输入测试JSON数据')"
                    />
                </div>
                <div v-if="testOutput">
                    <label class="block text-sm font-medium mb-1">{{
                        $t("测试输出")
                    }}</label>
                    <a-textarea
                        size="small"
                        v-model="testOutput"
                        :auto-size="{ minRows: 3, maxRows: 6 }"
                        readonly
                        :placeholder="t('执行结果将显示在这里')"
                    />
                </div>
            </div>
        </div>
    </a-modal>
</template>
