<script setup lang="ts">
import TextToImageFormViewBody from "./TextToImageFormViewBody.vue";

const props = defineProps<{
    data: any;
}>();
</script>

<template>
    <div class="mb-4">
        <div class="font-bold mb-2">
            {{ $t("文生图配置") }}
        </div>
        <div>
            <TextToImageFormViewBody :data="data" />
        </div>
    </div>
</template>
