import {TaskService} from "../service/TaskService";
import {useServerStore} from "../store/modules/server";
import {TaskBiz} from "../store/modules/task";

const serverStore = useServerStore();

export const SoundAsr: TaskBiz = {
    runFunc: async (bizId, bizParam) => {
        // console.log('SoundAsr.runFunc', {bizId, bizParam})
        const {record, server, serverInfo} = await serverStore.prepareForTask(bizId, bizParam);
        // console.log('SoundAsr.runFunc.serverInfo', serverInfo)
        await TaskService.update(bizId as any, {
            status: "wait",
        });
        const res = await window.$mapi.server.callFunctionWithException(serverInfo, "asr", {
            id: serverStore.generateTaskId("SoundAsr", bizId),
            result: record.result,
            param: record.param,
            audioFile: record.modelConfig.audioFile,
        });
        if (res.code) {
            throw res.msg || "SoundAsr run fail";
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
                recognizedText: record.jobResult.data.data.recognizedText || record.jobResult.data.data.text,
                confidence: record.jobResult.data.data.confidence,
                segments: record.jobResult.data.data.segments,
                language: record.jobResult.data.data.language,
                duration: record.jobResult.data.data.duration,
            },
        });
    },
    failFunc: async (bizId, msg, bizParam) => {
        // console.log('SoundAsr.failFunc', {bizId, bizParam, msg})
        await TaskService.update(bizId as any, {
            status: "fail",
            statusMsg: msg,
            endTime: Date.now(),
        });
    },
};
