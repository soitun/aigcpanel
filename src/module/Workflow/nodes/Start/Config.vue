<script lang="ts">
import { doOpenFile } from "../../../../components/common/util";
import { t } from "../../../../lang";
import { ObjectUtil } from "../../../../lib/util";
import TextVariableInput from "../../components/TextVariableInput.vue";
import TextareaVariableInput from "../../components/TextareaVariableInput.vue";
import { fieldTypeToLabel } from "../../core/field";
import { NodeField } from "../../core/type";
import { ConfigMixin } from "../mixin";
import FieldEditDialog from "./components/FieldEditDialog.vue";

export default {
    name: "StartConfig",
    components: { TextVariableInput, TextareaVariableInput, FieldEditDialog },
    mixins: [ConfigMixin],
    data() {
        return {
            inputFields: [] as NodeField[],
        };
    },
    methods: {
        t,
        fieldTypeToLabel,
        async onShow() {
            this.inputFields = ObjectUtil.clone(
                this.properties?.inputFields || [],
            );
        },
        async onUpdate() {
            this.inputFields = ObjectUtil.clone(
                this.properties?.inputFields || [],
            );
        },
        doAdd(field: NodeField) {
            this.inputFields.push(field);
            this.sync();
        },
        doEdit(index: number, field: NodeField) {
            this.inputFields.splice(index, 1, field);
            this.sync();
        },
        doDelete(index: number) {
            this.inputFields.splice(index, 1);
            this.sync();
        },
        editField(index: number, field: NodeField) {
            (this.$refs.fieldEditDialog as any).edit(index, field);
        },
        addField() {
            (this.$refs.fieldEditDialog as any).add();
        },
        sync() {
            this.$emit("updateProperties", {
                inputFields: ObjectUtil.clone(this.inputFields),
                outputFields: ObjectUtil.clone(this.inputFields),
            });
        },
        onFieldChange() {
            this.sync();
        },
        doFileSelect(field: any) {
            doOpenFile({
                extensions: field.fileExtensions || [],
            }).then((result) => {
                if (result) {
                    field.value = result;
                    this.onFieldChange();
                }
            });
        },
    },
};
</script>

<template>
    <div class="p-1">
        <div
            v-for="(field, index) in inputFields"
            :key="field.name"
            class="flex flex-col mb-2"
        >
            <div class="flex">
                <div class="flex-grow text-xs pl-1">
                    {{ field.name }}
                </div>
                <div>
                    <a-button
                        size="mini"
                        type="text"
                        @click="editField(index, field)"
                    >
                        <template #icon>
                            <icon-edit />
                        </template>
                    </a-button>
                    <a-button
                        size="mini"
                        type="text"
                        status="danger"
                        @click="doDelete(index)"
                    >
                        <template #icon>
                            <icon-delete />
                        </template>
                    </a-button>
                </div>
            </div>
            <div
                v-if="field.type === 'file'"
                class="flex items-center space-x-2"
            >
                <TextVariableInput
                    class="flex-grow"
                    v-model="field.value"
                    :placeholder="field.placeholder"
                    @change="onFieldChange"
                    :node-id="node?.id"
                />
                <a-button @click="doFileSelect(field)" size="small">
                    <template #icon>
                        <icon-file />
                    </template>
                    选择
                </a-button>
            </div>
            <a-select
                size="small"
                v-else-if="field.type === 'select'"
                v-model="field.value"
                :placeholder="field.placeholder || '请选择'"
                @change="onFieldChange"
            >
                <a-option
                    v-for="option in field.selectOptions"
                    :key="option"
                    :value="option"
                    :label="option"
                />
            </a-select>
            <div v-else-if="field.type === 'textarea'">
                <TextareaVariableInput
                    v-model="field.value"
                    :placeholder="field.placeholder"
                    @change="onFieldChange"
                    :node-id="node?.id"
                />
            </div>
            <div v-else>
                <TextVariableInput
                    v-model="field.value"
                    :placeholder="field.placeholder"
                    @change="onFieldChange"
                    :node-id="node?.id"
                />
            </div>
        </div>
        <div
            v-if="inputFields.length === 0"
            class="text-center bg-gray-100 rounded-lg text-gray-500 py-8"
        >
            {{ t("暂无字段") }}
        </div>
    </div>
    <div class="px-1 pb-1">
        <a-button @click="addField()" size="small">
            <template #icon>
                <icon-plus />
            </template>
            {{ t("添加字段") }}
        </a-button>
    </div>
    <FieldEditDialog ref="fieldEditDialog" @add="doAdd" @edit="doEdit" />
</template>
