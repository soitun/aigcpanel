<script lang="ts">
import { t } from "../../../../lang";
import TextVariableInput from "../../components/TextVariableInput.vue";
import { fieldTypeToLabel } from "../../core/field";
import { ConfigMixin } from "../mixin";

export default {
    name: "IfElseConfig",
    components: { TextVariableInput },
    mixins: [ConfigMixin],
    data() {
        return {
            type: "simple" as "simple" | "code",
            value1: "",
            value2: "",
            operator: "==",
            code: "function() { return true; }",
            ignoreCase: false,
            operators: [
                { label: "等于", value: "==" },
                { label: "不等于", value: "!=" },
                { label: "大于", value: ">" },
                { label: "小于", value: "<" },
                { label: "大于等于", value: ">=" },
                { label: "小于等于", value: "<=" },
                { label: "包含", value: "contains" },
                { label: "不包含", value: "not_contains" },
                { label: "开头", value: "starts_with" },
                { label: "结尾", value: "ends_with" },
            ],
        };
    },
    watch: {
        properties: {
            handler() {
                this.onUpdate();
            },
            deep: true,
            immediate: true,
        },
    },
    methods: {
        t,
        fieldTypeToLabel,
        async onShow() {
            this.type = this.properties?.data?.type || "simple";
            this.value1 = this.properties?.data?.value1 || "";
            this.value2 = this.properties?.data?.value2 || "";
            this.operator = this.properties?.data?.operator || "==";
            this.code =
                this.properties?.data?.code || "function() { return true; }";
            this.ignoreCase = this.properties?.data?.ignoreCase || false;
        },
        async onUpdate() {
            this.type = this.properties?.data?.type || "simple";
            this.value1 = this.properties?.data?.value1 || "";
            this.value2 = this.properties?.data?.value2 || "";
            this.operator = this.properties?.data?.operator || "==";
            this.code =
                this.properties?.data?.code || "function() { return true; }";
            this.ignoreCase = this.properties?.data?.ignoreCase || false;
        },
        sync() {
            this.$emit("updateProperties", {
                data: {
                    type: this.type,
                    value1: this.value1,
                    value2: this.value2,
                    operator: this.operator,
                    code: this.code,
                    ignoreCase: this.ignoreCase,
                },
            });
        },
        onTypeChange(value: "simple" | "code") {
            this.type = value;
            this.sync();
        },
        onValue1Change(value: string) {
            this.value1 = value;
            this.sync();
        },
        onValue2Change(value: string) {
            this.value2 = value;
            this.sync();
        },
        onOperatorChange(value: string) {
            this.operator = value;
            this.sync();
        },
        onCodeChange(value: string) {
            this.code = value;
            this.sync();
        },
        onIgnoreCaseChange(value: boolean) {
            this.ignoreCase = value;
            this.sync();
        },
    },
};
</script>

<template>
    <div class="p-2">
        <div class="mb-2">
            <a-radio-group v-model="type" type="button" @change="onTypeChange">
                <a-radio value="simple">{{ $t("简单条件") }}</a-radio>
                <a-radio value="code">{{ $t("代码条件") }}</a-radio>
            </a-radio-group>
        </div>

        <div v-if="type === 'simple'" class="space-y-2">
            <div>
                <TextVariableInput
                    v-model="value1"
                    :node-id="node?.id"
                    :placeholder="$t('输入值或选择变量')"
                    @change="onValue1Change"
                />
            </div>
            <div>
                <a-select
                    v-model="operator"
                    size="small"
                    :options="operators"
                    @change="onOperatorChange"
                    class="w-full"
                />
            </div>
            <div>
                <TextVariableInput
                    v-model="value2"
                    :node-id="node?.id"
                    :placeholder="$t('输入值或选择变量')"
                    @change="onValue2Change"
                />
            </div>
            <div>
                <a-checkbox v-model="ignoreCase" @change="onIgnoreCaseChange">
                    {{ $t("忽略大小写") }}
                </a-checkbox>
            </div>
        </div>

        <div v-if="type === 'code'" class="space-y-4">
            <div>
                <a-textarea
                    v-model="code"
                    :placeholder="$t('输入JavaScript代码，返回true或false')"
                    :rows="6"
                    @change="onCodeChange"
                />
            </div>
        </div>
    </div>
</template>
