import {useTaskStore} from "../store/modules/task";
import {SoundTts} from "./SoundTts";
import {nextTick} from "vue";
import {SoundClone} from "./SoundClone";
import {VideoGen} from "./VideoGen";
import {VideoGenFlow} from "./VideoGenFlow";
import {useServerStore} from "../store/modules/server";
import {TaskService} from "../service/TaskService";

const taskStore = useTaskStore()
const serverStore = useServerStore()

export const tasks = {
    SoundTts,
    SoundClone,
    VideoGen,
    VideoGenFlow,
}

export const TaskManager = {
    init() {
        for (const k in tasks) {
            taskStore.register(k, tasks[k])
        }
        nextTick(async () => {
            await serverStore.waitReady()
            for (const k in tasks) {
                await TaskService.restoreForTask(k as any)
            }
        }).then()
    },
    count() {
        return taskStore.records.length
    }
}
