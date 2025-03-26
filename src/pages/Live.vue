<script setup lang="ts">

import {onMounted, ref} from "vue";
import SoundTts from "./Sound/SoundTts.vue";
import SoundClone from "./Sound/SoundClone.vue";
import VideoGen from "./Video/VideoGen.vue";
import Router from "../router";
import SoundPrompt from "./Sound/SoundPrompt.vue";
import VideoTemplate from "./Video/VideoTemplate.vue";
import VideoGenFlow from "./Video/VideoGenFlow.vue";

const tab = ref('');

onMounted(() => {
    tab.value = Router.currentRoute.value.query.tab as string || 'soundTts';
});
</script>

<template>
    <div class="pb-device-container bg-white h-full relative select-none flex">
        <div class="p-6 w-52 flex-shrink-0 border-r border-solid border-gray-100">
            <div class="p-2 rounded-lg mr-2 mb-4 cursor-pointer"
                 :class="tab === 'soundTts' ? 'bg-gray-200' : ''"
                 @click="tab = 'soundTts'">
                <div class="text-base">
                    <i class="iconfont icon-sound-generate w-6 inline-block"></i>
                    直播形象
                </div>
            </div>
            <div class="p-2 rounded-lg mr-2 mb-4 cursor-pointer"
                 :class="tab === 'soundTts2' ? 'bg-gray-200' : ''"
                 @click="tab = 'soundTts2'">
                <div class="text-base">
                    <i class="iconfont icon-sound-generate w-6 inline-block"></i>
                    音色控制
                </div>
            </div>
            <div class="p-2 rounded-lg mr-2 mb-4 cursor-pointer"
                 :class="tab === 'soundTts1' ? 'bg-gray-200' : ''"
                 @click="tab = 'soundTts'">
                <div class="text-base">
                    <i class="iconfont icon-sound-generate w-6 inline-block"></i>
                    知识库
                </div>
            </div>
            <div class="p-2 rounded-lg mr-2 mb-4 cursor-pointer"
                 :class="tab === 'soundPrompt' ? 'bg-gray-200' : ''"
                 @click="tab = 'soundPrompt'">
                <div class="text-base">
                    <i class="iconfont icon-sound-prompt w-6 inline-block"></i>
                    直播控制
                </div>
            </div>
        </div>
        <div class="flex-grow h-full overflow-y-auto">
            <SoundTts v-if="tab === 'soundTts'"/>
            <SoundPrompt v-else-if="tab==='soundPrompt'"/>
            <SoundClone v-else-if="tab === 'soundClone'"/>
            <VideoTemplate v-else-if="tab==='videoTemplate'"/>
            <VideoGen v-else-if="tab === 'videoGen'"/>
            <VideoGenFlow v-else-if="tab === 'videoGenFlow'"/>
        </div>
    </div>
</template>

<style scoped>

</style>
