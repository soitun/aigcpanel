<script lang="ts">
import { defineComponent, reactive, ref } from "vue";
import { t } from "../../../../../lang";
import { Dialog } from "../../../../../lib/dialog";
import { StringUtil } from "../../../../../lib/util";
import { fieldAll } from "../../../core/field";
import { NodeField, NodeFieldType } from "../../../core/type";

interface FormData {
    name: string;
    type: NodeFieldType;
    title: string;
    defaultValue: any;
    placeholder: string;
    fileExtensions: string[];
    selectOptions: string[];
}

export default defineComponent({
    name: "FieldEditDialog",
    methods: { t },
    computed: {
        fieldAll() {
            return fieldAll;
        },
    },
    emits: ["add", "edit"],
    setup(props, { emit }) {
        const visible = ref(false);
        const isEdit = ref(false);
        const currentIndex = ref(-1);

        const form = reactive<FormData>({
            name: "",
            type: "text",
            title: "",
            defaultValue: "",
            placeholder: "",
            fileExtensions: [],
            selectOptions: [],
        });

        const commonExtensions = [
            // 视频格式
            "mp4",
            // 音频格式
            "mp3",
            "wav",
            // 文本文件
            "txt",
            // 图片格式
            "jpg",
            "jpeg",
            "png",
            "gif",
            "bmp",
            "svg",
            // 文档格式
            "pdf",
            "doc",
            "docx",
            "xls",
            "xlsx",
            "ppt",
            "pptx",
            // 压缩文件
            "zip",
            "rar",
            "7z",
            "tar",
            "gz",
        ];

        const formRules = {
            name: [
                { required: true, message: t("不能为空") },
                {
                    validator: (value, cb) => {
                        if (
                            value &&
                            !/^[\u4e00-\u9fa5a-zA-Z_][\u4e00-\u9fa5a-zA-Z0-9_]*$/.test(
                                value,
                            )
                        ) {
                            cb(t("只能包含中文、字母、数字和下划线"));
                        } else {
                            cb();
                        }
                    },
                },
            ],
            title: [{ required: true, message: t("不能为空") }],
            type: [{ required: true, message: t("不能为空") }],
        };

        const show = () => {
            visible.value = true;
        };

        const add = () => {
            resetForm();
            isEdit.value = false;
            currentIndex.value = -1;
            show();
        };

        const edit = (index: number, field: NodeField) => {
            form.name = field.name;
            form.type = field.type;
            form.defaultValue = field.defaultValue;
            form.placeholder = field.placeholder as string;
            form.fileExtensions = field.fileExtensions || [];
            form.selectOptions = field.selectOptions || [];

            isEdit.value = true;
            currentIndex.value = index;
            show();
        };

        const resetForm = () => {
            form.name = "";
            form.type = "text";
            form.title = "";
            form.defaultValue = "";
            form.placeholder = "";
            form.fileExtensions = [];
            form.selectOptions = [];
        };

        const doSave = async () => {
            try {
                const field: NodeField = {
                    name: form.name.trim(),
                    type: form.type,
                    defaultValue: form.defaultValue,
                    placeholder: form.placeholder,
                    value: form.defaultValue,
                };

                if (form.type === "file" && form.fileExtensions.length > 0) {
                    field.fileExtensions = form.fileExtensions
                        .filter((ext) => ext.trim())
                        .map((ext) => ext.trim().toLowerCase());
                }
                if (form.type === "select" && form.selectOptions.length > 0) {
                    field.selectOptions = form.selectOptions.filter((opt) =>
                        opt.trim(),
                    );
                }
                if (isEdit.value) {
                    emit("edit", currentIndex.value, field);
                } else {
                    emit("add", field);
                }
                visible.value = false;
                Dialog.tipSuccess(
                    isEdit.value ? t("字段更新成功") : t("字段添加成功"),
                );
            } catch (error) {
                Dialog.tipError(t("保存失败"));
            }
        };

        const doGenerate = () => {
            if (!form.title.trim()) {
                Dialog.tipError(t("请先输入字段标题"));
                return;
            }
            form.name = StringUtil.random(8);
        };

        const addSelectOption = () => {
            form.selectOptions.push("");
        };

        const removeSelectOption = (index: number) => {
            form.selectOptions.splice(index, 1);
        };

        return {
            visible,
            isEdit,
            form,
            formRules,
            commonExtensions,
            show,
            add,
            edit,
            doSave,
            doGenerate,
            addSelectOption,
            removeSelectOption,
        };
    },
});
</script>

