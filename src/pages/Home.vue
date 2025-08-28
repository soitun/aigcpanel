<script setup lang="ts">
import {nextTick, onMounted, ref} from "vue";
import FeedbackTicketButton from "../components/common/FeedbackTicketButton.vue";
import {TimeUtil} from "../lib/util";
import {TaskService} from "../service/TaskService";
import {t} from "../lang";
import Router from "../router";

const loading = ref(true);

const usageData = ref({
    soundGenerate: undefined,
    soundGenerateToday: undefined,
    soundAsr: undefined,
    soundAsrToday: undefined,
    videoGen: undefined,
    videoGenToday: undefined,
    taskTotal: undefined,
    taskTotalToday: undefined,
});

const apps: {
    title: string;
    description: string;
    url: string;
}[] = [
    {
        title: t("声音替换"),
        description: t("将视频中的人声替换为其他音色"),
        url: "/sound?tab=soundReplace",
    },
    {
        title: t("数字人一键合成"),
        description: t("输入文本自动合成音频驱动口型合成视频"),
        url: "/video?tab=videoGenFlow",
    },
    {
        title: t("工具需求"),
        description: t("更多工具提交需求给我们"),
        url: "https://aigcpanel.com/wish",
    },
];

const doUrl = (url: string) => {
    if (url.startsWith("http")) {
        window.$mapi.app.openExternal(url);
    } else {
        Router.push(url);
    }
};

onMounted(async () => {
    loading.value = false;
    nextTick(async () => {
        const todayStart = TimeUtil.formatDate(Date.now()) + " 00:00:00";
        const todayStartTimestamp = TimeUtil.datetimeToTimestamp(todayStart);
        usageData.value.soundGenerate = await TaskService.count("SoundGenerate");
        usageData.value.soundGenerateToday = await TaskService.count("SoundGenerate", todayStartTimestamp);
        usageData.value.soundAsr = await TaskService.count("SoundAsr");
        usageData.value.soundAsrToday = await TaskService.count("SoundAsr", todayStartTimestamp);
        usageData.value.videoGen = await TaskService.count("VideoGen");
        usageData.value.videoGenToday = await TaskService.count("VideoGen", todayStartTimestamp);
        usageData.value.taskTotal = await TaskService.count(null);
        usageData.value.taskTotalToday = await TaskService.count(null, todayStartTimestamp);
    });
});
</script>

