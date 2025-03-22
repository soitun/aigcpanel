<script setup lang="ts">
import {nextTick, onMounted, ref} from "vue";
import {TaskService} from "../service/TaskService";
import {TimeUtil} from "../lib/util";
import FeedbackTicketButton from "../components/common/FeedbackTicketButton.vue";

const loading = ref(true);

const usageData = ref({
    soundTts: undefined,
    soundTtsToday: undefined,
    soundClone: undefined,
    soundCloneToday: undefined,
    videoGen: undefined,
    videoGenToday: undefined,
})

onMounted(async () => {
    loading.value = false
    nextTick(async () => {
        const todayStart = TimeUtil.formatDate(Date.now()) + ' 00:00:00'
        const todayStartTimestamp = TimeUtil.datetimeToTimestamp(todayStart)
        usageData.value.soundTts = await TaskService.count('SoundTts')
        usageData.value.soundTtsToday = await TaskService.count('SoundTts', todayStartTimestamp)
        usageData.value.soundClone = await TaskService.count('SoundClone')
        usageData.value.soundCloneToday = await TaskService.count('SoundClone', todayStartTimestamp)
        usageData.value.videoGen = await TaskService.count('VideoGen')
        usageData.value.videoGenToday = await TaskService.count('VideoGen', todayStartTimestamp)
    })
})

</script>

<template>
    <div class="page-narrow-container p-6 pb-home h-full overflow-hidden">
        <div class="text-3xl font-bold mb-5">
            {{ $t('欢迎使用 AigcPanel!') }}
        </div>
        <div class="mb-5">
            <div class="flex gap-5 pb-top-area">
                <div class="flex-grow w-0 bg-white rounded-lg p-3 bg-contain bg-right bg-no-repeat">
                    <div class="font-bold text-xl mb-3">{{ $t('声音合成') }}</div>
                    <div class="h-10 truncate overflow-hidden">
                        {{ $t('多种音色支持，开放模型接入') }}
                    </div>
                    <div>
                        <a-button type="primary" @click="$router.push('/video?tab=soundTts')">
                            {{ $t('立即使用') }}
                        </a-button>
                    </div>
                </div>
                <div class="flex-grow w-0 bg-white rounded-lg p-3 bg-contain bg-right bg-no-repeat">
                    <div class="font-bold text-xl mb-3">{{ $t('声音克隆') }}</div>
                    <div class="h-10 truncate overflow-hidden">
                        {{ $t('多种开放模型真实还原音色') }}
                    </div>
                    <div>
                        <a-button type="primary" @click="$router.push('/video?tab=soundClone')">
                            {{ $t('立即使用') }}
                        </a-button>
                    </div>
                </div>
                <div class="flex-grow w-0 bg-white rounded-lg p-3 bg-contain bg-right bg-no-repeat">
                    <div class="font-bold text-xl mb-3">{{ $t('视频合成') }}</div>
                    <div class="h-10 truncate overflow-hidden">
                        {{ $t('离线本地模型，云端模型接入') }}
                    </div>
                    <div>
                        <a-button type="primary" @click="$router.push('/video?tab=videoGen')">
                            {{ $t('立即使用') }}
                        </a-button>
                    </div>
                </div>
            </div>
        </div>
        <div class="bg-white rounded-lg p-4 mb-5">
            <div class="text-xl font-bold mb-4">{{ $t('数据统计') }}</div>
            <div class="flex">
                <div class="flex-grow w-0">
                    <div class="mb-3">
                        {{ $t('声音合成') }}
                    </div>
                    <div class="font-bold text-2xl mb-3">
                        <a-statistic animation placeholder="-" :value="usageData.soundTts as any"/>
                    </div>
                    <div>
                        {{ $t('今日') }} +
                        <a-statistic animation
                                     placeholder="-"
                                     :value-style="{
                                        color: usageData.soundTtsToday && usageData.soundTtsToday > 0 ? 'green' : 'gray',
                                        fontSize: '14px'
                                     }"
                                     :value="usageData.soundTtsToday as any"/>
                    </div>
                </div>
                <div class="flex-grow w-0">
                    <div class="mb-3">
                        {{ $t('声音克隆') }}
                    </div>
                    <div class="font-bold text-2xl mb-3">
                        <a-statistic animation placeholder="-" :value="usageData.soundClone as any"/>
                    </div>
                    <div>
                        {{ $t('今日') }} +
                        <a-statistic animation placeholder="-"
                                     :value-style="{
                                        color: usageData.soundCloneToday && usageData.soundCloneToday > 0 ? 'green' : 'gray',
                                        fontSize: '14px'
                                     }"
                                     :value="usageData.soundCloneToday as any"/>
                    </div>
                </div>
                <div class="flex-grow w-0">
                    <div class="mb-3">
                        {{ $t('视频合成') }}
                    </div>
                    <div class="font-bold text-2xl mb-3">
                        <a-statistic animation placeholder="-" :value="usageData.videoGen as any"/>
                    </div>
                    <div>
                        {{ $t('今日') }} +
                        <a-statistic animation placeholder="-"
                                     :value-style="{
                                        color: usageData.videoGenToday && usageData.videoGenToday > 0 ? 'green' : 'gray',
                                        fontSize: '14px'
                                     }"
                                     :value="usageData.videoGenToday as any"/>
                    </div>
                </div>
            </div>
        </div>
        <div>
            <div class="flex gap-5">
                <a href="https://aigcpanel.com/zh/asset" target="_blank"
                   class="bg-white rounded-lg p-3 flex items-center flex-grow w-0">
                    <div class="flex-grow">
                        <div class="font-bold text-xl mb-3">
                            {{$t('模型市场')}}
                        </div>
                        <div class="text-gray-600">
                            {{$t('多种开源模型持续更新')}}
                        </div>
                    </div>
                    <div>
                        <icon-right class="text-2xl text-gray-400" />
                    </div>
                </a>
                <div class="bg-white rounded-lg p-3 flex items-center flex-grow w-0">
                    <div class="flex-grow">
                        <div class="font-bold text-xl mb-3">
                            {{$t('工单反馈')}}
                        </div>
                        <div class="text-gray-400">
                            {{$t('遇到问题随时反馈')}}
                        </div>
                    </div>
                    <div>
                        <FeedbackTicketButton/>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="0" class="bg-white rounded-lg p-4 mb-4">
            <div class="text-xl font-bold mb-4">模型管理</div>
            <div class="flex">
                <div v-for="i in 4" class="flex-grow">
                    <div class="mb-3">
                        声音克隆
                    </div>
                    <div class="font-bold text-2xl mb-3">
                        99
                    </div>
                    <div>
                        今日：+1
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="less" scoped>
.pb-top-area > div {
    background-size: 7rem;
    &:nth-child(1) {
        background-image: url(./../assets/image/icon/soundTts.svg);
    }

    &:nth-child(2) {
        background-image: url(./../assets/image/icon/soundClone.svg);
    }

    &:nth-child(3) {
        background-image: url(./../assets/image/icon/videoGen.svg);
    }
}
</style>

