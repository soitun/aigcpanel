import {t} from "../../../lang";
import {ObjectUtil} from "../../../lib/util";
import {TaskService} from "../../../service/TaskService";
import {useServerStore} from "../../../store/modules/server";
import {TaskBiz, useTaskStore} from "../../../store/modules/task";
import {SoundReplaceJobResultType, SoundReplaceModelConfigType} from "./type";

const serverStore = useServerStore();
const taskStore = useTaskStore();

export const SoundReplace: TaskBiz = {
    runFunc: async (bizId, bizParam) => {
        console.log("SoundReplace.runFunc", {bizId, bizParam});
        const {record} = await serverStore.prepareForTask(bizId, bizParam);
        const modelConfig: SoundReplaceModelConfigType = record.modelConfig;
        const jobResult: SoundReplaceJobResultType = record.jobResult;

        jobResult.step = jobResult.step || "ToAudio";
        if (jobResult.step === "ToAudio") {
            // console.log('SoundReplace.runFunc.serverInfo', serverInfo)
            await TaskService.update(bizId, {
                status: "running",
                jobResult,
            });
            taskStore.fireChange({biz: "SoundReplace", bizId}, "running");
            const file = await window.$mapi.file.temp("mp3");
            await window.$mapi.ffmpeg.run([
                "-y",
                "-i",
                modelConfig.video,
                "-vn",
                "-acodec",
                "libmp3lame",
                "-ac",
                "1",
                "-ar",
                "16000",
                file,
            ]);
            if (!(await window.$mapi.file.exists(file, {isFullPath: true}))) {
                throw "转换成为音频失败，请检查视频文件是否存在或ffmpeg是否正常工作";
            }
            jobResult.ToAudio = {
                file,
            };
            jobResult.step = "SoundAsr";
            await TaskService.update(bizId, {jobResult});
        }
        if (jobResult.step === "SoundAsr") {
            jobResult.SoundAsr = jobResult.SoundAsr || {};
            await TaskService.update(bizId, {
                status: "running",
            });
            taskStore.fireChange({biz: "SoundReplace", bizId}, "running");
            const server = await serverStore.getByKey(modelConfig.soundAsr.serverKey);
            if (!server) {
                throw `SoundAsr server not found: ${modelConfig.soundAsr.serverKey}`;
            }
            const serverInfo = await serverStore.serverInfo(server);
            const res = await window.$mapi.server.callFunctionWithException(serverInfo, "asr", {
                id: serverStore.generateTaskId("SoundReplace", bizId),
                result: jobResult.SoundAsr,
                param: modelConfig.soundAsr.param,
                audio: jobResult.ToAudio.file,
            });
            if (res.code) {
                throw res.msg || "SoundAsr run fail";
            }
            switch (res.data.type) {
                case "success":
                    jobResult.SoundAsr.start = res.data.start;
                    jobResult.SoundAsr.end = res.data.end;
                    jobResult.SoundAsr.records = res.data.data.records || [];
                    break;
                case "retry":
                    return "retry";
                default:
                    throw `unknown res.data.type : ${res.data.type}`;
            }
            await TaskService.update(bizId, {jobResult});
            if (!jobResult.SoundAsr.records || !jobResult.SoundAsr.records.length) {
                throw "SoundAsr 识别结果为空，请检查音频文件是否正常";
            }
            jobResult.step = "Confirm";
            await TaskService.update(bizId, {jobResult});
        }
        if (jobResult.step === "Confirm") {
            jobResult.Confirm = jobResult.Confirm || {};
            jobResult.Confirm.records = ObjectUtil.clone(jobResult.SoundAsr.records);
            jobResult.Confirm.confirm = false;
            await TaskService.update(bizId, {jobResult});
            return "success";
        }
        if (jobResult.step === "SoundGenerate") {
            jobResult.SoundGenerate = jobResult.SoundGenerate || {};
            jobResult.SoundGenerate.records = jobResult.Confirm.records.map(item => ({
                ...item,
                audio: "",
            }));
            await TaskService.update(bizId, {jobResult});
            await TaskService.update(bizId, {
                status: "running",
            });
            taskStore.fireChange({biz: "SoundReplace", bizId}, "running");
            const server = await serverStore.getByNameVersion(
                modelConfig.soundGenerate.serverName,
                modelConfig.soundGenerate.serverVersion
            );
            if (!server) {
                throw "SoundGenerate server not found: " + modelConfig.soundGenerate.serverName;
            }
            const serverInfo = await serverStore.serverInfo(server);
            for (const record of jobResult.SoundGenerate.records) {
                if (record.audio) {
                    continue;
                }
                console.log("SoundReplace.runFunc.soundGenerate", {record, serverInfo});
                let res;
                if (modelConfig.soundGenerate.type == "SoundTts") {
                    res = await window.$mapi.server.callFunctionWithException(serverInfo, "soundTts", {
                        id: serverStore.generateTaskId("SoundReplace", bizId),
                        result: {},
                        param: modelConfig.soundGenerate.ttsParam,
                        text: record.text,
                    });
                } else if (modelConfig.soundGenerate.type == "SoundClone") {
                    res = await window.$mapi.server.callFunctionWithException(serverInfo, "soundClone", {
                        id: serverStore.generateTaskId("SoundReplace", bizId),
                        result: {},
                        param: modelConfig.soundGenerate.cloneParam,
                        text: record.text,
                        promptAudio: modelConfig.soundGenerate.promptUrl,
                        promptText: modelConfig.soundGenerate.promptText,
                    });
                } else {
                    throw `unknown soundGenerate type: ${modelConfig.soundGenerate.type}`;
                }
                console.log("SoundReplace.runFunc.soundGenerate.res", res);
                if (res.code) {
                    throw res.msg || "SoundGenerate fail";
                }
                switch (res.data.type) {
                    case "success":
                        record.audio = res.data.data.url;
                        await TaskService.update(bizId, {jobResult});
                        break;
                    case "retry":
                        return "retry";
                    default:
                        throw `unknown res.data.type : ${res.data.type}`;
                }
            }
            jobResult.step = "Combile";
            await TaskService.update(bizId, {jobResult});
        }
        if (jobResult.step === "Combile") {
            throw "Combile step not implemented yet";
        }
        throw `SoundReplace.runFunc: unknown jobResult.step: ${jobResult.step}`;
    },
    successFunc: async (bizId, bizParam) => {
        const {record} = await serverStore.prepareForTask(bizId, bizParam);
        const jobResult: SoundReplaceJobResultType = record.jobResult;
        if (jobResult.step === "Confirm") {
            await TaskService.update(bizId, {
                status: "pause",
                statusMsg: t("任务未完成，需要手动确认文字"),
            });
        }
        // if (jobResult.step === "xxx") {
        //     await TaskService.update(bizId, {
        //         status: "success",
        //         endTime: Date.now(),
        //         result: {
        //             records: jobResult.data.data.records,
        //         },
        //     });
        // } else {

        // }
    },
    failFunc: async (bizId, msg, bizParam) => {
        // console.log('SoundReplace.failFunc', {bizId, bizParam, msg})
        await TaskService.update(bizId, {
            status: "fail",
            statusMsg: msg,
            endTime: Date.now(),
        });
    },
    update: async (bizId, data, bizParam) => {
        console.log("SoundReplace.update", {bizId, data, bizParam});
    },
};
