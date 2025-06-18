import {useTaskStore} from "../store/modules/task";
import {SoundTts} from "./SoundTts";
import {nextTick} from "vue";
import {SoundClone} from "./SoundClone";
import {VideoGen} from "./VideoGen";
import {VideoGenFlow} from "./VideoGenFlow";
import {useServerStore} from "../store/modules/server";

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
                await tasks[k].restore?.()
            }
        }).then()
        // taskStore.register('TestSync', TestSync)
        // taskStore.register('TestAsync', TestAsync)
        // setInterval(async () => {
        //     // await taskStore.dispatch('TestSync', StringUtil.random())
        //     await taskStore.dispatch('TestAsync', StringUtil.random(), {
        //         'a': 1,
        //     }, {
        //         timeout: 3 * 1000,
        //     })
        // }, 10 * 1000)
    },
    count() {
        return taskStore.records.length
    }
}
