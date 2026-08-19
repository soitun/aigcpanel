import { DataService } from "../service/DataService";
import { TaskService } from "../service/TaskService";
import { useServerStore } from "../store/modules/server";
import { TaskBiz } from "../store/modules/task";

const serverStore = useServerStore();

// Allowed audio extensions for videoGen, reject video containers like mp4
const AUDIO_EXT_WHITELIST = ["wav", "mp3", "flac", "ogg", "aac", "m4a", "wma"];

const getAudioExt = (path: string) => {
    if (!path) return "";
    let p = path;
    // handle query string in URL (e.g. ?X-Amz-...=...)
    const queryIndex = p.search(/[?#]/);
    if (queryIndex >= 0) {
        p = p.substring(0, queryIndex);
    }
    const match = p.match(/\.([A-Za-z0-9]+)$/);
    return match ? match[1].toLowerCase() : "";
};

export const VideoGen: TaskBiz = {
    runFunc: async (bizId, bizParam) => {
        // console.log('VideoGen.runFunc', {bizId, bizParam})
        const { record, server, serverInfo } = await serverStore.prepareForTask(
            bizId,
            bizParam,
        );
        const modelConfig: VideoGenModelConfigType = record.modelConfig;
        // console.log('VideoGen.runFunc.serverInfo', serverInfo)
        await TaskService.update(bizId, {
            status: "wait",
        });
        let audioFile: string | null = null;
        if (modelConfig.soundType === "soundGenerate") {
            const soundRecord = await TaskService.get(
                modelConfig.soundGenerateId,
            );
            audioFile = soundRecord?.result.url as string;
        } else if (modelConfig.soundType === "soundCustom") {
            audioFile = modelConfig.soundCustomFile;
        }
        if (!audioFile) {
            throw new Error("AudioFileEmpty");
        }
        // Reject unsupported audio format (e.g. a video container uploaded as audio)
        const audioExt = getAudioExt(audioFile);
        if (audioExt && !AUDIO_EXT_WHITELIST.includes(audioExt)) {
            throw new Error(
                `audio format not supported: .${audioExt}, expected ${AUDIO_EXT_WHITELIST.join(
                    "/",
                )}`,
            );
        }
        const res = await serverStore.call(serverInfo, "videoGen", {
            id: serverStore.generateTaskId("VideoGen", bizId),
            result: record.result,
            param: record.param,
            video: modelConfig.videoTemplateUrl,
            audio: audioFile,
        });
        // console.log('VideoGen.runFunc.res', res)
        if (res.code) {
            throw res.msg || "apiRequest videoGen fail";
        }
        switch (res.data.type) {
            case "success":
                await TaskService.update(bizId, {
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
        // console.log('VideoGen.successFunc', {bizId, bizParam})
        const { record } = await serverStore.prepareForTask(bizId, bizParam);
        // console.log('VideoGen.successFunc.record', {record, server})
        await TaskService.update(bizId, {
            status: "success",
            endTime: Date.now(),
            result: {
                url: await DataService.saveFile(record.jobResult.data.data.url),
            },
        });
    },
    failFunc: async (bizId, msg, bizParam) => {
        // console.log('VideoGen.failFunc', {bizId, bizParam, msg})
        // const {record, server} = await prepareData(bizId, bizParam)
        await TaskService.update(bizId, {
            status: "fail",
            statusMsg: msg,
            endTime: Date.now(),
        });
    },
};
