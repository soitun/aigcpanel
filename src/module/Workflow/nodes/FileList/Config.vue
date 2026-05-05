<script setup lang="ts">
import { NodeProperties } from "../../core/type";
import ParamView from "./ParamView.vue";

const props = defineProps<{
    node: any;
    properties: NodeProperties;
}>();

const emit = defineEmits<{
    updateProperties: [val: NodeProperties];
}>();
</script>

<template>
    <div class="p-2">
        <div class="space-y-2 max-h-64 overflow-y-auto">
            <ParamView :properties="properties" />
        </div>
    </div>
</template>
