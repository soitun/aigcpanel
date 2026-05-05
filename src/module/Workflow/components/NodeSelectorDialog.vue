<template>
    <a-modal
        v-model:visible="visible"
        width="90vw"
        :footer="false"
        title-align="start"
    >
        <template #title>
            <div class="flex items-center justify-between w-full">
                <div class="font-bold mr-2">
                    {{ t("添加组件") }}
                </div>
                <a-input
                    v-model="searchKeyword"
                    :placeholder="t('搜索组件...')"
                    class="w-64 mr-10"
                    allow-clear
                    @input="onSearch"
                >
                    <template #prefix>
                        <icon-search />
                    </template>
                </a-input>
            </div>
        </template>
        <div
            class="-mx-4 -my-5 overflow-y-auto"
            style="height: calc(100vh - 20rem)"
        >
            <div
                v-for="(components, category) in categorizedComponents"
                :key="category"
                class="p-4"
            >
                <div class="font-semibold mb-4">
                    {{ categoryTitles[category] || category }}
                </div>
                <div class="grid grid-cols-3 xl:grid-cols-3 gap-4">
                    <div
                        v-for="component in components"
                        :key="component.name"
                        class="border border-gray-200 rounded-lg p-3 cursor-pointer transition-all duration-200 flex items-center gap-3 hover:border-blue-500 hover:shadow-md"
                        @click="onSelectComponent(component)"
                    >
                        <div
                            class="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50"
                        >
                            <component
                                :is="
                                    typeof component.icon === 'string'
                                        ? 'img'
                                        : component.icon
                                "
                                :src="
                                    typeof component.icon === 'string'
                                        ? component.icon
                                        : undefined
                                "
                                :alt="component.name"
                                class="w-8 h-8"
                                :style="
                                    component.color
                                        ? { color: component.color }
                                        : {}
                                "
                            />
                        </div>
                        <div class="flex-1 w-0">
                            <div class="flex items-center gap-2 mb-2">
                                <div
                                    class="text-gray-900 font-"
                                    v-html="
                                        highlightText(
                                            component.title,
                                            searchKeyword,
                                        )
                                    "
                                ></div>
                                <div
                                    class="rounded-lg px-2 text-xs bg-gray-100 text-gray-400"
                                    v-html="
                                        highlightText(
                                            component.name,
                                            searchKeyword,
                                        )
                                    "
                                ></div>
                            </div>
                            <div
                                class="text-xs text-gray-400 truncate"
                                v-html="
                                    highlightText(
                                        component.description,
                                        searchKeyword,
                                    )
                                "
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </a-modal>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { t } from "../../../lang";
import { FunctionCallNodes } from "../../../pages/Workflow/lib";
import { WorkflowNodeDefs } from "../core/node";
import { NodeSelectorItem } from "../core/type";
import functionCallIcon from "~icons/mdi/function-variant";

interface Emits {
    (e: "select", component: NodeSelectorItem): void;
}

const emit = defineEmits<Emits>();

const visible = ref(false);
const searchKeyword = ref("");

const onSearch = () => {
    // 搜索逻辑在 computed 中处理
};

const highlightText = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;
    const regex = new RegExp(
        `(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi",
    );
    return text.replace(
        regex,
        '<span class="text-red-500 font-semibold">$1</span>',
    );
};

const availableComponents = computed((): NodeSelectorItem[] => {
    const components: NodeSelectorItem[] = [];

    for (const wn of WorkflowNodeDefs) {
        if (["Start", "FunctionCall"].includes(wn.type)) {
            continue;
        }
        components.push({
            type: wn.type,
            name: wn.type,
            title: wn.title,
            description: wn.description,
            icon: wn.icon,
            color: wn.color,
            category: "basic", // 假设 WorkflowNodeDefs 中的是基础组件
        });
    }

    FunctionCallNodes.forEach((fc) => {
        components.push({
            type: "FunctionCall",
            name: fc.name,
            title: fc.title,
            description: fc.description,
            icon: fc.icon || functionCallIcon,
            category: "functionCall", // FunctionCallNodes 是业务组件
        });
    });

    return components;
});

const categorizedComponents = computed(() => {
    let filteredComponents = availableComponents.value;

    if (searchKeyword.value.trim()) {
        const keyword = searchKeyword.value.toLowerCase().trim();
        filteredComponents = availableComponents.value.filter(
            (component) =>
                component.title.toLowerCase().includes(keyword) ||
                component.name.toLowerCase().includes(keyword) ||
                component.description.toLowerCase().includes(keyword),
        );
    }

    const categories = {
        basic: filteredComponents.filter((c) => c.category === "basic"),
        functionCall: filteredComponents.filter(
            (c) => c.category === "functionCall",
        ),
    };
    return categories;
});

const categoryTitles = {
    basic: "基础组件",
    functionCall: "函数调用",
};

const show = () => {
    visible.value = true;
};

const onSelectComponent = (component: NodeSelectorItem) => {
    emit("select", component);
    visible.value = false;
};

defineExpose({
    show,
});
</script>

<script lang="ts">
export default {
    name: "ComponentSelector",
};
</script>
