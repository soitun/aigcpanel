<script setup lang="ts">

import {onMounted, ref} from "vue";
import Router from "../router";

const tab = ref('');

onMounted(() => {
    tab.value = Router.currentRoute.value.query.tab as string || 'knowledge';
});
</script>

<template>
    <div class="pb-device-container bg-white h-full relative select-none flex">
        <div class="p-6 w-52 flex-shrink-0 border-r border-solid border-gray-100 overflow-x-hidden overflow-y-auto">
            <div class="p-2 rounded-lg mr-2 mb-4 cursor-pointer"
                 :class="tab === 'knowledge' ? 'bg-gray-200' : ''"
                 @click="tab = 'knowledge'">
                <div class="text-base">
                    <div class="inline-block w-6">
                        <icon-book/>
                    </div>
                    直播知识库
                </div>
            </div>
            <div class="p-2 rounded-lg mr-2 mb-4 cursor-pointer"
                 :class="tab === 'monitor' ? 'bg-gray-200' : ''"
                 @click="tab = 'monitor'">
                <div class="text-base">
                    <div class="inline-block w-6">
                        <icon-command/>
                    </div>
                    直播控制台
                </div>
            </div>
            <div class="p-2 rounded-lg mr-2 mb-4 cursor-pointer"
                 :class="tab === 'event' ? 'bg-gray-200' : ''"
                 @click="tab = 'event'">
                <div class="text-base">
                    <div class="inline-block w-6">
                        <icon-message/>
                    </div>
                    直播互动
                </div>
            </div>
            <div class="p-2 rounded-lg mr-2 mb-4 cursor-pointer"
                 :class="tab === 'liveTalk' ? 'bg-gray-200' : ''"
                 @click="tab = 'liveTalk'">
                <div class="text-base">
                    <div class="inline-block w-6">
                        <icon-history />
                    </div>
                    播报历史
                </div>
            </div>
        </div>
        <div class="flex-grow h-full overflow-y-auto">
            <div class="text-center py-32 text-lg">
                <div class="text-center mb-4">
                    <img class="w-32 h-32 opacity-50 mx-auto" src="./../assets/image/upgrade.svg" />
                </div>
                <div class="mb-4">
                    请下载 Pro 版本使用直播功能
                </div>
                <div>
                    <a class="arco-btn arco-btn-size-medium arco-btn-primary"
                       href="https://aigcpanel.com" target="_blank">
                        <icon-link />
                        立即下载
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>

</style>
