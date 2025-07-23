<script setup lang="ts">

import {t} from "../lang";
import {onMounted, ref} from "vue";
import VideoGen from "./Video/VideoGen.vue";
import Router from "../router";
import VideoTemplate from "./Video/VideoTemplate.vue";
import VideoGenFlow from "./Video/VideoGenFlow.vue";

const tab = ref('');

onMounted(() => {
    tab.value = Router.currentRoute.value.query.tab as string || 'videoGen';
});

</script>

<template>
    <div class="pb-device-container bg-white h-full relative select-none flex">
        <div class="p-6 w-52 flex-shrink-0 border-r border-solid border-gray-100 overflow-x-hidden overflow-y-auto">
            <div class="p-2 rounded-lg mb-4 cursor-pointer"
                 :class="tab === 'videoGen' ? 'bg-gray-200' : ''"
                 @click="tab = 'videoGen'">
                <div class="text-base truncate">
                    <i class="iconfont icon-video w-6 inline-block"></i>
                    {{ t('数字人合成') }}
                </div>
            </div>
            <div class="p-2 rounded-lg mb-4 cursor-pointer"
                 :class="tab === 'videoTemplate' ? 'bg-gray-200' : ''"
                 @click="tab = 'videoTemplate'">
                <div class="text-base truncate">
                    <i class="iconfont icon-video-template w-6 inline-block"></i>
                    {{ t('数字人形象') }}
                </div>
            </div>
            <div class="p-2 rounded-lg mb-4 cursor-pointer"
                 :class="tab === 'videoGenFlow' ? 'bg-gray-200' : ''"
                 @click="tab = 'videoGenFlow'">
                <div class="text-base truncate">
                    <i class="iconfont icon-quick w-6 inline-block"></i>
                    {{ $t('数字人一键合成') }}
                </div>
            </div>
        </div>
        <div class="flex-grow h-full overflow-y-auto">
            <VideoGen v-if="tab === 'videoGen'"/>
            <VideoTemplate v-else-if="tab==='videoTemplate'"/>
            <VideoGenFlow v-else-if="tab === 'videoGenFlow'"/>
        </div>
    </div>
</template>

<style scoped>

</style>