<template>
    <div class="page-narrow-container p-6 pb-home h-full overflow-hidden overflow-y-auto">
        <div class="flex">
            <div class="text-3xl font-bold mb-5 flex-grow">
                {{ $t("欢迎使用 AIGCPanel !") }}
            </div>
            <div>
                <a target="_blank" class="text-red-500" href="https://aigcpanel.com/forum">
                    <icon-message class="mr-1" />
                    {{ $t("使用遇到问题？发帖求助") }}
                </a>
            </div>
        </div>
        <div class="mb-5">
            <div class="flex gap-5 pb-top-area">
                <div class="flex-grow w-0 bg-white rounded-lg p-3 bg-contain bg-right bg-no-repeat hover:shadow-lg">
                    <div class="font-bold text-xl mb-1">{{ $t("声音合成") }}</div>
                    <div class="h-8 truncate overflow-hidden text-gray-500">
                        {{ $t("上千种音色模型支持") }}
                    </div>
                    <div>
                        <a-button type="primary" @click="$router.push('/sound?tab=soundGenerate')">
                            {{ $t("立即使用") }}
                        </a-button>
                    </div>
                </div>
                <div class="flex-grow w-0 bg-white rounded-lg p-3 bg-contain bg-right bg-no-repeat hover:shadow-lg">
                    <div class="font-bold text-xl mb-1">{{ $t("语音识别") }}</div>
                    <div class="h-8 truncate overflow-hidden text-gray-500">
                        {{ $t("识别文件下载文本/字幕") }}
                    </div>
                    <div>
                        <a-button type="primary" @click="$router.push('/sound?tab=soundAsr')">
                            {{ $t("立即使用") }}
                        </a-button>
                    </div>
                </div>
                <div class="flex-grow w-0 bg-white rounded-lg p-3 bg-contain bg-right bg-no-repeat hover:shadow-lg">
                    <div class="font-bold text-xl mb-1">{{ $t("数字人合成") }}</div>
                    <div class="h-8 truncate overflow-hidden text-gray-500">
                        {{ $t("音频驱动口型合成视频") }}
                    </div>
                    <div>
                        <a-button type="primary" @click="$router.push('/video?tab=videoGen')">
                            {{ $t("立即使用") }}
                        </a-button>
                    </div>
                </div>
                <div class="flex-grow w-0 bg-white rounded-lg p-3 bg-contain bg-right bg-no-repeat hover:shadow-lg">
                    <div class="font-bold text-xl mb-1">{{ $t("数字人直播") }}</div>
                    <div class="h-8 truncate overflow-hidden text-gray-500">
                        {{ $t("互动交流支持各大平台") }}
                    </div>
                    <div>
                        <a-button type="primary" @click="$router.push('/live')">
                            {{ $t("立即使用") }}
                        </a-button>
                    </div>
                </div>
            </div>
        </div>
        <div class="bg-white rounded-lg p-4 mb-5 hover:shadow-lg">
            <div class="text-xl font-bold mb-4">
                <icon-bar-chart />
                {{ $t("数据统计") }}
            </div>
            <div class="flex">
                <div class="flex-grow w-0">
                    <div class="mb-3">
                        {{ $t("声音合成") }}
                    </div>
                    <div class="font-bold text-2xl mb-3">
                        <a-statistic animation placeholder="-" :value="usageData.soundGenerate as any" />
                    </div>
                    <div>
                        {{ $t("今日") }} +
                        <a-statistic
                            animation
                            placeholder="-"
                            :value-style="{
                                color:
                                    usageData.soundGenerateToday && usageData.soundGenerateToday > 0 ? 'green' : 'gray',
                                fontSize: '14px',
                            }"
                            :value="usageData.soundGenerateToday as any"
                        />
                    </div>
                </div>
                <div class="flex-grow w-0">
                    <div class="mb-3">
                        {{ $t("语音识别") }}
                    </div>
                    <div class="font-bold text-2xl mb-3">
                        <a-statistic animation placeholder="-" :value="usageData.soundAsr as any" />
                    </div>
                    <div>
                        {{ $t("今日") }} +
                        <a-statistic
                            animation
                            placeholder="-"
                            :value-style="{
                                color: usageData.soundAsrToday && usageData.soundAsrToday > 0 ? 'green' : 'gray',
                                fontSize: '14px',
                            }"
                            :value="usageData.soundAsrToday as any"
                        />
                    </div>
                </div>
                <div class="flex-grow w-0">
                    <div class="mb-3">
                        {{ $t("数字人合成") }}
                    </div>
                    <div class="font-bold text-2xl mb-3">
                        <a-statistic animation placeholder="-" :value="usageData.videoGen as any" />
                    </div>
                    <div>
                        {{ $t("今日") }} +
                        <a-statistic
                            animation
                            placeholder="-"
                            :value-style="{
                                color: usageData.videoGenToday && usageData.videoGenToday > 0 ? 'green' : 'gray',
                                fontSize: '14px',
                            }"
                            :value="usageData.videoGenToday as any"
                        />
                    </div>
                </div>
                <div class="flex-grow w-0">
                    <div class="mb-3">
                        {{ $t("今日总任务") }}
                    </div>
                    <div class="font-bold text-2xl mb-3">
                        <a-statistic animation placeholder="-" :value="usageData.taskTotal as any" />
                    </div>
                    <div>
                        {{ $t("今日") }} +
                        <a-statistic
                            animation
                            placeholder="-"
                            :value-style="{
                                color: usageData.taskTotalToday && usageData.taskTotalToday > 0 ? 'green' : 'gray',
                                fontSize: '14px',
                            }"
                            :value="usageData.taskTotalToday as any"
                        />
                    </div>
                </div>
            </div>
        </div>
        <div class="mb-4">
            <div class="flex gap-5">
                <a
                    href="https://aigcpanel.com/zh/asset"
                    target="_blank"
                    class="bg-white rounded-lg p-3 flex items-center flex-grow w-0 hover:shadow-lg"
                >
                    <div class="flex-grow">
                        <div class="font-bold text-xl mb-3">
                            {{ $t("模型市场") }}
                        </div>
                        <div class="text-gray-600">
                            {{ $t("多种开源模型持续更新") }}
                        </div>
                    </div>
                    <div>
                        <icon-right class="text-2xl text-gray-400" />
                    </div>
                </a>
                <div class="bg-white rounded-lg p-3 flex items-center flex-grow w-0 hover:shadow-lg">
                    <div class="flex-grow">
                        <div class="font-bold text-xl mb-3">
                            {{ $t("工单反馈") }}
                        </div>
                        <div class="text-gray-600">
                            {{ $t("遇到问题随时反馈") }}
                        </div>
                    </div>
                    <div>
                        <FeedbackTicketButton />
                    </div>
                </div>
            </div>
        </div>
        <div class="bg-white rounded-lg p-4 mb-5">
            <div class="text-xl font-bold mb-4">
                <icon-tool />
                {{ $t("应用工具") }}
            </div>
            <div class="flex flex-wrap gap-5 mt-3">
                <div
                    v-for="(app, index) in apps"
                    :key="index"
                    class="bg-white rounded-lg p-3 flex items-center flex-grow w-64 cursor-pointer border hover:shadow-xl"
                    @click="doUrl(app.url)"
                >
                    <div class="flex-grow">
                        <div class="font-bold text-lg mb-1">{{ app.title }}</div>
                        <div class="h-8 truncate overflow-hidden text-gray-500">
                            {{ app.description }}
                        </div>
                    </div>
                    <div>
                        <icon-right class="text-gray-400" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="less" scoped>
.pb-top-area > div {
    background-size: 3rem;
    background-position: 95% center;

    &:nth-child(1) {
        background-image: url(./../assets/image/icon/soundGenerate.png);
    }

    &:nth-child(2) {
        background-image: url(./../assets/image/icon/soundAsr.png);
    }

    &:nth-child(3) {
        background-image: url(./../assets/image/icon/videoGen.png);
    }

    &:nth-child(4) {
        background-image: url(./../assets/image/icon/live.png);
    }
}
</style>
