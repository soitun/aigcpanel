import {nextTick} from "vue";
import {SoundReplace} from "../pages/Apps/SoundReplace/SoundReplace";
import {VideoGenFlow} from "../pages/Apps/VideoGenFlow/VideoGenFlow";
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
        }).then();
    },
    count() {
        return taskStore.records.length;
    },
};
