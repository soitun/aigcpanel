<template>
    <div
        class="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg z-[1000] p-2 flex items-center gap-2"
    >
        <NodeAddAction />

        <div class="w-px h-6 bg-gray-200 mx-1"></div>

        <a-button-group>
            <a-button @click="onZoomOut" size="small">
                <template #icon>
                    <icon-zoom-out />
                </template>
            </a-button>
            <a-button @click="onResetZoom" size="small">
                <div
                    class="px-3 py-1 text-xs text-gray-600 min-w-[50px] text-center"
                >
                    {{ Math.round(zoomLevel * 100) }}%
                </div>
            </a-button>
            <a-button @click="onZoomIn" size="small">
                <template #icon>
                    <icon-zoom-in />
                </template>
            </a-button>
        </a-button-group>

        <a-button @click="onFitView" size="small" class="ml-2">
            <template #icon>
                <icon-fullscreen />
            </template>
        </a-button>
    </div>
</template>

<script setup lang="ts">
import NodeAddAction from "./NodeAddAction.vue";

interface Props {
    zoomLevel: number;
}

interface Emits {
    (e: "zoom-in"): void;

    (e: "zoom-out"): void;

    (e: "reset-zoom"): void;

    (e: "fit-view"): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const onZoomIn = () => {
    emit("zoom-in");
};

const onZoomOut = () => {
    emit("zoom-out");
};

const onResetZoom = () => {
    emit("reset-zoom");
};

const onFitView = () => {
    emit("fit-view");
};
</script>

<script lang="ts">
export default {
    name: "FloatingToolbar",
};
</script>
