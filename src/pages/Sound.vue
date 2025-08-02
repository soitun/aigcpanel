<script setup lang="ts">

import { onMounted, ref } from "vue";
import { t } from "../lang";
import Router from "../router";
import SoundAsr from "./Sound/SoundAsr.vue";
import SoundGenerate from "./Sound/SoundGenerate.vue";

const tab = ref('');

onMounted(() => {
    tab.value = Router.currentRoute.value.query.tab as string || 'soundGenerate';
});

</script>

<template>
    <div class="pb-device-container bg-white h-full relative select-none flex">
        <div class="p-6 w-52 flex-shrink-0 border-r border-solid border-gray-100 overflow-x-hidden overflow-y-auto">
            <div class="p-2 rounded-lg mb-4 cursor-pointer" :class="tab === 'soundGenerate' ? 'bg-gray-200' : ''"
                @click="tab = 'soundGenerate'">
                <div class="text-base truncate">
                    <i class="iconfont icon-sound-generate w-6 inline-block"></i>
                    {{ t('声音合成') }}
                </div>
            </div>
            <div class="p-2 rounded-lg mb-4 cursor-pointer" :class="tab === 'soundAsr' ? 'bg-gray-200' : ''"
                @click="tab = 'soundAsr'">
                <div class="text-base truncate">
                    <i class="iconfont icon-asr w-6 inline-block"></i>
                    {{ t('语音识别') }}
                </div>
            </div>
        </div>
        <div class="flex-grow h-full overflow-y-auto">
            <SoundGenerate v-if="tab === 'soundGenerate'" />
            <SoundAsr v-if="tab === 'soundAsr'" />
        </div>
    </div>
</template>

<style scoped></style>
