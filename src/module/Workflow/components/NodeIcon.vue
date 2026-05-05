<script setup lang="ts">
import { computed } from "vue";
import { NodeType } from "../core/type";
import { getNodeIcon } from "../core/util";

const props = defineProps<{
    type: NodeType;
}>();
const icon = computed(() => {
    return getNodeIcon(props.type);
});
</script>

<template>
    <component
        :is="typeof icon === 'string' ? 'img' : icon"
        :src="typeof icon === 'string' ? icon : undefined"
        class="w-5 h-5 object-contain"
    />
</template>

<style scoped></style>
