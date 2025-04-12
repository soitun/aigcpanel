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
        <div class="p-6 w-52 flex-shrink-0 border-r border-solid border-gray-100">
            <div class="p-2 rounded-lg mr-2 mb-4 cursor-pointer"
                 :class="tab === 'knowledge' ? 'bg-gray-200' : ''"
                 @click="tab = 'knowledge'">
                <div class="text-base">
                    <div class="inline-block w-6">
                        <icon-book/>
                    </div>
                    知识库
                </div>
            </div>
            <div class="p-2 rounded-lg mr-2 mb-4 cursor-pointer"
                 :class="tab === 'avatar' ? 'bg-gray-200' : ''"
                 @click="tab = 'avatar'">
                <div class="text-base">
                    <div class="inline-block w-6">
                        <icon-user-group/>
                    </div>
                    形象管理
                </div>
            </div>
            <div class="p-2 rounded-lg mr-2 mb-4 cursor-pointer"
                 :class="tab === 'monitor' ? 'bg-gray-200' : ''"
                 @click="tab = 'monitor'">
                <div class="text-base">
                    <div class="inline-block w-6">
                        <icon-command/>
                    </div>
                    控制台
                </div>
            </div>
        </div>
        <div class="flex-grow h-full overflow-y-auto">
            <LiveKnowledge v-if="tab === 'knowledge'"/>
            <LiveAvatar v-else-if="tab === 'avatar'"/>
            <LiveMonitor v-else-if="tab === 'monitor'"/>
        </div>
    </div>
</template>

<style scoped>

</style>
