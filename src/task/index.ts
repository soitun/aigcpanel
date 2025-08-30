import {nextTick} from "vue";
import {SoundReplace, SoundReplaceCleaner} from "../pages/Apps/SoundReplace/task";
import {VideoGenFlow} from "../pages/Apps/VideoGenFlow/task";
import {TaskService} from "../service/TaskService";
import {useServerStore} from "../store/modules/server";
import {useTaskStore} from "../store/modules/task";
import {SoundAsr} from "./SoundAsr";
import {SoundGenerate} from "./SoundGenerate";
import {VideoGen} from "./VideoGen";

const taskStore = useTaskStore();
const serverStore = useServerStore();

export const tasks = {
    // basics
    SoundGenerate,
    SoundAsr,
    VideoGen,
    // apps
    VideoGenFlow,
    SoundReplace,
};

export const taskCleaners = {
    SoundReplace: SoundReplaceCleaner,
}

export const TaskManager = {
    init() {
        for (const k in tasks) {
            taskStore.register(k, tasks[k]);
        }
        nextTick(async () => {
            await serverStore.waitReady();
            for (const k in tasks) {
                await TaskService.restoreForTask(k as any);
            }
            for (const k in taskCleaners) {
                TaskService.registerCleaner(k as any, taskCleaners[k]);
            }
        }).then();
    },
    count() {
        return taskStore.records.length;
    },
};
