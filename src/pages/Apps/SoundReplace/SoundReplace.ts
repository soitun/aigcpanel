import {t} from "../../../lang";
import {TaskService} from "../../../service/TaskService";
import {useServerStore} from "../../../store/modules/server";
import {TaskBiz, useTaskStore} from "../../../store/modules/task";
import {SoundReplaceJobResultType, SoundReplaceModelConfigType} from "./type";

const serverStore = useServerStore();
const taskStore = useTaskStore();

export const SoundReplace: TaskBiz = {
    runFunc: async (bizId, bizParam) => {
        // console.log('SoundReplace.runFunc', {bizId, bizParam})
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
                    jobResult.SoundAsr = res.data as any;
                    break;
                case "retry":
                    return "retry";
                default:
                    throw `unknown res.data.type : ${res.data.type}`;
            }
            await TaskService.update(bizId, {jobResult});
            if (
                !jobResult.SoundAsr.data ||
                !jobResult.SoundAsr.data.records ||
                jobResult.SoundAsr.data.records.length === 0
            ) {
                throw "SoundAsr 识别结果为空，请检查音频文件是否正常";
            }
            jobResult.step = "Confirm";
            await TaskService.update(bizId, {jobResult});
            return "success";
        }
        if (jobResult.step === "Confirm") {
            return "success";
        }
        if (jobResult.step === "SoundGenerate") {
            const server = await serverStore.getByNameVersion(
                modelConfig.soundGenerate.serverName,
                modelConfig.soundGenerate.serverVersion
            );
            if (!server) {
                throw "SoundGenerate server not found: " + modelConfig.soundGenerate.serverName;
            }
            const serverInfo = await serverStore.serverInfo(server);
            let res;
            if (modelConfig.soundGenerate.type == "SoundTts") {
                // res = await window.$mapi.server.callFunctionWithException(serverInfo, "soundTts", {
                //     id: serverStore.generateTaskId("SoundReplace", bizId),
                //     result: jobResult.SoundGenerate,
                //     param: modelConfig.soundGenerate.ttsParam,
                //     // text: modelConfig.soundGenerate,
                // });
            }
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
