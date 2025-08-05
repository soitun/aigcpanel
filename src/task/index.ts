import {nextTick} from "vue";
import {TaskService} from "../service/TaskService";
import {useServerStore} from "../store/modules/server";
import {useTaskStore} from "../store/modules/task";
import {SoundAsr} from "./SoundAsr";
import {SoundClone} from "./SoundClone";
import {SoundGenerate} from "./SoundGenerate";
import {SoundTts} from "./SoundTts";
import {VideoGen} from "./VideoGen";
import {VideoGenFlow} from "./VideoGenFlow";
import {SoundReplace} from "./apps/SoundReplace";

const taskStore = useTaskStore();
const serverStore = useServerStore();

export const tasks = {
    // basics
    SoundTts,
    SoundClone,
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
