<script setup lang="ts">

import {t} from "../lang";
import {onMounted, ref} from "vue";
import SoundTts from "./Sound/SoundTts.vue";
import SoundClone from "./Sound/SoundClone.vue";
import Router from "../router";
import SoundPrompt from "./Sound/SoundPrompt.vue";

const tab = ref('');

onMounted(() => {
    tab.value = Router.currentRoute.value.query.tab as string || 'soundTts';
});

</script>

<template>
    <div class="pb-device-container bg-white h-full relative select-none flex">
        <div class="p-6 w-52 flex-shrink-0 border-r border-solid border-gray-100 overflow-x-hidden overflow-y-auto">
            <div class="p-2 rounded-lg mb-4 cursor-pointer"
                 :class="tab === 'soundTts' ? 'bg-gray-200' : ''"
                 @click="tab = 'soundTts'">
                <div class="text-base truncate">
                    <i class="iconfont icon-sound-generate w-6 inline-block"></i>
                    {{ t('声音合成') }}
                </div>
            </div>
            <div class="p-2 rounded-lg mb-4 cursor-pointer"
                 :class="tab === 'soundPrompt' ? 'bg-gray-200' : ''"
                 @click="tab = 'soundPrompt'">
                <div class="text-base truncate">
                    <i class="iconfont icon-sound-prompt w-6 inline-block"></i>
                    {{ t('音色管理') }}
                </div>
            </div>
            <div class="p-2 rounded-lg mb-4 cursor-pointer"
                 :class="tab === 'soundClone' ? 'bg-gray-200' : ''"
                 @click="tab = 'soundClone'">
                <div class="text-base truncate">
                    <i class="iconfont icon-sound-clone w-6 inline-block"></i>
                    {{ t('声音克隆') }}
                </div>
            </div>
        </div>
        <div class="flex-grow h-full overflow-y-auto">
            <SoundTts v-if="tab === 'soundTts'"/>
            <SoundPrompt v-else-if="tab==='soundPrompt'"/>
            <SoundClone v-else-if="tab === 'soundClone'"/>
        </div>
    </div>
</template>

<style scoped>

</style>
