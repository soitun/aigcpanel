<script setup lang="ts">

import {onMounted, ref} from "vue";
import Router from "../router";
import LiveKnowledge from "./Live/LiveKnowledge.vue";
import LiveAvatar from "./Live/LiveAvatar.vue";
import LiveMonitor from "./Live/LiveMonitor.vue";

const tab = ref('');

onMounted(() => {
    tab.value = Router.currentRoute.value.query.tab as string || 'knowledge';
});
</script>

<template>
    <div class="pb-device-container bg-white h-full relative select-none flex">
        <div class="text-center w-full">
        </div>
    </div>
</template>