<template>
    <a-modal
        v-model:visible="visible"
        width="600px"
        title-align="start"
        :mask-closable="false"
    >
        <template #title>
            <div class="flex items-center">
                <div class="font-bold">
                    {{ isEdit ? t("编辑字段") : t("添加字段") }}
                </div>
            </div>
        </template>
        <template #footer>
            <div class="flex justify-end space-x-2">
                <a-button @click="visible = false">
                    {{ t("取消") }}
                </a-button>
                <a-button type="primary" @click="doSave">
                    {{ t("保存") }}
                </a-button>
            </div>
        </template>
        <div class="-m-4 p-3 max-h-[70vh] overflow-y-auto">
            <a-form :model="form" :rules="formRules" layout="vertical">
                <a-form-item field="type" :label="t('字段类型')">
                    <a-radio-group v-model="form.type" type="button">
                        <a-radio
                            v-for="option in fieldAll"
                            :key="option.type"
                            :value="option.type"
                        >
                            {{ option.label }}
                        </a-radio>
                    </a-radio-group>
                </a-form-item>
                <a-form-item field="name" :label="t('字段名称')">
                    <a-input
                        v-model="form.name"
                        :placeholder="t('请输入字段名称')"
                    />
                </a-form-item>
                <a-form-item field="defaultValue" :label="t('默认值')">
                    <a-textarea
                        v-if="form.type === 'textarea'"
                        v-model="form.defaultValue"
                        :placeholder="t('请输入默认值')"
                        :auto-size="{ minRows: 3, maxRows: 6 }"
                    />
                    <a-input
                        v-else
                        v-model="form.defaultValue"
                        :placeholder="t('请输入默认值')"
                    />
                </a-form-item>
                <a-form-item field="placeholder" :label="t('占位符')">
                    <a-input
                        v-model="form.placeholder"
                        :placeholder="t('请输入占位符文本')"
                    />
                </a-form-item>
                <a-form-item
                    v-if="form.type === 'file'"
                    :label="t('文件扩展名')"
                >
                    <a-select
                        v-model="form.fileExtensions"
                        :style="{ width: '320px' }"
                        :placeholder="t('请选择或输入扩展名')"
                        multiple
                        allow-create
                        allow-clear
                    >
                        <a-option
                            v-for="commonExt in commonExtensions"
                            :key="commonExt"
                            :value="commonExt"
                        >
                            {{ commonExt }}
                        </a-option>
                    </a-select>
                </a-form-item>
                <a-form-item
                    v-if="form.type === 'select'"
                    :label="t('选项列表')"
                >
                    <div class="space-y-2">
                        <div
                            v-for="(option, index) in form.selectOptions"
                            :key="index"
                            class="flex items-center space-x-2"
                        >
                            <a-input
                                v-model="form.selectOptions[index]"
                                :placeholder="t('请输入选项')"
                                class="flex-1"
                            />
                            <a-button
                                size="small"
                                @click="removeSelectOption(index)"
                                class="text-red-500"
                            >
                                <template #icon>
                                    <icon-delete />
                                </template>
                            </a-button>
                        </div>
                        <a-button
                            type="dashed"
                            size="small"
                            @click="addSelectOption"
                        >
                            <template #icon>
                                <icon-plus />
                            </template>
                            {{ t("添加选项") }}
                        </a-button>
                    </div>
                </a-form-item>
            </a-form>
        </div>
    </a-modal>
</template>
