<script setup lang="ts">
import { ref } from "vue";
import { t } from "../../../../lang";
import { NodeProperties } from "../../core/type";

const visible = ref(false);

const props = defineProps<{
    properties: NodeProperties;
}>();
const emit = defineEmits<{
    update: [val: any];
}>();

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
        :title="t('配置文件列表')"
        width="600px"
    >
        <div
            class="-mx-4 -my-5 p-4 overflow-y-auto"
            style="height: calc(100vh - 15rem)"
        >
            <div class="space-y-4">
                <!-- No configuration needed for FileList -->
                <div>
                    {{ $t("此节点无需额外配置") }}
                </div>
            </div>
        </div>
    </a-modal>
</template>
