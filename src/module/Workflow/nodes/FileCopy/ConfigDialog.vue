<script setup lang="ts">
import { computed, ref } from "vue";
import { t } from "../../../../lang";
import { NodeProperties } from "../../core/type";

const visible = ref(false);

const props = defineProps<{
    properties: NodeProperties;
}>();
const emit = defineEmits<{
    update: [val: any];
}>();

const overwrite = computed({
    get: () => props.properties?.data?.overwrite ?? false,
    set: (val: boolean) =>
        onUpdate({
            data: { ...(props.properties?.data || {}), overwrite: val },
        }),
});

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
        :title="t('配置文件复制')"
        width="600px"
    >
        <div
            class="-mx-4 -my-5 p-4 overflow-y-auto"
            style="height: calc(100vh - 15rem)"
        >
            <div class="space-y-4">
                <div>
                    <a-checkbox v-model="overwrite">
                        {{ $t("目标文件存在时覆盖") }}
                    </a-checkbox>
                    <div class="text-sm text-gray-500 mt-1">
                        {{ $t("如果不勾选，当目标文件存在时将自动添加后缀") }}
                    </div>
                </div>
            </div>
        </div>
    </a-modal>
</template>
