import {TaskBiz} from "../store/modules/task";
import {useServerStore} from "../store/modules/server";
import {TaskService} from "../service/TaskService";
import {DataService} from "../service/DataService";

const serverStore = useServerStore();

export const SoundClone: TaskBiz = {
    runFunc: async (bizId, bizParam) => {
        // console.log('SoundClone.runFunc', {bizId, bizParam})
        const {record, server, serverInfo} = await serverStore.prepareForTask(bizId, bizParam);
        // console.log('runFunc', serverInfo, record)
        await TaskService.update(bizId as any, {
            status: "wait",
        });
        const res = await window.$mapi.server.callFunctionWithException(serverInfo, "soundClone", {
            id: serverStore.generateTaskId("SoundClone", bizId),
            result: record.result,
            param: record.param,
            text: record.modelConfig.text,
            promptAudio: record.modelConfig.promptWav,
            promptText: record.modelConfig.promptText,
        });
        if (res.code) {
            throw res.msg || "SoundClone fail";
        }
        switch (res.data.type) {
            case "success":
                await TaskService.update(bizId as any, {
                    status: "success",
                    jobResult: res,
                });
                return "success";
            case "retry":
                return "retry";
            default:
                throw `unknown res.data.type : ${res.data.type}`;
        }
    },
    successFunc: async (bizId, bizParam) => {
        const {record} = await serverStore.prepareForTask(bizId, bizParam);
        await TaskService.update(bizId as any, {
            status: "success",
            endTime: Date.now(),
            result: {
                url: await DataService.saveFile(record.jobResult.data.data.url),
            },
        });
    },
    failFunc: async (bizId, msg, bizParam) => {
        // console.log('SoundClone.failFunc', {bizId, bizParam, msg})
        // const {record, server} = await prepareData(bizId, bizParam)
        await TaskService.update(bizId as any, {
            status: "fail",
            statusMsg: msg,
            endTime: Date.now(),
        });
    },
};
